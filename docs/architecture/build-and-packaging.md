# Desktop build and packaging workflow

This repository contains a desktop Electron application in `open-fin-al/`. The project currently uses **Electron Forge as the official day-to-day build and packaging workflow** and keeps **Electron Builder only for a Windows portable distribution artifact**.

## Official workflow summary

### Development
- Run `npm start` from `open-fin-al/` for local development.
- `npm run dev` is an alias for the same Electron Forge startup path.
- Use `npm run debug`, `npm run debug-main`, or `npm run debug-renderer` when Electron or renderer debugging is needed.

### Validation
- Run `npm run lint` to execute the enforced architecture-boundary check.
- Run `npm test` for Jest tests.
- Run `npm run verify` to execute both lint and tests in sequence.

### Packaging and release
- Run `npm run package` to create an unpacked packaged app with **Electron Forge**.
- Run `npm run make` or `npm run build` to create distributable artifacts with **Electron Forge makers**.
- Run `npm run publish` only when using Forge's publish flow.

## Why Electron Forge is the primary path

Electron Forge is the primary workflow because it already owns the active desktop developer experience and package pipeline:

- `npm start` uses `electron-forge start`.
- Webpack bundling is configured through `@electron-forge/plugin-webpack`.
- Native module handling is integrated with `@electron-forge/plugin-auto-unpack-natives`.
- The custom `copy-dependencies` Forge plugin copies runtime dependencies into the Forge packaging output.
- Cross-platform makers are already configured in `forge.config.js` for Windows installers and Linux/macOS packaging outputs.

In practice, that means Forge is the path contributors interact with during development, test packaging, and standard release packaging.

## Why Electron Builder still remains

Electron Builder is retained for **one narrow purpose**: producing a **Windows portable** build through `npm run build:portable`.

That flow exists because the repository already carries Builder-specific handling for the packaged `better-sqlite3` native module:

- `electron-builder.json` unpacks `.node` binaries.
- It copies the `better-sqlite3` binary and package metadata into the final artifact.
- It targets `portable` for Windows rather than the installer-style maker outputs managed by Forge.

This makes Builder a secondary, release-oriented packaging path rather than a competing default build system.

## Script map after cleanup

From `open-fin-al/package.json`:

- `npm start` / `npm run dev`: official local development entry point.
- `npm run package`: Forge package output for local packaging verification.
- `npm run make`: Forge distributable artifact generation.
- `npm run build`: alias to the official Forge distributable flow.
- `npm run build:portable`: Builder-based Windows portable artifact.
- `npm run verify`: lint + tests.

## Supported release flows

### Standard release flow
1. Install dependencies in `open-fin-al/`.
2. Run `npm run verify`.
3. Run `npm run make`.
4. Collect the generated Forge artifacts from the Forge output directory.

### Windows portable release flow
1. Install dependencies in `open-fin-al/`.
2. Run `npm run verify`.
3. Run `npm run build:portable`.
4. Collect the generated portable executable from the Builder output directory.

## Native module packaging notes

This project depends on `better-sqlite3`, so packaging must continue to account for native binaries.

- `postinstall` runs `electron-rebuild` for the pinned Electron runtime.
- Forge packaging relies on auto-unpack-natives plus the custom dependency-copy plugin.
- Builder packaging relies on `electron-builder.json` entries for `asarUnpack`, `extraResources`, and file inclusion rules.

Any future packaging refactor should verify `better-sqlite3` loading in both development and packaged builds before removing either of these safeguards.

## Lint status and next step

`npm run lint` currently enforces **architecture boundaries**, not full style linting.

That is still useful because it protects the project's current renderer/main-process layering, but it should not be mistaken for a complete ESLint replacement. A sensible next step would be:

1. add a repository ESLint config scoped first to `scripts/`, Forge config files, and `src/main/`;
2. fix low-risk violations in those areas;
3. then expand lint coverage to renderer code in stages.

Until that broader work is done, `npm run lint` should be treated as an architectural safety check rather than a comprehensive code-style gate.
