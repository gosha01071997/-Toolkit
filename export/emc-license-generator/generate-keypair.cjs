#!/usr/bin/env node
const { generateKeyPairSync } = require("node:crypto");
const { existsSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");

const privateKeyPath = join(__dirname, "private-key.pem");
const publicKeyPath = join(__dirname, "public-key.pem");

if (existsSync(privateKeyPath)) {
  console.error("Ошибка: private-key.pem уже существует. Ключи не изменены.");
  process.exitCode = 1;
} else {
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  writeFileSync(privateKeyPath, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600, flag: "wx" });
  writeFileSync(publicKeyPath, publicKey.export({ type: "spki", format: "pem" }));
  const raw = publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("base64url");
  console.log("Ключи созданы. Сохраните private-key.pem в защищённом хранилище.");
  console.log("Для src/license/publicKey.js в EMC Toolkit используйте:");
  console.log(raw);
}
