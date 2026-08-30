const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('emcAi', {
  status: () => ipcRenderer.invoke('ai:status'),
  generate: (prompt) => ipcRenderer.invoke('ai:generate', { prompt }),
})

contextBridge.exposeInMainWorld('emcLicense', {
  verify: (licenseString, now) => ipcRenderer.invoke('license:verify', { licenseString, now }),
})

// Let the main process distinguish a successfully evaluated preload from a
// file that merely exists in app.asar. This message is diagnostic only; the
// renderer still receives the smallest possible API through contextBridge.
ipcRenderer.send('preload:ready', { APIs: ['emcAi', 'emcLicense'] })
