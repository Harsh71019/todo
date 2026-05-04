const { app, BrowserWindow } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

let backendProcess;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 14 },
    webPreferences: {
      nodeIntegration: true,
    },
  });

  setTimeout(() => {
    win.loadURL('http://localhost:5001');
  }, 2000);
}

app.whenReady().then(() => {
  if (app.isPackaged) {
    // PRODUCTION: The app is a .dmg. Directly run the compiled backend inside Electron.
    require('./dist/index.js');
    createWindow();
  } else {
    // DEVELOPMENT: We are testing locally. Spawn the tsx terminal process.
    backendProcess = spawn(
      /^win/.test(process.platform) ? 'npm.cmd' : 'npm',
      ['run', 'dev'],
      {
        cwd: __dirname,
        stdio: 'inherit',
      },
    );
    createWindow();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
