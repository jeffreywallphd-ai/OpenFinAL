const { ipcContracts, registerHandle } = require('../../shared/ipc');

function registerDatabaseHandlers({ ipcMain, databaseService }) {
  const registerQuery = (contract, mode, parameterField = 'parameters') => {
    registerHandle(ipcMain, contract, (payload) => databaseService.execute({
      query: payload.query,
      parameters: payload[parameterField],
      mode,
    }));
  };

  registerHandle(ipcMain, ipcContracts.database.sqliteExists, () => databaseService.sqliteExists());
  registerHandle(ipcMain, ipcContracts.database.sqliteInit, ({ schema }) => databaseService.initDatabase(schema));
  registerQuery(ipcContracts.database.selectData, 'all', 'inputData');
  registerQuery(ipcContracts.database.sqliteQuery, 'all');
  registerQuery(ipcContracts.database.sqliteGet, 'get');
  registerQuery(ipcContracts.database.sqliteInsert, 'run');
  registerQuery(ipcContracts.database.sqliteUpdate, 'run');
  registerQuery(ipcContracts.database.sqliteDelete, 'run');
}

module.exports = {
  registerDatabaseHandlers,
};
