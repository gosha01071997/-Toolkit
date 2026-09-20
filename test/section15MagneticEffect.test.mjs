import test from "node:test";
import assert from "node:assert/strict";
import { calculateControlDeflection, checkFieldUniformity, checkLaboratoryConditions, classifyMagneticEffect, getMagneticEffectResult } from "../src/features/guidedTest/section15Calculations.mjs";
import { section15MagneticEffect } from "../src/features/guidedTest/scenarios/section15MagneticEffect.mjs";
import { getVisibleStages } from "../src/features/guidedTest/engine.mjs";
import { loadProgress, saveProgress } from "../src/features/guidedTest/persistence.mjs";

const close = (a,b) => assert.ok(Math.abs(a-b)<1e-12);
test("Dc равен 1 в опорном диапазоне, включая границы", () => ["14,4",12.96,15.84].forEach(h => assert.equal(calculateControlDeflection(h),1)));
test("Dc корректируется ниже и выше опорного диапазона", () => { close(calculateControlDeflection(10),1.44); close(calculateControlDeflection(20),.72); });
test("H валидируется и поддерживает десятичную запятую", () => { assert.equal(calculateControlDeflection("14,4"),1); for (const h of [0,-1,"x",Infinity]) assert.throws(() => calculateControlDeflection(h),RangeError); });
test("категории определяются на всех границах", () => { assert.equal(classifyMagneticEffect(0),"Y"); assert.equal(classifyMagneticEffect(.01),"Z"); assert.equal(classifyMagneticEffect(.3),"Z"); assert.equal(classifyMagneticEffect(.31),"A"); assert.equal(classifyMagneticEffect(1),"A"); assert.equal(classifyMagneticEffect(1.01),"B"); assert.equal(classifyMagneticEffect(3),"B"); assert.equal(classifyMagneticEffect(3.01),"C"); assert.equal(classifyMagneticEffect(100,false),"Y"); });
test("однородность использует абсолютный предел 0,5°", () => { assert.equal(checkFieldUniformity("-0,5").ok,true); assert.equal(checkFieldUniformity(.51).ok,false); });
test("условия помещения дают общий результат и результаты параметров", () => { assert.equal(checkLaboratoryConditions({temperature:25,humidity:85,pressure:84}).ok,true); const bad=checkLaboratoryConditions({temperature:36,humidity:86,pressure:108}); assert.equal(bad.ok,false); assert.deepEqual(bad.checks,{temperature:false,humidity:false,pressure:false}); });
test("сценарий содержит семь предметных этапов с итоговой сводкой", () => assert.deepEqual(getVisibleStages(section15MagneticEffect).map(s=>s.title),["Условия испытания","Оборудование","Подготовка","Схема","Подготовка измерительной системы","Проведение испытания","Итог"]));
test("подготовка Section 15 является инструкцией без checklist", () => {
  assert.equal(section15MagneticEffect.stages.preparation.showActionCompletion, false);
  assert.ok(section15MagneticEffect.stages.preparation.actions.every(action => !("checkboxLabel" in action)));
});
test("Section 15 отключает подтверждение этапа, сохраняя data-driven настройку", () => assert.equal(section15MagneticEffect.showStageCompletion, false));
test("поле фактического максимального отклонения удалено", () => assert.equal(section15MagneticEffect.stages.procedure.fields.some(field => field.id === "maximumDeflection"), false));
test("результат измерения появляется на этапе проведения и использует классификатор", () => {
  const measure = section15MagneticEffect.stages.procedure.measurementResult;
  for (const [distance, category, range] of [["0,42", "A", "0,3 < D ≤ 1 м"], ["0,2", "Z", "0 < D ≤ 0,3 м"], ["2", "B", "1 < D ≤ 3 м"], ["3,1", "C", "D > 3 м"]]) {
    const result = measure({ reachesDc: "yes", distance, h: "14" });
    assert.equal(result.category, category); assert.equal(result.categoryRange, range);
  }
  assert.equal(measure({ reachesDc: "no", h: "14" }).category, "Y");
  assert.equal(measure({ reachesDc: "no", h: "14" }).distance, 0);
});
test("итог использует тот же чистый результат категории, что и измерение", () => {
  const inputs = { reachesDc: "yes", distance: "0,42", h: "14", temperature: "20", humidity: "50", pressure: "100" };
  assert.equal(section15MagneticEffect.stages.procedure.measurementResult(inputs).category, "A");
  assert.equal(section15MagneticEffect.stages.result.result(inputs).category, getMagneticEffectResult(inputs).category);
});
test("прогресс Section 15 восстанавливается целиком", () => { const data=new Map(); const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}; const progress={currentStage:5,completed:{maximumModeFound:true},inputs:{temperature:"20",humidity:"50",pressure:"100",h:"14,4",method:"sensor",uniformity:"0,2",distance:"0,42",reachesDc:"yes"},equipment:{deflectionInstrument:"own"}}; saveProgress(storage,section15MagneticEffect.id,progress); assert.deepEqual(loadProgress(storage,section15MagneticEffect.id).inputs,progress.inputs); assert.equal(loadProgress(storage,section15MagneticEffect.id).equipment.deflectionInstrument,"own"); });
