const { createPublicKey, verify } = require('node:crypto')
const { LICENSE_PUBLIC_KEY } = require('./license-public-key.cjs')

const LICENSE_EDITIONS = Object.freeze(['personal', 'pro', 'lab'])
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

function invalid(error) {
  return { valid: false, license: null, licenseString: null, error }
}

function decodeBase64Url(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error('Неверный формат лицензионного ключа')
  }
  return Buffer.from(value, 'base64url')
}

function verifyLicense(licenseString, now = new Date(), publicKeyRaw = LICENSE_PUBLIC_KEY) {
  try {
    const normalized = String(licenseString || '').trim()
    const parts = normalized.split('.')
    if (parts.length !== 2 || !parts.every(Boolean)) throw new Error('Неверный формат лицензионного ключа')

    const payloadBytes = decodeBase64Url(parts[0])
    const signature = decodeBase64Url(parts[1])
    const payload = JSON.parse(payloadBytes.toString('utf8'))
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('Лицензия повреждена')
    if (typeof payload.licenseId !== 'string' || !payload.licenseId.trim()) throw new Error('В лицензии отсутствует ID')
    if (!LICENSE_EDITIONS.includes(payload.edition)) throw new Error('Неизвестная редакция лицензии')
    if (typeof payload.issuedAt !== 'string' || Number.isNaN(Date.parse(payload.issuedAt))) throw new Error('Некорректная дата выдачи')
    if (payload.expiresAt !== null && (typeof payload.expiresAt !== 'string' || Number.isNaN(Date.parse(payload.expiresAt)))) {
      throw new Error('Некорректный срок лицензии')
    }

    const rawKey = decodeBase64Url(publicKeyRaw)
    if (rawKey.length !== 32) throw new Error('Некорректный публичный ключ лицензии')
    const publicKey = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, rawKey]),
      format: 'der',
      type: 'spki',
    })
    if (!verify(null, payloadBytes, publicKey, signature)) throw new Error('Цифровая подпись лицензии недействительна')

    const currentTime = now instanceof Date ? now.getTime() : Date.parse(now)
    if (Number.isNaN(currentTime)) throw new Error('Некорректная текущая дата')
    if (payload.expiresAt && currentTime > Date.parse(payload.expiresAt)) throw new Error('Срок лицензии истёк')
    return { valid: true, license: payload, licenseString: normalized, error: null }
  } catch (error) {
    return invalid(error?.message || 'Лицензия недействительна')
  }
}

module.exports = { LICENSE_EDITIONS, verifyLicense }
