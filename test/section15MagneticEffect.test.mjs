import test from "node:test";
import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { calculateControlDeflection, checkFieldUniformity, checkLaboratoryConditions, classifyMagneticEffect, getMagneticEffectResult } from "../src/features/guidedTest/section15Calculations.mjs";
import { SECTION_15_SETUP_IMAGE, section15MagneticEffect } from "../src/features/guidedTest/scenarios/section15MagneticEffect.mjs";
import { getVisibleStages, isVisible } from "../src/features/guidedTest/engine.mjs";
import { loadProgress, saveProgress } from "../src/features/guidedTest/persistence.mjs";

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-12);
test("H должно быть больше нуля и поддерживает десятичную запятую", () => { assert.equal(calculateControlDeflection("14,4"), 1); for (const h of [0, -1, "x", Infinity]) assert.throws(() => calculateControlDeflection(h), RangeError); });
test("Dc равен 1° в диапазоне 14,4 ±10%, включая границы", () => ["14,4", 12.96, 15.84].forEach(h => assert.equal(calculateControlDeflection(h), 1)));
test("Dc равен 14,4/H вне опорного диапазона", () => { close(calculateControlDeflection(10), 1.44); close(calculateControlDeflection(20), .72); });
test("категория Y применяется, когда Dc не достигается", () => assert.equal(classifyMagneticEffect(100, false), "Y"));
test("границы категорий Z, A, B и C не трактуются как прошёл/не прошёл", () => {
  for (const [distance, category] of [[.01, "Z"], [.3, "Z"], [.300001, "A"], [1, "A"], [1.000001, "B"], [3, "B"], [3.000001, "C"]]) assert.equal(classifyMagneticEffect(distance), category);
});
test("однородность использует абсолютный предел ±0,5°", () => { assert.equal(checkFieldUniformity("-0,5").ok, true); assert.equal(checkFieldUniformity(.51).ok, false); });
test("условия помещения проверяются существующей функцией", () => { assert.equal(checkLaboratoryConditions({ temperature: 25, humidity: 85, pressure: 84 }).ok, true); assert.deepEqual(checkLaboratoryConditions({ temperature: 36, humidity: 86, pressure: 108 }).checks, { temperature: false, humidity: false, pressure: false }); });
test("Section 15 состоит из шести ориентированных на действия шагов", () => assert.deepEqual(getVisibleStages(section15MagneticEffect).map(stage => stage.title), ["Подготовьте оборудование", "Определите магнитное поле", "Соберите установку", "Найдите максимальное воздействие", "Определите расстояние D", "Итог"]));
test("Section 15 не показывает checklist или подтверждение этапа", () => {
  assert.equal(section15MagneticEffect.showStageCompletion, false);
  for (const stage of Object.values(section15MagneticEffect.stages)) {
    if (stage.actions) assert.equal(stage.showActionCompletion, false);
    assert.ok((stage.actions || []).every(action => !("checkboxLabel" in action)));
  }
});
test("категория появляется на шаге определения D", () => {
  const measure = section15MagneticEffect.stages.distance.measurementResult;
  for (const [distance, category] of [["0,2", "Z"], ["0,42", "A"], ["2", "B"], ["3,1", "C"]]) assert.equal(measure({ reachesDc: "yes", distance, h: "14" }).category, category);
  assert.equal(measure({ reachesDc: "no", h: "14" }).category, "Y");
});
test("при Y поле D скрыто и не требуется", () => {
  const distance = section15MagneticEffect.stages.distance.fields.find(field => field.id === "distance");
  assert.equal(isVisible(distance, { reachesDc: "no" }), false);
  assert.equal(section15MagneticEffect.stages.distance.measurementResult({ reachesDc: "no", h: 14.4 }).distance, 0);
});
test("при перемещении индикатора отображается проверка однородности", () => {
  const stage = section15MagneticEffect.stages.distance;
  assert.equal(isVisible(stage.fields.find(field => field.id === "uniformity"), { method: "sensor" }), true);
  assert.equal(isVisible(stage.notices[0], { method: "sensor" }), true);
  assert.match(stage.notices[0].text, /±0,5°/);
});
test("итог повторяет рассчитанную ранее категорию", () => {
  const inputs = { reachesDc: "yes", distance: "0,42", h: "14", temperature: "20", humidity: "50", pressure: "100" };
  assert.equal(section15MagneticEffect.stages.distance.measurementResult(inputs).category, "A");
  assert.equal(section15MagneticEffect.stages.result.result(inputs).category, getMagneticEffectResult(inputs).category);
});
test("схема Section 15 является импортируемым production-ресурсом", async () => { assert.match(SECTION_15_SETUP_IMAGE, /section15-setup\.svg/); await access(fileURLToPath(SECTION_15_SETUP_IMAGE)); });
test("структурированный прогресс Section 15 восстанавливается целиком", () => {
  const data = new Map(); const storage = { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) };
  const progress = { currentStage: 4, completed: {}, inputs: { eutName: "Блок", eutModel: "Б-1", eutNote: "Стенд", temperature: "20", humidity: "50", pressure: "100", hKnown: "no", h: "14,4", maximumMode: "Рабочий", method: "sensor", uniformity: "0,2", distance: "0,42", reachesDc: "yes" }, equipment: { deflectionInstrument: "compass", magnetometer: "meter" } };
  saveProgress(storage, section15MagneticEffect.id, progress);
  assert.deepEqual(loadProgress(storage, section15MagneticEffect.id).inputs, progress.inputs);
  assert.deepEqual(loadProgress(storage, section15MagneticEffect.id).equipment, progress.equipment);
});
