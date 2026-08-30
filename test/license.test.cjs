const test = require("node:test");
const assert = require("node:assert/strict");
const { createPublicKey, generateKeyPairSync, verify } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { issueLicense } = require("../tools/license-generator/index.cjs");

const expectedPublicKey = "el0V6qVwgxLm1azSG2uB_6_OuBafM9BrhHfNWXUMxHM";

const pair = generateKeyPairSync("ed25519");
const privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" });
const publicKey = pair.publicKey;

test("Pro and Lab licenses have valid Ed25519 signatures", () => {
  for (const edition of ["pro", "lab"]) {
    const { key } = issueLicense({ edition, licenseId: `EMC-${edition.toUpperCase()}`, expiresAt: "never" }, privateKey);
    const [payload, signature] = key.split(".");
    assert.equal(verify(null, Buffer.from(payload, "base64url"), publicKey, Buffer.from(signature, "base64url")), true);
  }
});

test("toolkit and generator use the production Ed25519 public key", () => {
  const source = readFileSync(join(__dirname, "..", "src", "license", "publicKey.js"), "utf8");
  const configuredKey = source.match(/LICENSE_PUBLIC_KEY\s*=\s*"([A-Za-z0-9_-]+)"/)?.[1];
  const pem = readFileSync(join(__dirname, "..", "tools", "license-generator", "public-key.pem"));
  const rawKey = createPublicKey(pem).export({ type: "spki", format: "der" }).subarray(-32).toString("base64url");

  assert.equal(configuredKey, expectedPublicKey);
  assert.equal(rawKey, expectedPublicKey);
});

test("changing license contents invalidates its signature", () => {
  const { key } = issueLicense({ edition: "personal", licenseId: "EMC-TAMPER", expiresAt: "never" }, privateKey);
  const [payload, signature] = key.split(".");
  const data = JSON.parse(Buffer.from(payload, "base64url"));
  data.edition = "pro";
  const changed = Buffer.from(JSON.stringify(data));
  assert.equal(verify(null, changed, publicKey, Buffer.from(signature, "base64url")), false);
});
