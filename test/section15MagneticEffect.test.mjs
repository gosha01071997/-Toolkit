import test from "node:test";
import assert from "node:assert/strict";
import { calculateControlDeflection, checkFieldUniformity, checkLaboratoryConditions, classifyMagneticEffect } from "../src/features/guidedTest/section15Calculations.mjs";
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
test("сценарий содержит семь предметных этапов", () => assert.deepEqual(getVisibleStages(section15MagneticEffect).map(s=>s.title),["Условия испытания","Оборудование","Подготовка","Схема","Подготовка измерительной системы","Проведение испытания","Результат"]));
test("прогресс Section 15 восстанавливается целиком", () => { const data=new Map(); const storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)}; const progress={currentStage:5,completed:{maximumModeFound:true},inputs:{temperature:"20",humidity:"50",pressure:"100",h:"14,4",method:"sensor",uniformity:"0,2",distance:"0,42",reachesDc:"yes"},equipment:{deflectionInstrument:"own"}}; saveProgress(storage,section15MagneticEffect.id,progress); assert.deepEqual(loadProgress(storage,section15MagneticEffect.id).inputs,progress.inputs); assert.equal(loadProgress(storage,section15MagneticEffect.id).equipment.deflectionInstrument,"own"); });
