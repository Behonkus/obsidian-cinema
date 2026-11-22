const { app, BrowserWindow, shell, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const crypto = require('crypto');
const os = require('os');

// Keep a global reference of the window object
let mainWindow;
let backendProcess;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const BACKEND_PORT = 8001;
const FRONTEND_PORT = isDev ? 3000 : 8001;

// Video file extensions to scan for
const VIDEO_EXTENSIONS = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.mpg', '.mpeg', '.3gp', '.ts'];

// ============ LOCAL FILE SYSTEM OPERATIONS ============

// Get list of available drives (Windows). wmic is removed on newer Windows 11,
// so probe every drive letter instead (covers USB, external and mapped network drives).
async function getWindowsDrives() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const probe = (l) => Promise.race([
    fs.promises.access(l + ':\\').then(() => true, () => false),
    new Promise(res => setTimeout(() => res(false), 2000)),
  ]);
  const found = await Promise.all(letters.map(probe));
  const drives = letters.filter((l, i) => found[i]).map(l => ({ name: l + ':', path: l + ':\\' }));
  return drives.length ? drives : [{ name: 'C:', path: 'C:\\' }];
}

// List contents of a directory
function listDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    return items
      .filter(item => {
        // Skip hidden files and system folders
        if (item.name.startsWith('.')) return false;
        if (item.name === '$RECYCLE.BIN') return false;
        if (item.name === 'System Volume Information') return false;
        return true;
      })
      .map(item => ({
        name: item.name,
        path: path.join(dirPath, item.name),
        isDirectory: item.isDirectory()
      }))
      .sort((a, b) => {
        // Directories first, then files
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
  } catch (err) {
    console.error('Error listing directory:', err);
    throw new Error(err.code === 'ENOENT' ? 'Folder not found' : (err.code === 'EPERM' || err.code === 'EACCES') ? 'Access denied' : 'Cannot open this folder');
  }
}

const SYSTEM_DIRS = new Set(['$recycle.bin', 'system volume information', 'config.msi', 'recovery', '$winreagent',
  'windowsapps', 'msocache', 'found.000', '$sysreset', '$windows.~bt', '$windows.~ws', 'documents and settings', 'perflogs', '$getcurrent']);

// Scan directory for video files
function scanForVideos(dirPath, recursive = true, failed = null) {
  const videos = [];
  
  function scan(currentPath) {
    try {
      const items = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item.name);
        
        if (item.isDirectory() && recursive) {
          // Skip hidden and Windows system folders (never contain your media, often locked)
          if (item.name.startsWith('.') || SYSTEM_DIRS.has(item.name.toLowerCase())) {
            continue;
          }
          scan(fullPath);
        } else if (item.isFile()) {
          const ext = path.extname(item.name).toLowerCase();
          if (VIDEO_EXTENSIONS.includes(ext)) {
            // Extract title and year from filename
            const nameWithoutExt = path.basename(item.name, ext);
            const yearMatch = nameWithoutExt.match(/[\(\[\s]*(19|20)\d{2}[\)\]\s]*/);
            const year = yearMatch ? parseInt(yearMatch[0].replace(/[\(\[\]\)\s]/g, '')) : null;
            const title = nameWithoutExt
              .replace(/[\(\[\s]*(19|20)\d{2}[\)\]\s]*/g, '')
              .replace(/\./g, ' ')
              .replace(/[_-]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            videos.push({
              id: crypto.randomUUID(),
              file_path: fullPath,
              file_name: item.name,
              title: title,
              year: year,
              directory_path: currentPath
            });
          }
        }
      }
    } catch (err) {
      console.error('Error scanning:', currentPath, err.message);
      if (failed) failed.push({ path: currentPath, code: err.code || 'ERR' });
    }
  }
  
  scan(dirPath);
  return videos;
}

// Which drives / network shares are reachable right now
async function checkRoots(roots) {
  const probe = (r) => Promise.race([
    fs.promises.access(r).then(() => true, () => false),
    new Promise(res => setTimeout(() => res(false), 2500)),
  ]);
  const ok = await Promise.all((roots || []).map(probe));
  const out = {};
  (roots || []).forEach((r, i) => { out[r] = ok[i]; });
  return out;
}

// IPC Handlers for local file system
ipcMain.handle('fs:getDrives', () => {
  return process.platform === 'win32' ? getWindowsDrives() : [{ name: '/', path: '/' }];
});

ipcMain.handle('fs:checkRoots', (event, roots) => checkRoots(roots));

ipcMain.handle('fs:listDirectory', (event, dirPath) => {
  return listDirectory(dirPath);
});

ipcMain.handle('fs:scanForVideos', (event, dirPath, recursive) => {
  return scanForVideos(dirPath, recursive);
});

// Rescan that also reports folders it couldn't read (offline drive, sleeping NAS, no access)
ipcMain.handle('fs:rescanFolder', (event, dirPath) => {
  const failed = [];
  const videos = scanForVideos(dirPath, true, failed);
  return { videos, failed, reachable: !failed.some(f => f.path === dirPath) };
});

ipcMain.handle('fs:pathExists', (event, checkPath) => {
  return fs.existsSync(checkPath);
});

// Rename a file in place (same folder). Never overwrites an existing file.
ipcMain.handle('fs:renameFile', (event, oldPath, newName) => {
  try {
    if (!oldPath || !newName || /[\\/]/.test(newName)) return { success: false, error: 'Invalid name' };
    if (!fs.existsSync(oldPath)) return { success: false, error: 'File not found' };
    const newPath = path.join(path.dirname(oldPath), newName);
    if (fs.existsSync(newPath)) return { success: false, error: 'A file with that name already exists' };
    fs.renameSync(oldPath, newPath);
    return { success: true, newPath };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// Backup to file system (avoids localStorage quota limits)
const BACKUP_PATH = path.join(app.getPath('userData'), 'library_backup.json');

ipcMain.handle('fs:saveBackup', (event, data) => {
  try {
    fs.writeFileSync(BACKUP_PATH, data, 'utf-8');
    return { ok: true, path: BACKUP_PATH };
  } catch (err) {
    console.error('Failed to save backup:', err);
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('fs:loadBackup', () => {
  try {
    if (fs.existsSync(BACKUP_PATH)) {
      const data = fs.readFileSync(BACKUP_PATH, 'utf-8');
      return { ok: true, data: data };
    }
    return { ok: false, error: 'No backup found' };
  } catch (err) {
    console.error('Failed to load backup:', err);
    return { ok: false, error: err.message };
  }
});


// Movie library stored as a file (no localStorage size limit). Writes are atomic: temp file + rename.
const LIBRARY_PATH = path.join(app.getPath('userData'), 'library.json');
let libraryWriteChain = Promise.resolve();
let libraryWriteGen = 0;

function writeLibrarySync(data) {
  const gen = ++libraryWriteGen;
  const tmp = LIBRARY_PATH + '.' + gen + '.tmp';
  fs.writeFileSync(tmp, data, 'utf-8');
  fs.renameSync(tmp, LIBRARY_PATH);
}

ipcMain.on('library:readSync', (event) => {
  try {
    event.returnValue = fs.existsSync(LIBRARY_PATH) ? fs.readFileSync(LIBRARY_PATH, 'utf-8') : null;
  } catch (err) {
    console.error('Failed to read library:', err);
    event.returnValue = null;
  }
});

ipcMain.on('library:writeSync', (event, data) => {
  try {
    writeLibrarySync(data);
    event.returnValue = true;
  } catch (err) {
    console.error('Failed to write library:', err);
    event.returnValue = false;
  }
});

ipcMain.handle('library:write', (event, data) => {
  const gen = ++libraryWriteGen;
  libraryWriteChain = libraryWriteChain.then(async () => {
    // A newer save (async or sync) supersedes this one
    if (gen !== libraryWriteGen) return true;
    const tmp = LIBRARY_PATH + '.' + gen + '.tmp';
    await fs.promises.writeFile(tmp, data, 'utf-8');
    if (gen !== libraryWriteGen) { fs.promises.unlink(tmp).catch(() => {}); return true; }
    await fs.promises.rename(tmp, LIBRARY_PATH);
    return true;
  }).catch((err) => {
    console.error('Failed to write library:', err);
    return false;
  });
  return libraryWriteChain;
});


// ============ AUTO-UPDATER CONFIGURATION ============

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, let user decide
autoUpdater.autoInstallOnAppQuit = false; // Don't auto-install — let user click "Restart & Install"

// Set GH_TOKEN if available (prevents rate limiting, enables private repos)
if (process.env.GH_TOKEN) {
  autoUpdater.requestHeaders = { Authorization: `token ${process.env.GH_TOKEN}` };
}

// Log the update feed URL for debugging
autoUpdater.logger = {
  info: (...args) => console.log('[AutoUpdater]', ...args),
  warn: (...args) => console.warn('[AutoUpdater]', ...args),
  error: (...args) => console.error('[AutoUpdater]', ...args),
  debug: (...args) => console.log('[AutoUpdater:debug]', ...args),
};

// Update state
let updateAvailable = null;
let downloadProgress = 0;
let isDownloading = false;
let isDownloaded = false;

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
  // Parse error to provide actionable guidance
  const msg = err.message || '';
  let errorType = 'unknown';
  let userMessage = msg;

  if (msg.includes('404') || msg.includes('Not Found') || msg.includes('No published versions')) {
    errorType = 'no-release';
    userMessage = 'No published release found on GitHub. The developer needs to publish a release using electron-builder.';
  } else if (msg.includes('latest.yml') || msg.includes('latest-mac.yml') || msg.includes('RELEASES')) {
    errorType = 'missing-artifact';
    userMessage = 'The GitHub release is missing required update files (latest.yml). The developer needs to rebuild and re-publish the release with electron-builder.';
  } else if (msg.includes('rate limit') || msg.includes('403')) {
    errorType = 'rate-limit';
    userMessage = 'GitHub API rate limit reached. Try again in a few minutes, or set a GH_TOKEN for higher limits.';
  } else if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('network')) {
    errorType = 'network';
    userMessage = 'Could not connect to GitHub. Check your internet connection and try again.';
  } else if (msg.includes('ERR_CONNECTION') || msg.includes('getaddrinfo')) {
    errorType = 'network';
    userMessage = 'Network error — unable to reach GitHub servers. Check your internet connection.';
  }

  sendUpdateStatus('error', { message: userMessage, errorType, raw: msg });
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
  isDownloaded = true;
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
    const msg = err.message || '';
    let errorType = 'unknown';
    let userMessage = msg;

    if (msg.includes('404') || msg.includes('Not Found') || msg.includes('No published versions')) {
      errorType = 'no-release';
      userMessage = 'No published release found on GitHub.';
    } else if (msg.includes('latest.yml') || msg.includes('RELEASES')) {
      errorType = 'missing-artifact';
      userMessage = 'GitHub release is missing update files (latest.yml).';
    } else if (msg.includes('rate limit') || msg.includes('403')) {
      errorType = 'rate-limit';
      userMessage = 'GitHub API rate limit reached. Try again later.';
    } else if (msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED') || msg.includes('ETIMEDOUT') || msg.includes('ERR_CONNECTION') || msg.includes('getaddrinfo')) {
      errorType = 'network';
      userMessage = 'Could not connect to GitHub. Check your internet connection.';
    }

    // Also send through the event channel so the UI listener picks it up
    sendUpdateStatus('error', { message: userMessage, errorType, raw: msg });
    return { status: 'error', message: userMessage, errorType };
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

ipcMain.handle('update:install', async () => {
  // Show a native dialog so user knows what's about to happen
  if (mainWindow) {
    await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Installing Update',
      message: 'Obsidian Cinema will now close and restart with the new version.',
      detail: 'This is normal — the app will reopen automatically after the update is installed.',
      buttons: ['OK'],
      defaultId: 0,
    });
  }
  // quitAndInstall handles closing the app and restarting
  autoUpdater.quitAndInstall(false, true);
});

ipcMain.handle('update:getStatus', () => {
  return {
    updateAvailable,
    downloadProgress,
    isDownloading,
    isDownloaded,
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

// IPC Handlers for external links and file opening
// User Guide: open the latest online copy, or the copy bundled with the app when offline
ipcMain.handle('help:openGuide', async (event, onlineUrl) => {
  if (onlineUrl) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(onlineUrl, { method: 'HEAD', signal: ctrl.signal });
      clearTimeout(t);
      if (res.ok) { await shell.openExternal(onlineUrl); return { source: 'online' }; }
    } catch (e) { /* offline: fall back to bundled copy */ }
  }
  try {
    const bundled = path.join(__dirname, 'Obsidian-Cinema-User-Guide.pdf');
    // Files inside app.asar can't be opened by other programs, so copy it out first
    const out = path.join(app.getPath('temp'), 'Obsidian-Cinema-User-Guide.pdf');
    fs.writeFileSync(out, fs.readFileSync(bundled));
    const err = await shell.openPath(out);
    return err ? { source: 'none', error: err } : { source: 'offline' };
  } catch (e) {
    return { source: 'none', error: e.message };
  }
});

ipcMain.handle('shell:openExternal', (event, urlOrPath) => {
  // Check if it's a file path (Windows style)
  if (urlOrPath.match(/^[A-Za-z]:\\/)) {
    // It's a file path - open with default app
    shell.openPath(urlOrPath);
  } else {
    // It's a URL
    shell.openExternal(urlOrPath);
  }
});

ipcMain.handle('shell:openPath', (event, filePath) => {
  shell.openPath(filePath);
});

ipcMain.handle('shell:showItemInFolder', (event, filePath) => {
  shell.showItemInFolder(filePath);
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
      webSecurity: false,  // Allow loading local files
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
  console.log('__dirname:', __dirname);
  console.log('isDev:', isDev);
  
  mainWindow.loadURL(startUrl);
  
  // Only open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
  
  // Log any load errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
    
    // Don't auto-check for updates on startup — let user trigger it from Settings
    // This prevents surprise downloads and blank-screen restarts
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Handle navigation events
  mainWindow.webContents.on('will-navigate', (event, url) => {
    // Block external navigation and dropped files opening in the window (only the app page itself may load)
    const appPage = startUrl.split('#')[0].split('?')[0];
    if (url.split('#')[0].split('?')[0] !== appPage) {
      event.preventDefault();
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
