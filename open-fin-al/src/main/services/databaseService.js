function createDatabaseService({
  fs,
  path,
  app,
  Database,
  MigrationManager,
  logger = console,
}) {
  const dbFileName = 'OpenFinAL.sqlite';
  const dbPath = path.join(app.getPath('userData'), dbFileName);
  const migrationsPath = path.join(app.getAppPath(), 'src', 'Database', 'migrations');

  let db;
  let migrationsApplied = false;

  function sqliteExists() {
    try {
      return fs.existsSync(dbPath);
    } catch (error) {
      logger.error('Error checking for SQLite database:', error);
      return false;
    }
  }

  function openConnection() {
    if (db) {
      return db;
    }

    db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');

    return db;
  }

  function hasTable(tableName) {
    const database = openConnection();
    const row = database.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
    ).get(tableName);

    return Boolean(row);
  }

  async function runMigrations({ force = false } = {}) {
    const database = openConnection();

    if (migrationsApplied && !force) {
      return [];
    }

    if (!fs.existsSync(migrationsPath) || !hasTable('User')) {
      migrationsApplied = true;
      return [];
    }

    const migrationManager = new MigrationManager(database, migrationsPath, { logger });
    const appliedMigrations = await migrationManager.runMigrations();
    migrationsApplied = true;

    return appliedMigrations;
  }

  async function ensureDB() {
    const databaseExists = sqliteExists();
    const database = openConnection();

    if (databaseExists) {
      await runMigrations();
    }

    return database;
  }

  async function execute({ query, parameters = [], mode = 'all' }) {
    const database = await ensureDB();
    const statement = database.prepare(query);
    const values = Array.isArray(parameters) ? parameters : [];

    switch (mode) {
      case 'get':
        return statement.get(...values);
      case 'run': {
        const result = statement.run(...values);

        if (query.trim().toUpperCase().startsWith('INSERT')) {
          const lastID = typeof result.lastInsertRowid === 'bigint'
            ? Number(result.lastInsertRowid)
            : result.lastInsertRowid;

          return { ok: true, lastID };
        }

        return true;
      }
      case 'all':
      default:
        return statement.all(...values);
    }
  }

  async function initDatabase(schema) {
    try {
      const database = openConnection();
      database.exec(schema);
      migrationsApplied = false;
      await runMigrations({ force: true });
      return true;
    } catch (error) {
      logger.error('Error initializing database:', error);
      return false;
    }
  }

  async function queryAll(query, parameters) {
    return execute({ query, parameters, mode: 'all' });
  }

  async function queryOne(query, parameters) {
    return execute({ query, parameters, mode: 'get' });
  }

  async function run(query, parameters) {
    return execute({ query, parameters, mode: 'run' });
  }

  function closeConnection() {
    if (!db) {
      return;
    }

    db.close();
    db = undefined;
    migrationsApplied = false;
  }

  return {
    closeConnection,
    dbPath,
    ensureDB,
    execute,
    hasTable,
    initDatabase,
    openConnection,
    queryAll,
    queryOne,
    run,
    runMigrations,
    sqliteExists,
  };
}

module.exports = {
  createDatabaseService,
};
