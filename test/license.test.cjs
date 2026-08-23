const test = require("node:test");
const assert = require("node:assert/strict");
const { generateKeyPairSync, verify } = require("node:crypto");
const { issueLicense } = require("../tools/license-generator/index.cjs");

const pair = generateKeyPairSync("ed25519");
const privateKey = pair.privateKey.export({ type: "pkcs8", format: "pem" });
const publicKey = pair.publicKey;

test("Personal and Pro licenses have valid Ed25519 signatures", () => {
  for (const edition of ["personal", "pro"]) {
    const { key } = issueLicense({ edition, licenseId: `EMC-${edition.toUpperCase()}`, expiresAt: "never" }, privateKey);
    const [payload, signature] = key.split(".");
    assert.equal(verify(null, Buffer.from(payload, "base64url"), publicKey, Buffer.from(signature, "base64url")), true);
  }
});

test("changing license contents invalidates its signature", () => {
  const { key } = issueLicense({ edition: "personal", licenseId: "EMC-TAMPER", expiresAt: "never" }, privateKey);
  const [payload, signature] = key.split(".");
  const data = JSON.parse(Buffer.from(payload, "base64url"));
  data.edition = "pro";
  const changed = Buffer.from(JSON.stringify(data));
  assert.equal(verify(null, changed, publicKey, Buffer.from(signature, "base64url")), false);
});
