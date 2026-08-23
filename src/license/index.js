import { LICENSE_PUBLIC_KEY } from "./publicKey";

export const LICENSE_STORAGE_KEY = "emc_toolkit_license_v1";
export const LICENSE_EDITIONS = Object.freeze(["personal", "pro", "lab"]);

const decodeBase64Url = (value) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
};

export async function verifyLicense(licenseString, now = new Date()) {
  try {
    const normalized = String(licenseString || "").trim();
    const parts = normalized.split(".");
    if (parts.length !== 2 || !parts.every(Boolean)) throw new Error("Неверный формат лицензионного ключа");

    const payloadBytes = decodeBase64Url(parts[0]);
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes));
    if (!payload || typeof payload !== "object") throw new Error("Лицензия повреждена");
    if (typeof payload.licenseId !== "string" || !payload.licenseId.trim()) throw new Error("В лицензии отсутствует ID");
    if (!LICENSE_EDITIONS.includes(payload.edition)) throw new Error("Неизвестная редакция лицензии");
    if (typeof payload.issuedAt !== "string" || Number.isNaN(Date.parse(payload.issuedAt))) throw new Error("Некорректная дата выдачи");
    if (payload.expiresAt !== null && (typeof payload.expiresAt !== "string" || Number.isNaN(Date.parse(payload.expiresAt)))) throw new Error("Некорректный срок лицензии");

    const publicKey = await crypto.subtle.importKey(
      "raw", decodeBase64Url(LICENSE_PUBLIC_KEY), { name: "Ed25519" }, false, ["verify"],
    );
    const signatureValid = await crypto.subtle.verify(
      { name: "Ed25519" }, publicKey, decodeBase64Url(parts[1]), payloadBytes,
    );
    if (!signatureValid) throw new Error("Цифровая подпись лицензии недействительна");
    if (payload.expiresAt && now.getTime() > Date.parse(payload.expiresAt)) throw new Error("Срок лицензии истёк");
    return { valid: true, license: Object.freeze(payload), licenseString: normalized, error: null };
  } catch (error) {
    return { valid: false, license: null, licenseString: null, error: error?.message || "Лицензия недействительна" };
  }
}

export async function getActiveLicense() {
  try {
    const stored = localStorage.getItem(LICENSE_STORAGE_KEY);
    return stored ? verifyLicense(stored) : { valid: false, license: null, error: "Лицензия не установлена" };
  } catch {
    return { valid: false, license: null, error: "Локальное хранилище недоступно" };
  }
}

export async function saveLicense(licenseString) {
  const result = await verifyLicense(licenseString);
  if (!result.valid) return result;
  try {
    localStorage.setItem(LICENSE_STORAGE_KEY, result.licenseString);
    return result;
  } catch {
    return { valid: false, license: null, error: "Не удалось сохранить лицензию" };
  }
}

export function removeLicense() {
  try { localStorage.removeItem(LICENSE_STORAGE_KEY); return true; } catch { return false; }
}
