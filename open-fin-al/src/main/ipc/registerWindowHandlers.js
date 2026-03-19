const { extractTextFromUrlWindowSilently } = require('../window/createUrlWindow');

function registerWindowHandlers({ ipcMain, createUrlWindow, getUrlWindow, setUrlWindow }) {
  ipcMain.handle('get-url-body-text-hidden', (_event, url) => {
    return extractTextFromUrlWindowSilently({ createUrlWindow, url });
  });

  ipcMain.on('open-url-window', (_event, url) => {
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
