const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('emcAi', {
  status: () => ipcRenderer.invoke('ai:status'),
  generate: (prompt) => ipcRenderer.invoke('ai:generate', { prompt }),
})
