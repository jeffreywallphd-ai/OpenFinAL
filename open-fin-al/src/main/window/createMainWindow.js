function createMainWindow({ BrowserWindow, preloadEntry, mainWindowEntry, onCreate }) {
  const window = new BrowserWindow({
    show: false,
    webPreferences: {
      preload: preloadEntry,
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  window.maximize();
  window.show();
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.loadURL(mainWindowEntry);

  if (typeof onCreate === 'function') {
    onCreate(window);
  }

  return window;
}

module.exports = {
  createMainWindow,
};
