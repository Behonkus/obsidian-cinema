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
