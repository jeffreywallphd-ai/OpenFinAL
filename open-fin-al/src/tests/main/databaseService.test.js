/** @jest-environment node */

const path = require('path');
const { createDatabaseService } = require('../../main/services/databaseService');

function createDatabaseMock({ userTableExists = true, getRow = { id: 1 }, allRows = [{ id: 1 }] } = {}) {
  const statements = [];
  const database = {
    pragma: jest.fn(),
    exec: jest.fn(),
    close: jest.fn(),
    prepare: jest.fn((query) => {
      const statement = {
        query,
        get: jest.fn((...values) => {
          if (query.includes('sqlite_master')) {
            return userTableExists ? { name: 'User' } : undefined;
          }

          return values.length ? { ...getRow, values } : getRow;
        }),
        all: jest.fn((...values) => (values.length ? [{ ...allRows[0], values }] : allRows)),
        run: jest.fn((...values) => ({ lastInsertRowid: values[0] ?? 99 })),
      };

      statements.push(statement);
      return statement;
    }),
  };

  return { database, statements };
}

describe('createDatabaseService', () => {
  function createApp() {
    return {
      getPath: jest.fn(() => '/tmp/OpenFinAL'),
      getAppPath: jest.fn(() => '/workspace/OpenFinAL/open-fin-al'),
    };
  }

  it('opens one better-sqlite3 connection and centralizes query modes', async () => {
    const { database, statements } = createDatabaseMock();
    const Database = jest.fn(() => database);
    const service = createDatabaseService({
      fs: { existsSync: jest.fn(() => true) },
      path,
      app: createApp(),
      Database,
      MigrationManager: jest.fn().mockImplementation(() => ({ runMigrations: jest.fn(async () => []) })),
    });

    await expect(service.queryAll('SELECT * FROM Example WHERE id = ?', [7])).resolves.toEqual([{ id: 1, values: [7] }]);
    await expect(service.queryOne('SELECT * FROM Example WHERE id = ?', [5])).resolves.toEqual({ id: 1, values: [5] });
    await expect(service.run('INSERT INTO Example(name) VALUES (?)', ['demo'])).resolves.toEqual({ ok: true, lastID: 'demo' });

    expect(Database).toHaveBeenCalledTimes(1);
    expect(database.pragma).toHaveBeenCalledWith('foreign_keys = ON');
    expect(database.pragma).toHaveBeenCalledWith('journal_mode = WAL');
    expect(statements.map((statement) => statement.query)).toEqual([
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
      'SELECT * FROM Example WHERE id = ?',
      'SELECT * FROM Example WHERE id = ?',
      'INSERT INTO Example(name) VALUES (?)',
    ]);
  });

  it('runs migrations for existing databases when the base User table is present', async () => {
    const { database } = createDatabaseMock({ userTableExists: true });
    const runMigrations = jest.fn(async () => ['001_add_user_auth_fields.sql']);
    const MigrationManager = jest.fn().mockImplementation(() => ({ runMigrations }));
    const service = createDatabaseService({
      fs: { existsSync: jest.fn((target) => !target.endsWith('missing')) },
      path,
      app: createApp(),
      Database: jest.fn(() => database),
      MigrationManager,
    });

    await service.ensureDB();
    await service.ensureDB();

    expect(MigrationManager).toHaveBeenCalledTimes(1);
    expect(runMigrations).toHaveBeenCalledTimes(1);
  });

  it('defers migrations until after schema initialization when the base tables do not exist yet', async () => {
    const { database } = createDatabaseMock({ userTableExists: false });
    const runMigrations = jest.fn(async () => []);
    const MigrationManager = jest.fn().mockImplementation(() => ({ runMigrations }));
    const service = createDatabaseService({
      fs: { existsSync: jest.fn(() => true) },
      path,
      app: createApp(),
      Database: jest.fn(() => database),
      MigrationManager,
    });

    await service.ensureDB();
    expect(MigrationManager).not.toHaveBeenCalled();

    database.prepare.mockImplementation((query) => ({
      get: jest.fn(() => (query.includes('sqlite_master') ? { name: 'User' } : undefined)),
      all: jest.fn(() => []),
      run: jest.fn(() => ({ lastInsertRowid: 1 })),
    }));

    await expect(service.initDatabase('CREATE TABLE User(id INTEGER PRIMARY KEY);')).resolves.toBe(true);
    expect(database.exec).toHaveBeenCalledWith('CREATE TABLE User(id INTEGER PRIMARY KEY);');
    expect(MigrationManager).toHaveBeenCalledTimes(1);
    expect(runMigrations).toHaveBeenCalledTimes(1);
  });

  it('closes the shared connection and resets migration state', async () => {
    const { database } = createDatabaseMock();
    const Database = jest.fn(() => database);
    const service = createDatabaseService({
      fs: { existsSync: jest.fn(() => false) },
      path,
      app: createApp(),
      Database,
      MigrationManager: jest.fn().mockImplementation(() => ({ runMigrations: jest.fn(async () => []) })),
    });

    await service.ensureDB();
    service.closeConnection();
    await service.ensureDB();

    expect(database.close).toHaveBeenCalledTimes(1);
    expect(Database).toHaveBeenCalledTimes(2);
  });
});
