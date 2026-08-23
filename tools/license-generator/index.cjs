#!/usr/bin/env node
const { createPrivateKey, randomInt, sign } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const readline = require("node:readline/promises");

function issueLicense({ edition, licenseId, expiresAt }, privateKeyPem) {
  if (!["personal", "pro", "lab"].includes(edition)) throw new Error("Редакция: personal, pro или lab");
  if (!/^EMC-[A-Z0-9-]+$/i.test(licenseId)) throw new Error("License ID должен начинаться с EMC-");
  const expiry = !expiresAt || expiresAt === "never" ? null : new Date(`${expiresAt}T23:59:59.999Z`).toISOString();
  if (expiry && Number.isNaN(Date.parse(expiry))) throw new Error("Дата должна иметь формат YYYY-MM-DD");
  const payload = { licenseId: licenseId.toUpperCase(), edition, issuedAt: new Date().toISOString(), expiresAt: expiry };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(null, Buffer.from(encodedPayload, "base64url"), createPrivateKey(privateKeyPem)).toString("base64url");
  return { payload, key: `${encodedPayload}.${signature}` };
}

async function main() {
  const args = Object.fromEntries(process.argv.slice(2).map((value, index, all) => value.startsWith("--") ? [value.slice(2), all[index + 1]] : null).filter(Boolean));
  let edition = args.edition;
  let licenseId = args.id;
  let expiresAt = args.expires;
  if (!edition) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log("\nEMC Toolkit License Generator\n");
    const suggestedId = `EMC-${randomInt(100000, 999999)}`;
    edition = (await rl.question("Редакция [personal / pro / lab]: ")).trim().toLowerCase();
    licenseId = (await rl.question(`License ID [${suggestedId}]: `)).trim() || suggestedId;
    expiresAt = (await rl.question("Срок [never или YYYY-MM-DD]: ")).trim() || "never";
    rl.close();
  }
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
