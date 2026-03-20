const { ipcContracts, registerHandle } = require('../../shared/ipc');

function registerFileHandlers({ ipcMain, fileService }) {
  registerHandle(ipcMain, ipcContracts.files.read, (filePath) => fileService.readFromFile(filePath));
  registerHandle(ipcMain, ipcContracts.files.readBinary, (filePath) => fileService.readFromFileBinary(filePath));
}

module.exports = {
  registerFileHandlers,
};
