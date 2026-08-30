#!/usr/bin/env node
const { createPrivateKey, randomInt, sign } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const readline = require("node:readline/promises");

function issueLicense({ edition = "pro", licenseId, expiresAt = "never" }, privateKeyPem) {
  edition = String(edition).toLowerCase();
  if (!["personal", "pro", "lab"].includes(edition)) throw new Error("Редакция: pro, lab или personal (legacy)");
  if (!/^EMC-[A-Z0-9-]+$/i.test(licenseId || "")) throw new Error("License ID должен начинаться с EMC-");
  const expiry = !expiresAt || expiresAt === "never" ? null : new Date(`${expiresAt}T23:59:59.999Z`).toISOString();
  if (expiry && Number.isNaN(Date.parse(expiry))) throw new Error("Дата должна иметь формат YYYY-MM-DD");
  const payload = { licenseId: licenseId.toUpperCase(), edition, issuedAt: new Date().toISOString(), expiresAt: expiry };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(null, Buffer.from(encodedPayload, "base64url"), createPrivateKey(privateKeyPem)).toString("base64url");
  return { payload, key: `${encodedPayload}.${signature}` };
}

function parseArgs(values) {
  const args = {};
  for (let index = 0; index < values.length; index += 1) {
    if (values[index].startsWith("--")) args[values[index].slice(2)] = values[index + 1];
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let edition = args.edition;
  let licenseId = args.id;
  let expiresAt = args.expires;
  if (!edition && !licenseId && !expiresAt && process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log("\nEMC Toolkit License Generator\n");
    const suggestedId = `EMC-${randomInt(100000, 999999)}`;
    edition = (await rl.question("Редакция [pro / lab / personal] (pro): ")).trim().toLowerCase() || "pro";
    licenseId = (await rl.question(`License ID [${suggestedId}]: `)).trim() || suggestedId;
    expiresAt = (await rl.question("Срок [never или YYYY-MM-DD] (never): ")).trim() || "never";
    rl.close();
  }
  edition ||= "pro";
  licenseId ||= `EMC-${randomInt(100000, 999999)}`;
  expiresAt ||= "never";
  const privateKeyPath = args["private-key"] || process.env.EMC_LICENSE_PRIVATE_KEY || join(__dirname, "private-key.pem");
  const result = issueLicense({ edition, licenseId, expiresAt }, readFileSync(privateKeyPath, "utf8"));
  console.log("\nЛицензия создана:");
  console.log(result.key);
  console.log("\nДанные:", JSON.stringify(result.payload, null, 2));
}

if (require.main === module) main().catch((error) => { console.error(`Ошибка: ${error.message}`); process.exitCode = 1; });
module.exports = { issueLicense };
