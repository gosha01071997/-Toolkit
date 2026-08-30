const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const net = require('net')
const { spawn } = require('child_process')
const { verifyLicense } = require('./license-verifier.cjs')

const AI_PORT = Number(process.env.EMC_AI_PORT || 39281)
const AI_HOST = '127.0.0.1'
let aiProcess = null
let aiStarting = null

function getAiRuntimeRoot() {
  const candidates = [
    path.join(process.resourcesPath || __dirname, 'ai-runtime'),
    path.join(__dirname, 'ai-runtime'),
  ]
  return candidates.find((dir) => fs.existsSync(path.join(dir, 'runtime-manifest.json'))) || candidates[0]
}

function readAiManifest(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, 'runtime-manifest.json'), 'utf8'))
  } catch {
    return null
  }
}

function getAiPaths() {
  const root = getAiRuntimeRoot()
  const manifest = readAiManifest(root)
  const runtimeRel = manifest?.runtime?.win32 || 'bin/win32/emc-ai-runtime.exe'
  const modelRel = manifest?.model?.path || 'models/qwen2.5-7b.gguf'
  return {
    root,
    manifest,
    runtimePath: path.join(root, runtimeRel),
    modelPath: path.join(root, modelRel),
  }
}

function isPortReady(port = AI_PORT, host = AI_HOST) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port })
    socket.once('connect', () => {
      socket.end()
      resolve(true)
    })
    socket.once('error', () => resolve(false))
    socket.setTimeout(800, () => {
      socket.destroy()
      resolve(false)
    })
  })
}

async function waitForPort(port = AI_PORT, timeoutMs = 120000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    if (await isPortReady(port)) return true
    await new Promise((resolve) => setTimeout(resolve, 600))
  }
  return false
}

async function getAiStatus() {
  const paths = getAiPaths()
  const runtimeExists = fs.existsSync(paths.runtimePath)
  const modelExists = fs.existsSync(paths.modelPath)
  const installed = Boolean(paths.manifest && runtimeExists && modelExists)
  const running = await isPortReady()

  if (!installed) {
    return {
      installed: false,
      running: false,
      ready: false,
      message: 'AI Pack не установлен',
      details: 'Нужны ai-runtime/bin/win32/emc-ai-runtime.exe, ai-runtime/models/qwen2.5-7b.gguf и runtime-manifest.json.',
    }
  }

  return {
    installed: true,
    running,
    ready: running,
    message: running ? 'AI-модуль готов' : 'AI Pack найден, runtime ещё не запущен',
    details: running ? '' : 'Runtime будет запущен при первом запросе к модели.',
  }
}

async function ensureAiRuntime() {
  const status = await getAiStatus()
  if (!status.installed) {
    const err = new Error(status.details || status.message)
    err.code = 'AI_PACK_NOT_INSTALLED'
    throw err
  }
  if (status.running) return status
  if (aiStarting) return aiStarting

  aiStarting = (async () => {
    const paths = getAiPaths()
    const args = [
      '--model', paths.modelPath,
      '--host', AI_HOST,
      '--port', String(AI_PORT),
      '--ctx-size', String(paths.manifest?.server?.ctxSize || 4096),
    ]

    aiProcess = spawn(paths.runtimePath, args, {
      cwd: paths.root,
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    aiProcess.stdout?.on('data', (data) => console.log(`[ai-runtime] ${data}`))
    aiProcess.stderr?.on('data', (data) => console.warn(`[ai-runtime] ${data}`))
    aiProcess.once('exit', (code, signal) => {
      console.warn(`[ai-runtime] stopped: code=${code} signal=${signal}`)
      aiProcess = null
    })

    const ready = await waitForPort()
    if (!ready) {
      stopAiRuntime()
      const err = new Error('AI runtime не запустился: модель не ответила в отведённое время.')
      err.code = 'AI_RUNTIME_START_FAILED'
      throw err
    }
    return getAiStatus()
  })().finally(() => {
    aiStarting = null
  })

  return aiStarting
}

function stopAiRuntime() {
  if (aiProcess && !aiProcess.killed) {
    aiProcess.kill()
  }
  aiProcess = null
}

async function requestAiCompletion(prompt) {
  await ensureAiRuntime()
  const response = await fetch(`http://${AI_HOST}:${AI_PORT}/completion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, n_predict: 768, temperature: 0.3, stream: false }),
  })
  if (!response.ok) {
    const err = new Error(`AI runtime вернул ошибку ${response.status}`)
    err.code = 'AI_RUNTIME_REQUEST_FAILED'
    throw err
  }
  const data = await response.json()
  return data.content || data.response || data.choices?.[0]?.text || ''
}

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
      preload: path.join(__dirname, 'preload.js'),
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

ipcMain.handle('ai:status', getAiStatus)
ipcMain.handle('license:verify', (_event, request) => {
  if (!request || typeof request.licenseString !== 'string' || request.licenseString.length > 16384) {
    return { valid: false, license: null, licenseString: null, error: 'Неверный формат лицензионного ключа' }
  }
  return verifyLicense(request.licenseString, request.now)
})
ipcMain.handle('ai:generate', async (_event, { prompt }) => {
  const text = await requestAiCompletion(prompt)
  if (!text.trim()) throw new Error('AI runtime вернул пустой ответ модели.')
  return { text, status: await getAiStatus() }
})

app.whenReady().then(() => {
  createWindow()
})

app.on('before-quit', stopAiRuntime)

app.on('window-all-closed', () => {
  stopAiRuntime()
  if (process.platform !== 'darwin') app.quit()
})
