import test from "node:test";
import assert from "node:assert/strict";
import {
  CHARACTERISTIC_TYPES,
  OUT_OF_RANGE_ERROR,
  createEquipmentCharacteristic,
  formatCharacteristicTable,
  getCharacteristicValue,
  parseCharacteristicTable,
  setEquipmentCharacteristic,
  validateCharacteristicRows,
} from "../src/data/equipmentCharacteristics.mjs";

test("вставка двух колонок с десятичной точкой", () => {
  assert.deepEqual(parseCharacteristicTable("0.15\t1.25\n10\t2.5\n"), [{ frequencyMHz: 0.15, value: 1.25 }, { frequencyMHz: 10, value: 2.5 }]);
});

test("вставка двух колонок с десятичной запятой", () => {
  assert.deepEqual(parseCharacteristicTable("0,15\t-14,32\n1\t-8,03"), [{ frequencyMHz: 0.15, value: -14.32 }, { frequencyMHz: 1, value: -8.03 }]);
});

test("заголовок Excel не становится калибровочной точкой", () => {
  assert.deepEqual(parseCharacteristicTable("Частота, МГц\tПотери, дБ\n0,15\t0,12\n1\t0,18"), [{ frequencyMHz: 0.15, value: 0.12 }, { frequencyMHz: 1, value: 0.18 }]);
});

test("точки автоматически сортируются без разрыва пары значений", () => {
  assert.deepEqual(parseCharacteristicTable("100\t4\n1\t2\n30\t3\n0,15\t1"), [
    { frequencyMHz: 0.15, value: 1 }, { frequencyMHz: 1, value: 2 }, { frequencyMHz: 30, value: 3 }, { frequencyMHz: 100, value: 4 },
  ]);
});

test("повторяющиеся частоты отклоняются", () => {
  assert.throws(() => parseCharacteristicTable("10\t0,5\n10\t0,7"), /повторяющиеся значения частоты: 10 МГц/);
});

test("некорректное числовое значение отклоняется", () => {
  assert.throws(() => parseCharacteristicTable("10\tне число"), /Некорректное значение характеристики/);
});

test("частично пустая строка отклоняется с указанием частоты", () => {
  assert.throws(() => parseCharacteristicTable("30\t"), /Заполните значение характеристики для частоты 30 МГц/);
});

test("копирование формирует таблицу Excel с заголовками", () => {
  assert.equal(formatCharacteristicTable([{ frequencyMHz: 1, value: 0.18 }, { frequencyMHz: 0.15, value: 0.12 }], CHARACTERISTIC_TYPES.cable_loss), "Частота, МГц\tПотери, дБ\n0,15\t0,12\n1\t0,18");
});

test("точное совпадение возвращает исходное значение", () => {
  assert.deepEqual(getCharacteristicValue([{ frequencyMHz: 10, value: 1.37 }, { frequencyMHz: 20, value: 3 }], 10), { ok: true, value: 1.37, exact: true });
});

test("между ближайшими точками выполняется линейная интерполяция", () => {
  assert.deepEqual(getCharacteristicValue([{ frequencyMHz: 20, value: 3 }, { frequencyMHz: 10, value: 1 }], 15), { ok: true, value: 2, exact: false });
});

test("экстраполяция ниже диапазона запрещена", () => {
  assert.deepEqual(getCharacteristicValue([{ frequencyMHz: 10, value: 1 }, { frequencyMHz: 100, value: 2 }], 9), { ok: false, error: OUT_OF_RANGE_ERROR });
});

test("экстраполяция выше диапазона запрещена", () => {
  assert.deepEqual(getCharacteristicValue([{ frequencyMHz: 10, value: 1 }, { frequencyMHz: 100, value: 2 }], 150), { ok: false, error: OUT_OF_RANGE_ERROR });
});

test("таблицы экземпляров Кабель A и Кабель B хранятся независимо", () => {
  const equipment = [{ id: "cable-a", name: "Кабель A" }, { id: "cable-b", name: "Кабель B" }];
  const first = setEquipmentCharacteristic(equipment, "cable-a", createEquipmentCharacteristic(CHARACTERISTIC_TYPES.cable_loss, [{ frequencyMHz: 10, value: 0.5 }]));
  const second = setEquipmentCharacteristic(first, "cable-b", createEquipmentCharacteristic(CHARACTERISTIC_TYPES.cable_loss, [{ frequencyMHz: 10, value: 0.7 }]));
  assert.equal(second[0].calibrationCharacteristic.points[0].value, 0.5);
  assert.equal(second[1].calibrationCharacteristic.points[0].value, 0.7);
});

test("таблицы экземпляров Токосъёмник A и Токосъёмник B хранятся независимо", () => {
  const equipment = [{ id: "probe-a" }, { id: "probe-b" }];
  const first = setEquipmentCharacteristic(equipment, "probe-a", createEquipmentCharacteristic(CHARACTERISTIC_TYPES.transfer_impedance, [{ frequencyMHz: 1, value: -8.1 }]));
  const second = setEquipmentCharacteristic(first, "probe-b", createEquipmentCharacteristic(CHARACTERISTIC_TYPES.transfer_impedance, [{ frequencyMHz: 1, value: -7.9 }]));
  assert.notDeepEqual(second[0].calibrationCharacteristic, second[1].calibrationCharacteristic);
});

test("отрицательное значение характеристики сохраняется", () => {
  assert.equal(createEquipmentCharacteristic(CHARACTERISTIC_TYPES.transfer_impedance, [{ frequencyMHz: 0.15, value: -14.3 }]).points[0].value, -14.3);
});

test("нулевая и отрицательная частоты отклоняются", () => {
  assert.throws(() => validateCharacteristicRows([{ frequencyMHz: 0, value: 1 }]), /больше 0/);
  assert.throws(() => validateCharacteristicRows([{ frequencyMHz: -1, value: 1 }]), /больше 0/);
});
