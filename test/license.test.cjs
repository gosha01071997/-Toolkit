const test = require('node:test')
const assert = require('node:assert/strict')
const { createPublicKey, generateKeyPairSync } = require('node:crypto')
const { readFileSync } = require('node:fs')
const { join } = require('node:path')
const vm = require('node:vm')
const { issueLicense } = require('../tools/license-generator/index.cjs')
const { LICENSE_PUBLIC_KEY } = require('../license-public-key.cjs')
const { verifyLicense } = require('../license-verifier.cjs')

const expectedPublicKey = 'el0V6qVwgxLm1azSG2uB_6_OuBafM9BrhHfNWXUMxHM'
const pair = generateKeyPairSync('ed25519')
const privateKey = pair.privateKey.export({ type: 'pkcs8', format: 'pem' })
const testPublicKey = pair.publicKey.export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64url')

test('accepts generator payload.signature licenses signed by the corresponding Ed25519 key', () => {
  for (const edition of ['personal', 'pro', 'lab']) {
    const { key } = issueLicense({ edition, licenseId: `EMC-${edition.toUpperCase()}`, expiresAt: 'never' }, privateKey)
    assert.match(key, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    const result = verifyLicense(key, new Date(), testPublicKey)
    assert.equal(result.valid, true, result.error)
    assert.equal(result.license.edition, edition)
    assert.equal(result.license.expiresAt, null)
  }
})

test('rejects an incorrect signature in the real payload.signature format', () => {
  const { key } = issueLicense({ edition: 'pro', licenseId: 'EMC-BAD-SIGNATURE', expiresAt: 'never' }, privateKey)
  const [payload, signature] = key.split('.')
  const corrupted = `${payload}.${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`
  const result = verifyLicense(corrupted, new Date(), testPublicKey)
  assert.equal(result.valid, false)
  assert.equal(result.error, 'Цифровая подпись лицензии недействительна')
})

test('enforces expiry while retaining perpetual licenses', () => {
  const expired = issueLicense({ edition: 'lab', licenseId: 'EMC-EXPIRED', expiresAt: '2025-01-01' }, privateKey).key
  assert.equal(verifyLicense(expired, new Date('2025-01-02T00:00:00.000Z'), testPublicKey).valid, false)

  const perpetual = issueLicense({ edition: 'pro', licenseId: 'EMC-PERPETUAL', expiresAt: 'never' }, privateKey).key
  assert.equal(verifyLicense(perpetual, new Date('2100-01-01T00:00:00.000Z'), testPublicKey).valid, true)
})

test('toolkit and generator use the unchanged production Ed25519 public key', () => {
  const pem = readFileSync(join(__dirname, '..', 'tools', 'license-generator', 'public-key.pem'))
  const generatorKey = createPublicKey(pem).export({ type: 'spki', format: 'der' }).subarray(-32).toString('base64url')
  assert.equal(LICENSE_PUBLIC_KEY, expectedPublicKey)
  assert.equal(generatorKey, expectedPublicKey)
})

test('packaged desktop exposes the exact license API used by the renderer', async () => {
  const root = join(__dirname, '..')
  const preloadSource = readFileSync(join(root, 'preload.js'), 'utf8')
  const rendererSource = readFileSync(join(root, 'src', 'license', 'index.js'), 'utf8')
  const mainSource = readFileSync(join(root, 'electron.js'), 'utf8')
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const exposed = new Map()
  const invocations = []

  vm.runInNewContext(preloadSource, {
    require(id) {
      assert.equal(id, 'electron')
      return {
        contextBridge: {
          exposeInMainWorld(name, api) { exposed.set(name, api) },
        },
        ipcRenderer: {
          invoke(channel, request) {
            invocations.push({ channel, request })
            return Promise.resolve({ valid: false })
          },
        },
      }
    },
  }, { filename: 'preload.js' })

  assert.equal(typeof exposed.get('emcLicense')?.verify, 'function')
  await exposed.get('emcLicense').verify('payload.signature', '2030-01-01T00:00:00.000Z')
  assert.deepEqual(JSON.parse(JSON.stringify(invocations[0])), {
    channel: 'license:verify',
    request: { licenseString: 'payload.signature', now: '2030-01-01T00:00:00.000Z' },
  })
  assert.match(rendererSource, /window\.emcLicense\?\.verify/)
  assert.match(rendererSource, /window\.emcLicense\.verify\(/)
  assert.match(mainSource, /ipcMain\.handle\(['"]license:verify['"]/)
  assert.match(mainSource, /contextIsolation:\s*true/)
  assert.match(mainSource, /nodeIntegration:\s*false/)
  assert.match(mainSource, /sandbox:\s*false/)
  assert.match(mainSource, /preload:\s*preloadPath/)
  for (const requiredFile of ['preload.js', 'license-verifier.cjs', 'license-public-key.cjs']) {
    assert.ok(packageJson.build.files.includes(requiredFile), `${requiredFile} must be included in the packaged app`)
  }
})
