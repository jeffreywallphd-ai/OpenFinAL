function createDatabaseService({ sqlite3, fs, path, app, Database, MigrationManager, logger = console }) {
  const dbFileName = 'OpenFinAL.sqlite';
  const dbPath = path.join(app.getPath('userData'), dbFileName);

  let db;
  let betterDb;

  async function runMigrations() {
    try {
      if (!betterDb) {
        return;
      }

      const migrationsPath = path.join(__dirname, 'Database/migrations');
      const migrationManager = new MigrationManager(betterDb, migrationsPath);
      await migrationManager.runMigrations();
    } catch (error) {
      throw error;
    }
  }

  async function sqliteExists() {
    try {
      return fs.existsSync(dbPath);
    } catch (error) {
      logger.log(error);
      return false;
    }
  }

  async function getDB() {
    try {
      db = new sqlite3.Database(dbPath, () => {});

      // Also initialize better-sqlite3 for migrations
      // betterDb = new Database(dbPath);
      // await runMigrations();

      return db;
    } catch (_error) {
      return null;
    }
  }

  async function ensureDB() {
    if (!db) {
      await getDB();
    }

    return db;
  }

  async function initDatabase(schema) {
    try {
      await ensureDB();
      db.exec(schema);
      return true;
    } catch (error) {
      logger.error('Error initializing database:', error);
      return false;
    }
  }

  async function queryAll(query, dataArray) {
    await ensureDB();

    return await new Promise((resolve, reject) => {
      try {
        db.all(query, dataArray, (error, rows) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(rows.map((row) => row));
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async function queryOne(query, dataArray) {
    await ensureDB();

    return await new Promise((resolve, reject) => {
      try {
        db.get(query, dataArray, (error, data) => {
          if (error) {
            reject(error);
            return;
          }

          resolve(data);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  async function run(query, dataArray) {
    await ensureDB();

    return await new Promise((resolve, reject) => {
      try {
        db.run(query, dataArray, function onRun(error) {
          if (error) {
            reject(error);
            return;
          }

          if (query.toUpperCase().startsWith('INSERT')) {
            resolve({ ok: true, lastID: this.lastID });
            return;
          }

          resolve(true);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  return {
    dbPath,
    ensureDB,
    getDB,
    initDatabase,
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
