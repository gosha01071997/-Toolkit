export const CALIBRATION_STORAGE_KEY = "emc_calibration_sets_v1";
export const FREQUENCY_UNITS = ["Hz", "kHz", "MHz", "GHz"];
export const TEST_TYPES = ["21.4", "21.5"];

const multiplier = { Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9 };
const number = value => {
  const text = String(value ?? "").trim();
  return text === "" ? NaN : Number(text.replace(",", "."));
};
export const frequencyHz = (value, unit = "Hz") => number(value) * (multiplier[unit] || 1);

export function createCalibrationPoint(input = {}, index = 0) {
  const frequency = number(input.frequency);
  const correction = number(input.correction);
  if (!Number.isFinite(frequency) || frequency < 0 || !Number.isFinite(correction)) throw new Error("Для точки нужны корректные частота и итоговая поправка");
  return {
    id: input.id || `cal_point_${Date.now()}_${index}`,
    order: Number.isFinite(Number(input.order)) ? Number(input.order) : index + 1,
    frequency,
    frequencyUnit: FREQUENCY_UNITS.includes(input.frequencyUnit) ? input.frequencyUnit : "MHz",
    correction,
    correctionUnit: String(input.correctionUnit || "dB"),
    comment: String(input.comment || ""),
    antennaFactor: input.antennaFactor ?? "", cableLoss: input.cableLoss ?? "",
    preamplifierFactor: input.preamplifierFactor ?? "", lisnCorrection: input.lisnCorrection ?? "",
    currentProbeFactor: input.currentProbeFactor ?? "", extra: input.extra && typeof input.extra === "object" ? input.extra : {},
  };
}

export function createCalibrationSet(input = {}, now = new Date().toISOString()) {
  if (!TEST_TYPES.includes(input.testType)) throw new Error("Тип набора должен быть 21.4 или 21.5");
  if (!String(input.name || "").trim()) throw new Error("Укажите название набора");
  return {
    id: input.id || `cal_set_${Date.now()}`,
    name: String(input.name).trim(), testType: input.testType,
    laboratory: String(input.laboratory || ""), workplace: String(input.workplace || ""),
    pathDescription: String(input.pathDescription || ""), measurementDistance: String(input.measurementDistance || ""),
    calibrationDate: String(input.calibrationDate || ""), createdAt: input.createdAt || now, updatedAt: now,
    note: String(input.note || ""), equipmentIds: [...new Set(input.equipmentIds || [])],
    status: input.status === "archived" ? "archived" : "active",
    points: (input.points || []).map(createCalibrationPoint),
  };
}

export function normalizeCalibrationSets(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap(item => { try { return [createCalibrationSet(item, item.updatedAt || item.createdAt)]; } catch { return []; } });
}
export const loadCalibrationSets = storage => {
  try { return normalizeCalibrationSets(JSON.parse(storage.getItem(CALIBRATION_STORAGE_KEY) || "[]")); } catch { return []; }
};
export const saveCalibrationSets = (storage, sets) => storage.setItem(CALIBRATION_STORAGE_KEY, JSON.stringify(normalizeCalibrationSets(sets)));

export function findCalibrationPoint(set, frequency, unit) {
  const target = frequencyHz(frequency, unit);
  if (!Number.isFinite(target)) return null;
  return (set?.points || []).find(point => frequencyHz(point.frequency, point.frequencyUnit) === target) || null;
}
export function sortCalibrationPoints(points, direction = "asc") {
  const sign = direction === "desc" ? -1 : 1;
  return [...points].sort((a, b) => sign * (frequencyHz(a.frequency, a.frequencyUnit) - frequencyHz(b.frequency, b.frequencyUnit) || a.order - b.order));
}
// Only reviewed combinations belong here. New methods can extend this registry
// without changing stored measurements or calibration points.
export const CALIBRATION_UNIT_RULES = [
  { measuredUnits: ["dB", "dBµV", "dBµV/m", "dBµA"], correctionUnit: "dB", operation: "add" },
];
const normalizeUnit = unit => String(unit || "").trim().replaceAll("μ", "µ").replaceAll("u", "µ");
export function getCalibrationUnitRule(measuredUnit, correctionUnit, rules = CALIBRATION_UNIT_RULES) {
  const measured = normalizeUnit(measuredUnit), correction = normalizeUnit(correctionUnit);
  return rules.find(rule => normalizeUnit(rule.correctionUnit) === correction && rule.measuredUnits.some(unit => normalizeUnit(unit) === measured)) || null;
}
export function calculateCorrectedValue({ measured, measuredUnit, correction, correctionUnit, limit }, rules = CALIBRATION_UNIT_RULES) {
  const a = number(measured), b = number(correction);
  const rule = getCalibrationUnitRule(measuredUnit, correctionUnit, rules);
  if (!Number.isFinite(a) || !Number.isFinite(b) || !rule) return { compatible: false, corrected: null, margin: null };
  if (rule.operation !== "add") return { compatible: false, corrected: null, margin: null };
  const corrected = a + b, norm = number(limit);
  return { compatible: true, corrected, margin: Number.isFinite(norm) ? norm - corrected : null };
}

function csvRows(text, delimiter) {
  const rows=[]; let row=[], field="", quoted=false;
  for(let i=0;i<text.length;i++){const ch=text[i];if(ch==='"'){if(quoted&&text[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(ch===delimiter&&!quoted){row.push(field);field="";}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(field);if(row.some(x=>x!==""))rows.push(row);row=[];field="";}else field+=ch;}
  row.push(field); if(row.some(x=>x!=="")) rows.push(row); return rows;
}
export function parseCalibrationCsv(text, delimiter) {
  const first=String(text||"").split(/\r?\n/,1)[0]; const sep=delimiter || ([";",",","\t"].sort((a,b)=>first.split(b).length-first.split(a).length)[0]);
  const rows=csvRows(String(text||""),sep); return { delimiter:sep, headers:rows[0]||[], rows:rows.slice(1) };
}
export function importCalibrationCsv(parsed, mapping, options = {}) {
  const points=[], errors=[]; let skipped=0;
  parsed.rows.forEach((row,index)=>{ if(row.every(x=>!String(x).trim())){skipped++;return;} try { const get=k=>mapping[k] === undefined ? "" : row[Number(mapping[k])]; points.push(createCalibrationPoint({frequency:get("frequency"),frequencyUnit:options.frequencyUnit||"MHz",correction:get("correction"),correctionUnit:options.correctionUnit||"dB",comment:get("comment"),antennaFactor:get("antennaFactor"),cableLoss:get("cableLoss"),preamplifierFactor:get("preamplifierFactor"),lisnCorrection:get("lisnCorrection"),currentProbeFactor:get("currentProbeFactor")},points.length)); } catch(error){ errors.push({row:index+2,message:error.message}); } });
  return { points, imported:points.length, skipped, errorCount:errors.length, errors };
}
const csvCell=value=>`"${String(value??"").replaceAll('"','""')}"`;
export function exportCalibrationCsv(set) {
  const fields=["order","frequency","frequencyUnit","correction","correctionUnit","antennaFactor","cableLoss","preamplifierFactor","lisnCorrection","currentProbeFactor","comment"];
  return [fields.join(","),...(set.points||[]).map(p=>fields.map(k=>csvCell(p[k])).join(","))].join("\r\n");
}
export const exportCalibrationJson = set => JSON.stringify({format:"emc-toolkit-calibration",version:1,calibrationSet:set},null,2);
export function calibrationBackup(sets) { return { calibrationSets: normalizeCalibrationSets(sets) }; }
export function restoreCalibrationBackup(backup) { return normalizeCalibrationSets(backup?.calibrationSets || []); }
