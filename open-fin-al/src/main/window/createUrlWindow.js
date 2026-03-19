function createUrlWindow({ BrowserWindow, app, path, shell, url, parentWindow, hidden = false, onClosed }) {
  const window = new BrowserWindow({
    show: false,
    parent: hidden ? null : parentWindow,
    title: 'Open FinAL',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      enableRemoteModule: false,
      preload: path.join(app.getAppPath(), 'src/urlWindowPreload.js'),
    },
  });

  if (!hidden) {
    window.maximize();
    window.show();
  }

  window.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  window.loadURL(url);
  window.on('closed', () => {
    if (typeof onClosed === 'function') {
      onClosed();
    }
  });

  return window;
}

function extractTextFromUrlWindowSilently({ createUrlWindow, url }) {
  return new Promise((resolve, reject) => {
    const child = createUrlWindow({ url, hidden: true });

    child.webContents.once('did-finish-load', async () => {
      try {
        const text = await child.webContents.executeJavaScript('window.childWindow.getUrlBodyText()');
        child.close();
        resolve(text);
      } catch (error) {
        child.close();
        reject(error);
      }
    });

    child.on('unresponsive', () => {
      child.close();
      reject(new Error('Child window became unresponsive.'));
    });
  });
}

module.exports = {
  createUrlWindow,
  extractTextFromUrlWindowSilently,
};
