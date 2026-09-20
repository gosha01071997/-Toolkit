import test from "node:test";
import assert from "node:assert/strict";
import { calculate, computeTableRows, createScenario, equipmentMatchesType, equipmentOptionLabels, getVisibleStages, parseTablePaste, searchEquipment } from "../src/features/guidedTest/engine.mjs";
import { deletePhoto, loadPhotos, loadProgress, readExistingEquipment, savePhoto, saveProgress } from "../src/features/guidedTest/persistence.mjs";
import { demoScenario } from "../src/features/guidedTest/demoScenario.mjs";

const memoryStorage = (initial = {}) => { const data = new Map(Object.entries(initial)); return { getItem: key => data.has(key) ? data.get(key) : null, setItem: (key, value) => data.set(key, String(value)), removeItem: key => data.delete(key), dump: () => Object.fromEntries(data) }; };

test("создаёт универсальный сценарий с безопасными значениями по умолчанию", () => {
  const scenario = createScenario({ id: "x", title: "Испытание", stages: { result: {} } });
  assert.equal(scenario.version, 1); assert.deepEqual(scenario.equipmentRequirements, []); assert.equal(getVisibleStages(scenario)[0].title, "Результат");
  assert.throws(() => createScenario({ title: "Нет id" }));
});

test("скрывает необязательные и не требующиеся этапы", () => {
  const stages = getVisibleStages(createScenario({ id: "x", title: "X", stages: { conditions: {}, preparation: { hidden: true }, calibration: { required: false }, procedure: {} } }));
  assert.deepEqual(stages.map(stage => stage.id), ["conditions", "procedure"]);
});

test("сохраняет прогресс и восстанавливает незавершённое испытание", () => {
  const storage = memoryStorage();
  saveProgress(storage, "demo", { currentStage: 3, completed: { inspect: true }, inputs: { value: "2,5" } });
  const restored = loadProgress(storage, "demo");
  assert.equal(restored.currentStage, 3); assert.equal(restored.completed.inspect, true); assert.equal(restored.inputs.value, "2,5"); assert.ok(restored.updatedAt);
});

test("выбирает оборудование только нужного типа и ищет по трём полям", () => {
  const equipment = [{ name: "Источник", manufacturer: "Радио", model: "Г-1", type: "Генератор ВЧ" }, { name: "Приёмник", manufacturer: "Лаб", model: "П-2", type: "Анализатор" }];
  assert.equal(equipmentMatchesType(equipment[0], { type: "Генератор" }), true);
  assert.equal(equipmentMatchesType(equipment[1], { type: "Генератор" }), false);
  assert.equal(searchEquipment(equipment, "радио")[0].name, "Источник"); assert.equal(searchEquipment(equipment, "п-2")[0].name, "Приёмник");
});

test("сохраняет и удаляет пользовательскую фотографию вместе с метаданными", () => {
  const storage = memoryStorage(); const saved = savePhoto(storage, "demo", { dataUrl: "data:image/png;base64,AA", caption: "Стенд" }, 1000);
  assert.equal(loadPhotos(storage, "demo")[0].caption, "Стенд"); assert.equal(saved.id, "photo_1000");
  assert.deepEqual(deletePhoto(storage, "demo", saved.id), []);
});

test("таблица принимает Excel-вставку, запятую и вычисляемый столбец", () => {
  assert.deepEqual(parseTablePaste("A\t1,5\nB\t2.5", 2), [["A", "1,5"], ["B", "2.5"]]);
  const table = demoScenario.stages.procedure.tables[0];
  assert.deepEqual(computeTableRows(table, [{ point: "A", measured: "1,5" }])[0], { point: "A", measured: "1,5", doubled: 3 });
});

test("расчётный callback отделён от интерфейса", () => {
  assert.equal(calculate((values, helpers) => helpers.normalizeNumber(values.x) + 1, { x: "2,5" }), 3.5);
});

test("чтение каталога обратно совместимо и не изменяет существующие данные", () => {
  const original = [{ id: "old", name: "Старый прибор", type: "Генератор" }];
  const storage = memoryStorage({ emc_custom_equip_v1: JSON.stringify(original), legacy_unrelated_key: "keep" });
  assert.equal(readExistingEquipment(storage, [])[0].name, "Старый прибор");
  assert.equal(storage.getItem("legacy_unrelated_key"), "keep"); assert.deepEqual(JSON.parse(storage.getItem("emc_custom_equip_v1")), original);
});

test("безымянные записи оборудования получают различимые presentation fallback", () => {
  const items = [{ id: "1", name: "Новое оборудование" }, { id: "2", name: "", manufacturer: "", model: "" }, { id: "3", name: "Компас", manufacturer: "Завод", model: "К-1" }];
  const labels = equipmentOptionLabels(items);
  assert.equal(labels.get("1"), "Оборудование без названия #1");
  assert.equal(labels.get("2"), "Оборудование без названия #2");
  assert.equal(labels.get("3"), "Компас · Завод · К-1");
});

test("DEMO по умолчанию сохраняет checklist и подтверждение этапа", () => {
  assert.notEqual(demoScenario.showStageCompletion, false);
  assert.notEqual(demoScenario.stages.preparation.showActionCompletion, false);
  assert.equal(demoScenario.stages.preparation.actions[0].id, "inspect");
});
