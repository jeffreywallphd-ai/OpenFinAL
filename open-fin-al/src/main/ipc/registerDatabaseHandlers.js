function registerDatabaseHandlers({ ipcMain, databaseService, logger = console }) {
  ipcMain.handle('sqlite-exists', () => databaseService.sqliteExists());
  ipcMain.handle('sqlite-init', (_event, schema) => databaseService.initDatabase(schema));
  ipcMain.handle('select-data', (_event, args) => databaseService.queryAll(args.query, args.inputData));
  ipcMain.handle('sqlite-query', (_event, args) => databaseService.queryAll(args.query, args.parameters));
  ipcMain.handle('sqlite-get', (_event, args) => databaseService.queryOne(args.query, args.parameters));
  ipcMain.handle('sqlite-insert', (_event, args) => databaseService.run(args.query, args.parameters));
  ipcMain.handle('sqlite-update', (_event, args) => {
    logger.log('Executing query:', args.query, 'with parameters:', args.parameters);
    return databaseService.run(args.query, args.parameters);
  });
  ipcMain.handle('sqlite-delete', (_event, args) => databaseService.run(args.query, args.parameters));
}

module.exports = {
  registerDatabaseHandlers,
};
