function registerFileHandlers({ ipcMain, fileService }) {
  ipcMain.handle('read-file', (_event, file) => fileService.readFromFile(file));
  ipcMain.handle('read-binary', (_event, file) => fileService.readFromFileBinary(file));
}

module.exports = {
  registerFileHandlers,
};
