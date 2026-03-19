const { ipcContracts, registerHandle } = require('../../IPC/contracts');

function registerDatabaseHandlers({ ipcMain, databaseService, logger = console }) {
  registerHandle(ipcMain, ipcContracts.database.sqliteExists, () => databaseService.sqliteExists());
  registerHandle(ipcMain, ipcContracts.database.sqliteInit, ({ schema }) => databaseService.initDatabase(schema));
  registerHandle(ipcMain, ipcContracts.database.selectData, ({ query, inputData }) => databaseService.queryAll(query, inputData));
  registerHandle(ipcMain, ipcContracts.database.sqliteQuery, ({ query, parameters }) => databaseService.queryAll(query, parameters));
  registerHandle(ipcMain, ipcContracts.database.sqliteGet, ({ query, parameters }) => databaseService.queryOne(query, parameters));
  registerHandle(ipcMain, ipcContracts.database.sqliteInsert, ({ query, parameters }) => databaseService.run(query, parameters));
  registerHandle(ipcMain, ipcContracts.database.sqliteUpdate, ({ query, parameters }) => {
    logger.log('Executing query:', query, 'with parameters:', parameters);
    return databaseService.run(query, parameters);
  });
  registerHandle(ipcMain, ipcContracts.database.sqliteDelete, ({ query, parameters }) => databaseService.run(query, parameters));
}

module.exports = {
  registerDatabaseHandlers,
};
