const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
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
    win.show()
    win.maximize()
  })

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
