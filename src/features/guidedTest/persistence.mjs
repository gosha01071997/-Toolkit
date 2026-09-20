export const PROGRESS_PREFIX = "emc_guided_test_progress_v1:";
export const PHOTOS_PREFIX = "emc_guided_test_photos_v1:";

const read = (storage, key, fallback) => {
  try { const value = JSON.parse(storage.getItem(key) || "null"); return value ?? fallback; } catch { return fallback; }
};

export function initialProgress(scenarioId) {
  return { scenarioId, currentStage: 0, completed: {}, inputs: {}, tables: {}, equipment: {}, updatedAt: null };
}

export function loadProgress(storage, scenarioId) {
  const saved = read(storage, PROGRESS_PREFIX + scenarioId, {});
  return { ...initialProgress(scenarioId), ...(saved && typeof saved === "object" ? saved : {}), scenarioId };
}

export function saveProgress(storage, scenarioId, progress) {
  const value = { ...initialProgress(scenarioId), ...progress, scenarioId, updatedAt: new Date().toISOString() };
  storage.setItem(PROGRESS_PREFIX + scenarioId, JSON.stringify(value));
  return value;
}

export function loadPhotos(storage, scenarioId) { return read(storage, PHOTOS_PREFIX + scenarioId, []); }
export function savePhoto(storage, scenarioId, photo, now = Date.now()) {
  const photos = loadPhotos(storage, scenarioId);
  const saved = { id: photo.id || `photo_${now}`, dataUrl: photo.dataUrl, caption: String(photo.caption || ""), createdAt: new Date(now).toISOString() };
  storage.setItem(PHOTOS_PREFIX + scenarioId, JSON.stringify([...photos, saved]));
  return saved;
}
export function deletePhoto(storage, scenarioId, photoId) {
  const photos = loadPhotos(storage, scenarioId).filter(photo => photo.id !== photoId);
  storage.setItem(PHOTOS_PREFIX + scenarioId, JSON.stringify(photos));
  return photos;
}

export function readExistingEquipment(storage, defaults = []) {
  const parse = (key, fallback) => { try { return JSON.parse(storage.getItem(key) || JSON.stringify(fallback)); } catch { return fallback; } };
  const custom = parse("emc_custom_equip_v1", []);
  const edits = parse("emc_equip_edits_v1", {});
  return [...defaults, ...(Array.isArray(custom) ? custom : [])].map(item => ({ ...item, ...(edits[item.id] || {}) })).filter(item => !item.deleted);
}
