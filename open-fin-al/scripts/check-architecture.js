#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const srcRoot = path.join(projectRoot, 'src');
const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx'];
const aliasMap = {
  '@Entity/': 'Entity/',
  '@DataGateway/': 'Gateway/Data/',
  '@Interactor/': 'Interactor/',
  '@View/': 'View/',
  '@domain/': 'domain/',
  '@application/': 'application/',
  '@infrastructure/': 'infrastructure/',
  '@ui/': 'ui/',
  '@shared/': 'shared/',
};

const files = collectFiles(srcRoot).filter((filePath) => {
  if (filePath.includes(`${path.sep}tests${path.sep}`)) {
    return false;
  }

  return allowedExtensions.includes(path.extname(filePath));
});

const rules = [
  {
    name: 'Entity modules must stay free of Electron/main/view/infrastructure imports',
    filePrefix: path.join(srcRoot, 'Entity') + path.sep,
    forbidImportsFrom: [
      path.join(srcRoot, 'main') + path.sep,
      path.join(srcRoot, 'View') + path.sep,
      path.join(srcRoot, 'infrastructure') + path.sep,
      path.join(srcRoot, 'ui') + path.sep,
    ],
    forbidPackages: ['electron'],
    forbidWindow: true,
  },
  {
    name: 'Application service definitions must stay framework-agnostic',
    filePrefixes: [
      path.join(srcRoot, 'application') + path.sep,
      path.join(srcRoot, 'domain') + path.sep,
    ],
    forbidImportsFrom: [
      path.join(srcRoot, 'main') + path.sep,
      path.join(srcRoot, 'View') + path.sep,
      path.join(srcRoot, 'infrastructure') + path.sep,
      path.join(srcRoot, 'ui') + path.sep,
    ],
    forbidPackages: ['electron'],
    forbidWindow: true,
  },
  {
    name: 'Main process code must not import renderer-side layers',
    filePrefix: path.join(srcRoot, 'main') + path.sep,
    forbidImportsFrom: [
      path.join(srcRoot, 'View') + path.sep,
      path.join(srcRoot, 'Interactor') + path.sep,
      path.join(srcRoot, 'Gateway') + path.sep,
      path.join(srcRoot, 'Entity') + path.sep,
      path.join(srcRoot, 'Utility') + path.sep,
      path.join(srcRoot, 'application') + path.sep,
      path.join(srcRoot, 'infrastructure') + path.sep,
      path.join(srcRoot, 'ui') + path.sep,
    ],
  },
  {
    name: 'Renderer-side layers must not import main-process modules',
    filePrefixes: [
      path.join(srcRoot, 'View') + path.sep,
      path.join(srcRoot, 'Interactor') + path.sep,
      path.join(srcRoot, 'Gateway') + path.sep,
      path.join(srcRoot, 'Entity') + path.sep,
      path.join(srcRoot, 'Utility') + path.sep,
      path.join(srcRoot, 'application') + path.sep,
      path.join(srcRoot, 'infrastructure') + path.sep,
      path.join(srcRoot, 'ui') + path.sep,
    ],
    forbidImportsFrom: [path.join(srcRoot, 'main') + path.sep],
  },
];

const violations = [];

for (const filePath of files) {
  const source = fs.readFileSync(filePath, 'utf8');
  const imports = extractImports(source).map((entry) => ({
    ...entry,
    resolvedPath: resolveImport(filePath, entry.specifier),
  }));

  for (const rule of matchingRules(filePath)) {
    for (const entry of imports) {
      if (entry.resolvedPath && rule.forbidImportsFrom?.some((prefix) => entry.resolvedPath.startsWith(prefix))) {
        violations.push(formatViolation(rule.name, filePath, entry.line, `forbidden import '${entry.specifier}'`));
      }

      if (rule.forbidPackages?.includes(entry.specifier) || rule.forbidPackages?.some((pkg) => entry.specifier.startsWith(`${pkg}/`))) {
        violations.push(formatViolation(rule.name, filePath, entry.line, `forbidden package '${entry.specifier}'`));
      }
    }

    if (rule.forbidWindow) {
      for (const match of source.matchAll(/\bwindow\s*\./g)) {
        violations.push(formatViolation(rule.name, filePath, lineNumberForIndex(source, match.index), 'forbidden window.* usage'));
      }
    }
  }
}

if (violations.length > 0) {
  console.error('Architecture boundary violations found:\n');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}

console.log(`Architecture checks passed for ${files.length} source files.`);

function collectFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const results = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
      continue;
    }
    results.push(fullPath);
  }

  return results;
}

function extractImports(source) {
  const results = [];
  const patterns = [
    /import\s+(?:[^'"`]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /require\(\s*['"]([^'"]+)['"]\s*\)/g,
    /import\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      results.push({
        specifier: match[1],
        line: lineNumberForIndex(source, match.index),
      });
    }
  }

  return results;
}

function resolveImport(fromFile, specifier) {
  if (specifier.startsWith('.')) {
    return resolveRelativeImport(fromFile, specifier);
  }

  for (const [alias, mappedPrefix] of Object.entries(aliasMap)) {
    if (specifier.startsWith(alias)) {
      return resolveAbsoluteImport(path.join(srcRoot, mappedPrefix, specifier.slice(alias.length)));
    }
  }

  if (specifier.startsWith('/')) {
    return resolveAbsoluteImport(specifier);
  }

  return null;
}

function resolveRelativeImport(fromFile, specifier) {
  const basePath = path.resolve(path.dirname(fromFile), specifier);
  return resolveAbsoluteImport(basePath);
}

function resolveAbsoluteImport(basePath) {
  const candidates = [
    basePath,
    ...allowedExtensions.map((extension) => `${basePath}${extension}`),
    ...allowedExtensions.map((extension) => path.join(basePath, `index${extension}`)),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return path.normalize(candidate);
    }
  }

  return path.normalize(basePath);
}

function matchingRules(filePath) {
  return rules.filter((rule) => {
    if (rule.filePrefix) {
      return filePath.startsWith(rule.filePrefix);
    }

    return rule.filePrefixes?.some((prefix) => filePath.startsWith(prefix));
  });
}

function formatViolation(ruleName, filePath, line, message) {
  return `${path.relative(projectRoot, filePath)}:${line} [${ruleName}] ${message}`;
}

function lineNumberForIndex(source, index = 0) {
  return source.slice(0, index).split('\n').length;
}
