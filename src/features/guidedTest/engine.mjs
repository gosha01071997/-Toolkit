export const STAGE_ORDER = ["conditions", "equipment", "preparation", "diagram", "measurementSetup", "settings", "calibration", "procedure", "result"];

export const STAGE_TITLES = {
  conditions: "Условия испытания", equipment: "Оборудование", preparation: "Подготовка",
  diagram: "Схема", measurementSetup: "Подготовка измерительной системы", settings: "Настройка", calibration: "Калибровка",
  procedure: "Проведение испытания", result: "Результат",
};

const array = value => Array.isArray(value) ? value : [];

export function createScenario(source = {}) {
  if (!source.id || !source.title) throw new Error("Сценарию нужны идентификатор и название");
  return {
    version: 1, standard: "Не задан", section: "Не задан", description: "", categories: [],
    objectVariants: [], equipmentRequirements: [], warnings: [], notes: [], stages: {},
    calculations: {}, ...source,
  };
}

export function getVisibleStages(scenario) {
  return (scenario.stageOrder || STAGE_ORDER).filter(id => {
    const stage = scenario.stages?.[id];
    if (stage?.hidden === true || stage?.enabled === false) return false;
    if (id === "calibration") return Boolean(stage?.required);
    return Boolean(stage);
  }).map(id => ({ id, title: scenario.stages[id].title || STAGE_TITLES[id], ...scenario.stages[id] }));
}

export function isVisible(definition, inputs) {
  return typeof definition?.visibleWhen !== "function" || definition.visibleWhen(inputs);
}

export function validateField(definition, value, inputs = {}) {
  if (!isVisible(definition, inputs)) return null;
  if (typeof definition.validate === "function") return definition.validate(value, inputs);
  return null;
}

export function normalizeNumber(value) {
  if (typeof value === "number") return value;
  const normalized = String(value ?? "").trim().replace(/\s/g, "").replace(",", ".");
  return normalized === "" ? NaN : Number(normalized);
}

export function calculate(callback, inputs) {
  if (typeof callback !== "function") return null;
  return callback(inputs, { normalizeNumber });
}

export function searchEquipment(items, query = "") {
  const needle = query.trim().toLocaleLowerCase("ru");
  if (!needle) return array(items);
  return array(items).filter(item => [item.name, item.manufacturer, item.model]
    .some(value => String(value || "").toLocaleLowerCase("ru").includes(needle)));
}

export function equipmentOptionLabels(items) {
  const unnamed = array(items).filter(item => {
    const name = String(item?.name || "").trim();
    return (!name || name === "Новое оборудование") && !String(item?.manufacturer || "").trim() && !String(item?.model || "").trim();
  });
  return new Map(array(items).map(item => {
    const unnamedIndex = unnamed.indexOf(item);
    if (unnamedIndex >= 0) return [item.id, `Оборудование без названия${unnamed.length > 1 ? ` #${unnamedIndex + 1}` : ""}`];
    return [item.id, `${item.name || "Оборудование без названия"} · ${item.manufacturer || "производитель не указан"} · ${item.model || "модель не указана"}`];
  }));
}

const normalizedType = value => String(value || "").toLocaleLowerCase("ru").replace(/\s+/g, " ");
export function equipmentMatchesType(item, requirement) {
  const type = normalizedType(item?.type);
  const accepted = [requirement?.type, ...array(requirement?.aliases)].map(normalizedType);
  return accepted.some(candidate => candidate && (type.includes(candidate) || candidate.includes(type)));
}

export function checkEquipmentCompatibility(item, requirement = {}) {
  const warnings = [];
  if (!equipmentMatchesType(item, requirement)) warnings.push("Тип оборудования не соответствует требованию сценария");
  if (requirement.frequencyRange && item?.frequencyRange) {
    const needed = requirement.frequencyRange;
    const actual = item.frequencyRange;
    if (Number(actual.min) > Number(needed.min) || Number(actual.max) < Number(needed.max)) warnings.push("Рабочий диапазон не покрывает требование сценария");
  }
  array(requirement.requiredCharacteristics).forEach(key => {
    if (item?.characteristics?.[key] == null) warnings.push(`Нет характеристики: ${key}`);
  });
  return { compatible: warnings.length === 0, warnings };
}

export function parseTablePaste(text, columnCount) {
  return String(text || "").trim().split(/\r?\n/).filter(Boolean).map(line => {
    const cells = line.split("\t");
    return Array.from({ length: columnCount }, (_, i) => cells[i] ?? "");
  });
}

export function tableToTsv(columns, rows) {
  return [columns.map(c => c.title).join("\t"), ...rows.map(row => columns.map(c => row[c.key] ?? "").join("\t"))].join("\n");
}

export function computeTableRows(table, rows) {
  return array(rows).map(row => {
    const next = { ...row };
    array(table.columns).forEach(column => {
      if (typeof column.calculate === "function") next[column.key] = column.calculate(next, { normalizeNumber });
    });
    return next;
  });
}
