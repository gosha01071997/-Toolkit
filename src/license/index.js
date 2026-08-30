export const LICENSE_STORAGE_KEY = "emc_toolkit_license_v1";
export const LICENSE_EDITIONS = Object.freeze(["personal", "pro", "lab"]);

export async function verifyLicense(licenseString, now = new Date()) {
  try {
    const normalized = String(licenseString || "").trim();
    if (!window.emcLicense?.verify) throw new Error("Проверка лицензии доступна только в desktop-приложении");
    const result = await window.emcLicense.verify(normalized, now.toISOString());
    return result.valid ? { ...result, license: Object.freeze(result.license) } : result;
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
