const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

// Keep a global reference of the window object
let mainWindow;
let backendProcess;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
const BACKEND_PORT = 8001;
const FRONTEND_PORT = isDev ? 3000 : 8001;

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

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    icon: path.join(__dirname, 'public', 'favicon.ico'),
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
  const startUrl = isDev 
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'build', 'index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
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

// App lifecycle
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
