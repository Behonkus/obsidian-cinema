const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // License management
  getLicense: () => ipcRenderer.invoke('license:get'),
  setLicense: (licenseData) => ipcRenderer.invoke('license:set', licenseData),
  clearLicense: () => ipcRenderer.invoke('license:clear'),
  getMachineId: () => ipcRenderer.invoke('license:getMachineId'),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('app:version'),
  isElectron: () => true,
  
  // Auto-update
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  getUpdateStatus: () => ipcRenderer.invoke('update:getStatus'),
  onUpdateStatus: (callback) => {
    ipcRenderer.on('update-status', (event, data) => callback(data));
  },
  removeUpdateListener: () => {
    ipcRenderer.removeAllListeners('update-status');
  },
  
  // Local file system (desktop only)
  getDrives: () => ipcRenderer.invoke('fs:getDrives'),
  listDirectory: (dirPath) => ipcRenderer.invoke('fs:listDirectory', dirPath),
  scanForVideos: (dirPath, recursive) => ipcRenderer.invoke('fs:scanForVideos', dirPath, recursive),
  pathExists: (checkPath) => ipcRenderer.invoke('fs:pathExists', checkPath),
  
  // File system access (desktop only)
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options),
  openFolderDialog: (options) => ipcRenderer.invoke('dialog:openFolder', options),
  
  // External links
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
});
