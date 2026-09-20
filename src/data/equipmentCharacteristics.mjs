export const CHARACTERISTIC_TYPES = {
  cable_loss: {
    type: "cable_loss",
    title: "Калибровочная характеристика кабеля",
    frequencyUnit: "МГц",
    valueUnit: "дБ",
    frequencyLabel: "Частота, МГц",
    valueLabel: "Потери, дБ",
  },
  transfer_impedance: {
    type: "transfer_impedance",
    title: "Калибровочная характеристика токосъёмника",
    frequencyUnit: "МГц",
    valueUnit: "дБОм",
    frequencyLabel: "Частота, МГц",
    valueLabel: "Передаточный импеданс, дБОм",
  },
};

export const OUT_OF_RANGE_ERROR = "Частота находится вне диапазона калибровочной характеристики.";

const parseNumber = value => {
  const text = String(value ?? "").trim();
  if (!text) return NaN;
  return Number(text.replace(",", "."));
};

export function characteristicDefinitionForEquipment(type = "") {
  const value = String(type).toLocaleLowerCase("ru");
  if (value.includes("кабель")) return CHARACTERISTIC_TYPES.cable_loss;
  if (value.includes("токосъёмник") || value.includes("токовый пробник") || value.includes("монитор тока")) {
    return CHARACTERISTIC_TYPES.transfer_impedance;
  }
  return null;
}

export function validateCharacteristicRows(rows = []) {
  const points = [];
  for (const row of rows) {
    const frequencyText = String(row?.frequencyMHz ?? "").trim();
    const valueText = String(row?.value ?? "").trim();
    if (!frequencyText && !valueText) continue;
    if (!frequencyText) throw new Error("Заполните частоту для значения характеристики.");
    if (!valueText) throw new Error(`Заполните значение характеристики для частоты ${frequencyText} МГц.`);
    const frequencyMHz = parseNumber(frequencyText);
    const value = parseNumber(valueText);
    if (!Number.isFinite(frequencyMHz)) throw new Error(`Некорректное значение частоты: ${frequencyText}.`);
    if (frequencyMHz <= 0) throw new Error("Частота должна быть больше 0 МГц.");
    if (!Number.isFinite(value)) throw new Error(`Некорректное значение характеристики для частоты ${frequencyText} МГц.`);
    points.push({ frequencyMHz, value });
  }
  const frequencies = new Map();
  for (const point of points) frequencies.set(point.frequencyMHz, (frequencies.get(point.frequencyMHz) || 0) + 1);
  const duplicates = [...frequencies].filter(([, count]) => count > 1).map(([frequency]) => formatCharacteristicNumber(frequency));
  if (duplicates.length) throw new Error(`В таблице обнаружены повторяющиеся значения частоты: ${duplicates.join(", ")} МГц.`);
  return points.sort((a, b) => a.frequencyMHz - b.frequencyMHz);
}

export function parseCharacteristicTable(text) {
  const rows = String(text ?? "").split(/\r?\n/).map(line => line.split("\t")).filter(columns => columns.some(value => value.trim()));
  if (!rows.length) return [];
  // Заголовок отличаем по первой (частотной) ячейке. Так ошибочное значение
  // во второй колонке числовой строки не будет молча принято за заголовок.
  const firstIsHeader = rows[0].length >= 2 && !Number.isFinite(parseNumber(rows[0][0]));
  const dataRows = firstIsHeader ? rows.slice(1) : rows;
  return validateCharacteristicRows(dataRows.map(columns => ({ frequencyMHz: columns[0] ?? "", value: columns[1] ?? "" })));
}

export function formatCharacteristicNumber(value) {
  return String(value).replace(".", ",");
}

export function formatCharacteristicTable(points, definition) {
  const valid = validateCharacteristicRows(points);
  return [
    `${definition.frequencyLabel}\t${definition.valueLabel}`,
    ...valid.map(point => `${formatCharacteristicNumber(point.frequencyMHz)}\t${formatCharacteristicNumber(point.value)}`),
  ].join("\n");
}

export function createEquipmentCharacteristic(definition, points = []) {
  return {
    type: definition.type,
    frequencyUnit: definition.frequencyUnit,
    valueUnit: definition.valueUnit,
    points: validateCharacteristicRows(points),
  };
}

export function normalizeEquipmentCharacteristic(value, definition) {
  if (!value || value.type !== definition.type || !Array.isArray(value.points)) return createEquipmentCharacteristic(definition);
  try { return createEquipmentCharacteristic(definition, value.points); } catch { return createEquipmentCharacteristic(definition); }
}

export function setEquipmentCharacteristic(equipment, equipmentId, characteristic) {
  return (equipment || []).map(item => item.id === equipmentId ? { ...item, calibrationCharacteristic: characteristic } : item);
}

export function getCharacteristicValue(points, frequencyMHz) {
  const frequency = Number(frequencyMHz);
  if (!Number.isFinite(frequency) || frequency <= 0) return { ok: false, error: "Частота должна быть больше 0 МГц." };
  let valid;
  try { valid = validateCharacteristicRows(points); } catch (error) { return { ok: false, error: error.message }; }
  if (!valid.length || frequency < valid[0].frequencyMHz || frequency > valid.at(-1).frequencyMHz) {
    return { ok: false, error: OUT_OF_RANGE_ERROR };
  }
  const exact = valid.find(point => point.frequencyMHz === frequency);
  if (exact) return { ok: true, value: exact.value, exact: true };
  const upperIndex = valid.findIndex(point => point.frequencyMHz > frequency);
  const lower = valid[upperIndex - 1], upper = valid[upperIndex];
  return {
    ok: true,
    value: lower.value + (upper.value - lower.value) * ((frequency - lower.frequencyMHz) / (upper.frequencyMHz - lower.frequencyMHz)),
    exact: false,
  };
}
