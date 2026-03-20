const { ipcContracts, registerHandle, registerListener } = require('../../shared/ipc');
const { extractTextFromUrlWindowSilently } = require('../window/createUrlWindow');

function registerWindowHandlers({ ipcMain, createUrlWindow, getUrlWindow, setUrlWindow }) {
  registerHandle(ipcMain, ipcContracts.urlWindow.getBodyTextHidden, ({ url }) => {
    return extractTextFromUrlWindowSilently({ createUrlWindow, url });
  });

  registerListener(ipcMain, ipcContracts.urlWindow.open, ({ url }) => {
    const currentWindow = getUrlWindow();

    if (!currentWindow) {
      setUrlWindow(createUrlWindow({ url }));
      return;
    }

    currentWindow.close();
    setUrlWindow(createUrlWindow({ url }));
  });
}

module.exports = {
  registerWindowHandlers,
};
