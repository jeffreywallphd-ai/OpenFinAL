const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const tls = require('tls');
const axios = require('axios');
const cors = require('cors');
const express = require('express');
const puppeteer = require('puppeteer');
const keytar = require('keytar');
const Database = require('better-sqlite3');
const { pipeline, env } = require('@xenova/transformers');
const { app, BrowserWindow, shell, session, ipcMain } = require('electron');
const { MigrationManager } = require('../Database/MigrationManager');
const { createMainWindow } = require('./window/createMainWindow');
const { createUrlWindow } = require('./window/createUrlWindow');
const { registerConfigHandlers } = require('./ipc/registerConfigHandlers');
const { registerVaultHandlers } = require('./ipc/registerVaultHandlers');
const { registerFileHandlers } = require('./ipc/registerFileHandlers');
const { registerDatabaseHandlers } = require('./ipc/registerDatabaseHandlers');
const { registerYahooHandlers } = require('./ipc/registerYahooHandlers');
const { registerTransformersHandlers } = require('./ipc/registerTransformersHandlers');
const { registerPuppeteerHandlers } = require('./ipc/registerPuppeteerHandlers');
const { registerWindowHandlers } = require('./ipc/registerWindowHandlers');
const { createProxyServer } = require('./services/proxyServer');
const { createCertificateService } = require('./services/certificateService');
const { createConfigService } = require('./services/configService');
const { createFileService } = require('./services/fileService');
const { createDatabaseService } = require('./services/databaseService');
const { createTransformersService } = require('./services/transformersService');
const { createYahooFinanceService } = require('./services/yahooFinanceService');
const { createSecretService } = require('./services/secretService');
const { createPuppeteerService } = require('./services/puppeteerService');

let yahooFinanceModule;
function getYF() {
  if (!yahooFinanceModule) {
    yahooFinanceModule = import('yahoo-finance2').then((module) => module.default || module);
  }

  return yahooFinanceModule;
}

function deleteFolderRecursiveSync(folderPath) {
  if (!fs.existsSync(folderPath)) {
    return;
  }

  fs.readdirSync(folderPath).forEach((file) => {
    const currentPath = path.join(folderPath, file);

    if (fs.lstatSync(currentPath).isDirectory()) {
      deleteFolderRecursiveSync(currentPath);
      return;
    }

    fs.unlinkSync(currentPath);
  });

  fs.rmdirSync(folderPath);
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }

  const squirrelEvent = process.argv[1];

  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      app.quit();
      return true;
    case '--squirrel-uninstall': {
      const appDataPath = path.join(app.getPath('appData'), 'OpenFinAL');
      deleteFolderRecursiveSync(appDataPath);
      app.quit();
      return true;
    }
    case '--squirrel-obsolete':
      app.quit();
      return true;
    default:
      return false;
  }
}

function registerContentSecurityPolicy() {
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self';
          script-src 'self' 'unsafe-eval'; 
          style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.gstatic.com https://cdnjs.cloudflare.com; 
          img-src 'self' data: https://*.gstatic.com https://www.investors.com https://imageio.forbes.com https://www.reuters.com https://image.cnbcfm.com https://ml-eu.globenewswire.com https://mma.prnewswire.com https://cdn.benzinga.com https://www.benzinga.com https://editorial-assets.benzinga.com https://contributor-assets.benzinga.com https://staticx-tuner.zacks.com https://media.ycharts.com https://g.foolcdn.com https://ml.globenewswire.com https://images.cointelegraph.com https://s3.cointelegraph.com https://cdn.i-scmp.com https://smallfarmtoday.com/ https://thearorareport.com https://cdn.content.foolcdn.com https://www.marketbeat.com; 
          font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; 
          connect-src 'self' http://localhost:3001 https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://*.hf.co https://*.xethub.hf.co https://cdn-lfs.huggingface.co;`,
        ],
      },
    });
  });
}

function bootstrapMainProcess() {
  const configService = createConfigService({ app, fs, path, os });
  configService.ensureUserDataDirectory();
  configService.getUsername();

  const certificateService = createCertificateService({ keytar, tls, crypto });
  const secretService = createSecretService({ keytar });
  const fileService = createFileService({ fs });
  const databaseService = createDatabaseService({
    fs,
    path,
    app,
    Database,
    MigrationManager,
  });
  const transformersService = createTransformersService({ pipeline, env });
  const yahooFinanceService = createYahooFinanceService({ getYF });
  const puppeteerService = createPuppeteerService({ puppeteer });
  const proxyServer = createProxyServer({
    express,
    cors,
    axios,
    certificateService,
  });

  registerConfigHandlers({ ipcMain, configService });
  registerVaultHandlers({ ipcMain, secretService, certificateService });
  registerFileHandlers({ ipcMain, fileService });
  registerDatabaseHandlers({ ipcMain, databaseService });
  registerYahooHandlers({ ipcMain, yahooFinanceService });
  registerTransformersHandlers({ ipcMain, transformersService });
  registerPuppeteerHandlers({ ipcMain, puppeteerService });

  let mainWindow;
  let urlWindow;

  const openUrlWindow = ({ url, hidden = false }) => {
    const window = createUrlWindow({
      BrowserWindow,
      app,
      path,
      shell,
      url,
      hidden,
      parentWindow: mainWindow,
      onClosed: () => {
        if (!hidden) {
          urlWindow = null;
        }
      },
    });

    return window;
  };

  registerWindowHandlers({
    ipcMain,
    createUrlWindow: openUrlWindow,
    getUrlWindow: () => urlWindow,
    setUrlWindow: (window) => {
      urlWindow = window;
    },
  });

  app.whenReady().then(() => {
    registerContentSecurityPolicy();
    proxyServer.start();

    mainWindow = createMainWindow({
      BrowserWindow,
      preloadEntry: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
      mainWindowEntry: MAIN_WINDOW_WEBPACK_ENTRY,
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        mainWindow = createMainWindow({
          BrowserWindow,
          preloadEntry: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
          mainWindowEntry: MAIN_WINDOW_WEBPACK_ENTRY,
        });
      }
    });
  });

  app.on('before-quit', () => {
    databaseService.closeConnection();
    proxyServer.stop?.();
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
}

module.exports = {
  bootstrapMainProcess,
  deleteFolderRecursiveSync,
  getYF,
  handleSquirrelEvent,
};
