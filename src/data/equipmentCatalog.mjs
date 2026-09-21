/** Offline, read-only model catalogue. Unknown values are deliberately omitted. */
export const EQUIPMENT_TYPE_OPTIONS = [
  ["measurement_receiver", "Измерительный приёмник"], ["spectrum_analyzer", "Анализатор спектра"], ["signal_generator", "Генератор сигналов"], ["power_supply", "Источник питания"], ["amplifier", "Усилитель"], ["current_probe", "Токосъёмник / Current probe"], ["bci_injection_probe", "BCI-инжектор / Injection probe"], ["lisn", "LISN / ЛИСН"], ["cdn", "CDN"], ["antenna", "Антенна"], ["power_meter", "Измеритель мощности"], ["power_sensor", "Датчик мощности"], ["attenuator", "Аттенюатор"], ["directional_coupler", "Направленный ответвитель"], ["calibration_fixture", "Калибровочная оснастка"], ["cable", "Кабель"], ["adapter", "Переходник / адаптер"], ["field_probe", "Пробник поля"], ["oscilloscope", "Осциллограф"], ["multimeter", "Мультиметр"], ["magnetometer", "Магнитометр"], ["magnetic_indicator", "Магнитный индикатор"], ["transient_generator", "Генератор переходных процессов"], ["esd_eft_surge", "ESD/EFT/Surge оборудование"], ["transformer", "Трансформатор"], ["test_stand", "Стенд"], ["other", "Другое"],
];
export const typeLabel = id => EQUIPMENT_TYPE_OPTIONS.find(([value]) => value === id)?.[1] || id;

export const SPECIFICATION_LABELS = {
  frequencyRange: "Диапазон частот", outputLevel: "Выходной уровень", impedance: "Импеданс",
  aperture: "Диаметр окна", transferImpedance: "Передаточный импеданс", maxPower: "Максимальная мощность",
  gain: "Коэффициент усиления", attenuation: "Ослабление", conductorConfiguration: "Конфигурация проводников",
  antennaType: "Тип антенны", outputVoltageRange: "Выходное напряжение", outputCurrent: "Выходной ток", outputPower: "Выходная мощность",
};
export const specificationLabel = key => SPECIFICATION_LABELS[key] || key;

// Product identities and categories are cited; unconfirmed technical values stay absent.
// Calibration characteristics never belong to these catalogue records.
export const EQUIPMENT_CATALOG = [
  { id: "akip-3208", manufacturer: "АКИП", model: "АКИП-3208", equipmentType: "signal_generator", subtype: "ВЧ-генератор сигналов", frequencyRange: { minHz: 9000, maxHz: 3200000000 }, specifications: { frequencyRange: "9 кГц–3,2 ГГц", outputLevel: "−110…+13 дБм", impedance: "50 Ом" }, applications: ["Формирование ВЧ-сигналов при настройке и испытаниях радиоэлектронной аппаратуры"], compatibleAccessories: [], relatedModels: [], sources: [{ type: "official_product_page", url: "https://prist.ru/productions/generatory-signalov/", title: "ПриСТ — генераторы сигналов АКИП" }], verificationStatus: "partially_verified" },
  { id: "rs-smb100b", manufacturer: "Rohde & Schwarz", model: "SMB100B", equipmentType: "signal_generator", specifications: {}, applications: [], compatibleAccessories: [], sources: [{ type: "official_product_page", url: "https://www.rohde-schwarz.com/products/test-and-measurement/analog-signal-generators/rs-smb100b-rf-and-microwave-signal-generator_63493-332769.html", title: "R&S SMB100B RF and microwave signal generator" }], verificationStatus: "partially_verified" },
  { id: "tekbox-tbcp1-250", manufacturer: "Tekbox", model: "TBCP1-250", equipmentType: "current_probe", subtype: "РЧ-токосъёмник", frequencyRange: { minHz: 30000, maxHz: 250000000 }, specifications: { frequencyRange: "30 кГц–250 МГц", aperture: "25 мм", transferImpedance: "5 Ом (тип.)" }, applications: ["Измерение синфазных РЧ-токов в кабелях"], compatibleAccessories: [], relatedModels: [], sources: [{ type: "official_product_page", url: "https://www.tekbox.com/product/tbcp1-250-rf-current-monitoring-probe/", title: "Tekbox TBCP1-250 RF current monitoring probe" }], verificationStatus: "partially_verified" },
];
const aliases = { "генератор": "signal generator", "генератор сигналов": "signal generator", "токосъёмник": "current probe", "токовый пробник": "current probe", "current probe": "current probe", "лисн": "lisn", "эквивалент сети": "lisn", "анализатор спектра": "spectrum analyzer", "усилитель": "amplifier", "attenuator": "attenuator", "аттенюатор": "attenuator" };
const normalize = value => String(value || "").toLocaleLowerCase("ru").replace(/ё/g, "е").trim();
export function searchCatalog(models = EQUIPMENT_CATALOG, query = "", equipmentType = "") {
  const raw = normalize(query); const needle = aliases[raw] || raw;
  return (models || []).filter(item => (!equipmentType || item.equipmentType === equipmentType) && (!needle || [item.manufacturer, item.model, typeLabel(item.equipmentType), item.equipmentType].some(value => { const text = normalize(value); return text.includes(raw) || text.includes(needle); }) || Object.entries(aliases).some(([alias, canonical]) => alias.includes(raw) && normalize(typeLabel(item.equipmentType)).includes(canonical))));
}
export function createLaboratoryEquipment(model, local = {}, now = Date.now()) {
  if (!model?.id) throw new Error("Не выбрана модель каталога");
  return { id: local.id || `equipment_${now}`, source: "catalog", catalogModelId: model.id, manufacturer: model.manufacturer, model: model.model, name: local.name || model.model, type: typeLabel(model.equipmentType), equipmentType: model.equipmentType, serialNumber: String(local.serialNumber || ""), inventoryNumber: String(local.inventoryNumber || ""), arm: String(local.arm || ""), calibrationValidUntil: String(local.calibrationValidUntil || ""), note: String(local.note || ""), photo: String(local.photo || ""), specs: [], icon: "🔧" };
}
export function migrateLaboratoryEquipment(item = {}) { return { ...item, source: item.source === "catalog" && item.catalogModelId ? "catalog" : "custom", catalogModelId: item.catalogModelId || null }; }
export const visibleSpecifications = model => Object.entries(model?.specifications || {}).filter(([, value]) => value !== null && value !== undefined && value !== "").map(([key, value]) => [specificationLabel(key), value]);
