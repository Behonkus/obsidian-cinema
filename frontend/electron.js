const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');

// Keep a global reference of the window object
let mainWindow;
let backendProcess;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const BACKEND_PORT = 8001;
const FRONTEND_PORT = isDev ? 3000 : 8001;

// ============ AUTO-UPDATER CONFIGURATION ============

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, let user decide
autoUpdater.autoInstallOnAppQuit = true;

// Update state
let updateAvailable = null;
let downloadProgress = 0;
let isDownloading = false;

// Auto-updater event handlers
autoUpdater.on('checking-for-update', () => {
  console.log('Checking for updates...');
  sendUpdateStatus('checking');
});

autoUpdater.on('update-available', (info) => {
  console.log('Update available:', info.version);
  updateAvailable = {
    version: info.version,
    releaseDate: info.releaseDate,
    releaseNotes: info.releaseNotes
  };
  sendUpdateStatus('available', updateAvailable);
});

autoUpdater.on('update-not-available', (info) => {
  console.log('No updates available');
  sendUpdateStatus('not-available');
});

autoUpdater.on('error', (err) => {
  console.error('Update error:', err);
  sendUpdateStatus('error', { message: err.message });
});

autoUpdater.on('download-progress', (progressObj) => {
  downloadProgress = progressObj.percent;
  isDownloading = true;
  sendUpdateStatus('downloading', {
    percent: progressObj.percent,
    bytesPerSecond: progressObj.bytesPerSecond,
    transferred: progressObj.transferred,
    total: progressObj.total
  });
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('Update downloaded');
  isDownloading = false;
  sendUpdateStatus('downloaded', {
    version: info.version,
    releaseNotes: info.releaseNotes
  });
});

// Send update status to renderer
function sendUpdateStatus(status, data = null) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-status', { status, data });
  }
}

// IPC Handlers for updates
ipcMain.handle('update:check', async () => {
  if (isDev) {
    console.log('Skipping update check in development mode');
    return { status: 'dev-mode' };
  }
  
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'checking', result };
  } catch (err) {
    console.error('Failed to check for updates:', err);
    return { status: 'error', message: err.message };
  }
});

ipcMain.handle('update:download', async () => {
  if (!updateAvailable) {
    return { status: 'no-update' };
  }
  
  try {
    await autoUpdater.downloadUpdate();
    return { status: 'downloading' };
  } catch (err) {
    console.error('Failed to download update:', err);
    return { status: 'error', message: err.message };
  }
});

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('update:getStatus', () => {
  return {
    updateAvailable,
    downloadProgress,
    isDownloading,
    currentVersion: app.getVersion()
  };
});

// ============ LICENSE MANAGEMENT ============

// License storage path
const getLicenseFilePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'license.json');
};

// Generate a unique machine ID based on hardware
const generateMachineId = () => {
  const os = require('os');
  const cpus = os.cpus();
  const hostname = os.hostname();
  const platform = os.platform();
  const arch = os.arch();
  const networkInterfaces = os.networkInterfaces();
  
  // Get first non-internal MAC address
  let macAddress = '';
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if (!iface.internal && iface.mac && iface.mac !== '00:00:00:00:00:00') {
        macAddress = iface.mac;
        break;
      }
    }
    if (macAddress) break;
  }
  
  // Combine hardware info to create unique ID
  const machineData = `${hostname}-${platform}-${arch}-${cpus[0]?.model || ''}-${macAddress}`;
  return crypto.createHash('sha256').update(machineData).digest('hex').substring(0, 32).toUpperCase();
};

// License management functions
const getLicenseData = () => {
  try {
    const licensePath = getLicenseFilePath();
    if (fs.existsSync(licensePath)) {
      const data = fs.readFileSync(licensePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading license:', err);
  }
  return null;
};

const saveLicenseData = (licenseData) => {
  try {
    const licensePath = getLicenseFilePath();
    fs.writeFileSync(licensePath, JSON.stringify(licenseData, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving license:', err);
    return false;
  }
};

const clearLicenseData = () => {
  try {
    const licensePath = getLicenseFilePath();
    if (fs.existsSync(licensePath)) {
      fs.unlinkSync(licensePath);
    }
    return true;
  } catch (err) {
    console.error('Error clearing license:', err);
    return false;
  }
};

// IPC Handlers for license management
ipcMain.handle('license:get', () => {
  return getLicenseData();
});

ipcMain.handle('license:set', (event, licenseData) => {
  return saveLicenseData(licenseData);
});

ipcMain.handle('license:clear', () => {
  return clearLicenseData();
});

ipcMain.handle('license:getMachineId', () => {
  return generateMachineId();
});

// ============ APP INFO & UTILITIES ============

// IPC Handlers for app info
ipcMain.handle('app:version', () => {
  return app.getVersion();
});

// IPC Handlers for file dialogs
ipcMain.handle('dialog:openFile', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    ...options
  });
  return result;
});

ipcMain.handle('dialog:openFolder', async (event, options) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    ...options
  });
  return result;
});

// IPC Handlers for external links
ipcMain.handle('shell:openExternal', (event, url) => {
  shell.openExternal(url);
});

// IPC Handlers for window controls
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

// ============ BACKEND MANAGEMENT ============

// Check if backend is ready
function waitForBackend(retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (attempt) => {
      http.get(`http://localhost:${BACKEND_PORT}/api/`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else if (attempt < retries) {
          setTimeout(() => check(attempt + 1), 500);
        } else {
          reject(new Error('Backend not ready'));
        }
      }).on('error', () => {
        if (attempt < retries) {
          setTimeout(() => check(attempt + 1), 500);
        } else {
          reject(new Error('Backend not responding'));
        }
      });
    };
    check(0);
  });
}

// Start the Python backend
function startBackend() {
  if (isDev) {
    console.log('Development mode - assuming backend is running separately');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const backendPath = path.join(process.resourcesPath, 'backend');
    const pythonPath = process.platform === 'win32' 
      ? path.join(backendPath, 'venv', 'Scripts', 'python.exe')
      : path.join(backendPath, 'venv', 'bin', 'python');
    
    const serverScript = path.join(backendPath, 'server.py');
    
    console.log('Starting backend:', pythonPath, serverScript);
    
    backendProcess = spawn(pythonPath, ['-u', serverScript], {
      cwd: backendPath,
      env: {
        ...process.env,
        MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017',
        DB_NAME: process.env.DB_NAME || 'obsidian_cinema'
      },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (err) => {
      console.error('Failed to start backend:', err);
      reject(err);
    });

    backendProcess.on('close', (code) => {
      console.log(`Backend process exited with code ${code}`);
    });

    // Give backend time to start
    setTimeout(resolve, 2000);
  });
}

// ============ WINDOW CREATION ============

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron', 'preload.js')
    },
    backgroundColor: '#0a0a0a',
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: true
  });

  // Load the app
  // In production, electron.js is in the build folder, so index.html is in same directory
  const startUrl = isDev 
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'index.html')}`;
  
  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
    
    // Check for updates after window is shown (with delay)
    if (!isDev) {
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch(err => {
          console.error('Auto-update check failed:', err);
        });
      }, 3000);
    }
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Handle mpc-hc:// protocol links
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url.startsWith('mpc-hc://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============ APP LIFECYCLE ============

app.whenReady().then(async () => {
  try {
    await startBackend();
    await waitForBackend();
    createWindow();
  } catch (err) {
    console.error('Failed to start app:', err);
    // Still try to create window - might be dev mode
    createWindow();
  }
});

app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});
