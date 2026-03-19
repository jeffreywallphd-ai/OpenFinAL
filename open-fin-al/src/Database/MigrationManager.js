const { readFileSync, readdirSync } = require('fs');
const { join } = require('path');

class MigrationManager {
  constructor(db, migrationsPath, { logger = console } = {}) {
    this.db = db;
    this.migrationsPath = migrationsPath;
    this.logger = logger;
    this.initializeMigrationsTable();
  }

  initializeMigrationsTable() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT UNIQUE NOT NULL,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async runMigrations() {
    const appliedMigrations = [];
    const migrationFiles = this.getMigrationFiles();
    const executedMigrations = new Set(this.getExecutedMigrations());

    for (const filename of migrationFiles) {
      if (executedMigrations.has(filename)) {
        continue;
      }

      try {
        await this.executeMigration(filename);
      } catch (error) {
        if (!this.isSkippableMigrationError(error)) {
          throw error;
        }

        this.logger.warn(`Skipping already-applied migration ${filename}: ${error.message}`);
      }

      this.markMigrationAsExecuted(filename);
      appliedMigrations.push(filename);
    }

    return appliedMigrations;
  }

  getMigrationFiles() {
    try {
      return readdirSync(this.migrationsPath)
        .filter((file) => file.endsWith('.sql'))
        .sort();
    } catch (_error) {
      return [];
    }
  }

  getExecutedMigrations() {
    const stmt = this.db.prepare('SELECT filename FROM migrations ORDER BY id');
    const rows = stmt.all();
    return rows.map((row) => row.filename);
  }

  async executeMigration(filename) {
    const filePath = join(this.migrationsPath, filename);
    const sql = readFileSync(filePath, 'utf-8');

    this.db.pragma('writable_schema = ON');

    try {
      this.db.exec(sql);
    } finally {
      this.db.pragma('writable_schema = OFF');
    }
  }

  isSkippableMigrationError(error) {
    return Boolean(error?.message && error.message.includes('duplicate column name'));
  }

  markMigrationAsExecuted(filename) {
    const stmt = this.db.prepare('INSERT INTO migrations (filename) VALUES (?)');
    stmt.run(filename);
  }

  getAppliedMigrations() {
    return this.getExecutedMigrations();
  }
}

module.exports = { MigrationManager };
