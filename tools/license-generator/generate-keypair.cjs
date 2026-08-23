#!/usr/bin/env node
const { generateKeyPairSync } = require("node:crypto");
const { writeFileSync } = require("node:fs");
const { join } = require("node:path");

const directory = __dirname;
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
writeFileSync(join(directory, "private-key.pem"), privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
writeFileSync(join(directory, "public-key.pem"), publicKey.export({ type: "spki", format: "pem" }));
const raw = publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("base64url");
console.log("Ключи созданы. Скопируйте это значение в src/license/publicKey.js:");
console.log(raw);
