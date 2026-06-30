import { contextBridge } from 'electron';

// Expose safe APIs to the renderer via window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
});
