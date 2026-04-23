const { app, BrowserWindow, shell } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'EMC Pro — Инструментарий инженера ЭМС',
    icon: path.join(__dirname, 'public', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#F0F4FF',
    show: false, // Скрыть до готовности
  })

  // Открыть на весь экран сразу
  win.maximize()

  // Загрузить приложение
  win.loadFile(path.join(__dirname, 'dist', 'index.html'))

  // Показать когда готово (без белого мигания)
  win.once('ready-to-show', () => {
    win.show()
  })

  // Внешние ссылки открывать в браузере
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
