const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

function createWindow() {
  const { width, height } = require('electron').screen.getPrimaryDisplay().workAreaSize

  const win = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    minWidth: 900,
    minHeight: 600,
    title: 'EMC Pro — Инструментарий инженера ЭМС',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#F0F4FF',
    show: false,
  })

  win.loadFile(path.join(__dirname, 'dist', 'index.html'))

  win.once('ready-to-show', () => {
    win.maximize()
    win.show()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
