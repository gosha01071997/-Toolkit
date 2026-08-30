const test = require("node:test");
const assert = require("node:assert/strict");
const { generateKeyPairSync, verify } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { issueLicense } = require("../index.cjs");

const pair = generateKeyPairSync("ed25519");
const privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" });

test("issues Pro by default with no expiry", () => {
  const result = issueLicense({ licenseId: "EMC-DEFAULT" }, privateKey);
  assert.equal(result.payload.edition, "pro");
  assert.equal(result.payload.expiresAt, null);
});

test("issues verifiable licenses for all supported editions", () => {
  for (const edition of ["pro", "lab", "personal"]) {
    const { key } = issueLicense({ edition, licenseId: `EMC-${edition}`, expiresAt: "never" }, privateKey);
    const [payload, signature] = key.split(".");
    assert.equal(verify(null, Buffer.from(payload, "base64url"), pair.publicKey, Buffer.from(signature, "base64url")), true);
  }
});

test("bundled public key is a raw Ed25519 key", () => {
  const pem = readFileSync(join(__dirname, "..", "public-key.pem"));
  const rawKey = require("node:crypto").createPublicKey(pem).export({ type: "spki", format: "der" }).subarray(-32).toString("base64url");
  assert.match(rawKey, /^[A-Za-z0-9_-]{43}$/);
});
