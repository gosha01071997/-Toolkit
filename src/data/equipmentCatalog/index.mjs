import { AMERICAS_MODELS } from "./manufacturers/americas.mjs";
import { ASIA_CIS_MODELS } from "./manufacturers/asia-cis.mjs";
import { EUROPE_MODELS } from "./manufacturers/europe.mjs";
import { LUMILOOP_MODELS } from "./manufacturers/lumiloop.mjs";
import { RUSSIA_CIS_MODELS } from "./manufacturers/russia-cis.mjs";
import { COVERAGE_MODELS } from "./manufacturers/coverage.mjs";
export { EQUIPMENT_TYPE_IDS, EQUIPMENT_TYPE_OPTIONS, SPECIFICATION_LABELS, specificationLabel, typeLabel } from "./schema.mjs";

export const EQUIPMENT_CATALOG = Object.freeze([...EUROPE_MODELS, ...AMERICAS_MODELS, ...ASIA_CIS_MODELS, ...RUSSIA_CIS_MODELS, ...LUMILOOP_MODELS, ...COVERAGE_MODELS]);
const aliases = {
  "приемник": "measurement_receiver", "измерительный приемник": "measurement_receiver", receiver: "measurement_receiver",
  "генератор": "signal_generator", "генератор сигналов": "signal_generator", "вч генератор": "signal_generator",
  "токосъемник": "current_probe", "токовый пробник": "current_probe", "current probe": "current_probe",
  "лисн": "lisn", "эквивалент сети": "lisn", "анализатор спектра": "spectrum_analyzer", "источник питания": "power_supply",
  "усилитель": "amplifier", attenuator: "attenuator", "аттенюатор": "attenuator", "антенна": "antenna",
  "магнитометр": "magnetometer", magnetometer: "magnetometer", "кабель": "cable", cable: "cable",
  "осциллограф": "oscilloscope", "мультиметр": "multimeter", "калибровка": "calibration_fixture",
};
export const normalizeCatalogText = value => String(value ?? "").toLocaleLowerCase("ru").replace(/ё/g,"е").replace(/[‐‑‒–—-]+/g," ").replace(/[^\p{L}\p{N}]+/gu," ").trim();
const searchable = new WeakMap();
const searchText = item => {
  if (!searchable.has(item)) searchable.set(item, normalizeCatalogText([item.manufacturer,item.model,item.subtype,item.equipmentType,item.applications?.join(" "),item.searchTerms?.join(" ")].join(" ")));
  return searchable.get(item);
};
export function searchCatalog(models = EQUIPMENT_CATALOG, query = "", equipmentType = "") {
  const needle = normalizeCatalogText(query); const alias = aliases[needle];
  return (models || []).filter(item => (!equipmentType || item.equipmentType === equipmentType) && (!needle || searchText(item).includes(needle) || (alias && item.equipmentType.includes(alias))));
}
export function createLaboratoryEquipment(model, local = {}, now = Date.now()) {
  if (!model?.id) throw new Error("Не выбрана модель каталога");
  return { id:local.id||`equipment_${now}`,source:"catalog",catalogModelId:model.id,manufacturer:model.manufacturer,model:model.model,name:local.name||model.model,type:(catalogTypeLabel(model.equipmentType)),equipmentType:model.equipmentType,serialNumber:String(local.serialNumber||""),inventoryNumber:String(local.inventoryNumber||""),arm:String(local.arm||""),calibrationValidUntil:String(local.calibrationValidUntil||""),length:String(local.length||""),connectorFrom:String(local.connectorFrom||""),connectorTo:String(local.connectorTo||""),note:String(local.note||""),photo:String(local.photo||""),specs:[],icon:"🔧" };
}
import { typeLabel as catalogTypeLabel } from "./schema.mjs";
export function migrateLaboratoryEquipment(item = {}) { return {...item,source:item.source==="catalog"&&item.catalogModelId?"catalog":"custom",catalogModelId:item.catalogModelId||null}; }
export const visibleSpecifications = model => Object.entries(model?.specifications||{}).filter(([,value])=>value!==null&&value!==undefined&&value!=="").map(([key,value])=>[({ frequencyRange:"Диапазон частот", outputLevel:"Выходной уровень", impedance:"Импеданс", outputLevelRange:"Диапазон выходного уровня", impedanceOhm:"Импеданс", apertureMm:"Диаметр окна", transferImpedance:"Передаточный импеданс", compatibleModels:"Совместимые модели" }[key]||key), typeof value === "object" ? value.display || JSON.stringify(value) : value]);
