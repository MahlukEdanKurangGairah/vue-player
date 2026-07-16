const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog
  openFile: () => ipcRenderer.invoke('dialog:openFile'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  
  // App
  getPath: (name) => ipcRenderer.invoke('app:getPath', name),
  fileExists: (filePath) => ipcRenderer.invoke('fs:fileExists', filePath),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  
  // Menu events
  onMenuAction: (channel, callback) => {
    const validChannels = ['playback-toggle', 'playback-stop', 'playlist-next', 'playlist-prev', 'files-opened', 'theme-changed'];
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },
  
  removeMenuListener: (channel, callback) => {
    ipcRenderer.removeAllListeners(channel);
  }
});
