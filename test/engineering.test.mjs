import test from "node:test";
import assert from "node:assert/strict";
import {
  antennaFactorReceive, antennaFactorTransmit, antennaPositionStep, chamberBeatFrequencyMHz,
  chamberKField, chamberKPower, chamberModesEquivalent, chamberModesRectangular, shieldingEffectiveness,
} from "../src/calculations/engineering.mjs";
import { EMC_LIMITS, evaluateLimit } from "../src/data/limits/emcLimits.mjs";
import { MMHG_TO_PA, convertPressure } from "../src/calculations/pressure.mjs";
import { addStep, createUserTest, deleteUserTest, migrateEquipmentItem, moveStep, removeStep, updateStep } from "../src/data/userData.mjs";
import { buildTestCatalog, buildJournalTestOptions, createEquipmentPatch, migrateJournalEntry, snapshotJournalSelection } from "../src/data/catalog.mjs";
import { CALIBRATION_STORAGE_KEY, calibrationBackup, calculateCorrectedValue, createCalibrationPoint, createCalibrationSet, exportCalibrationCsv, exportCalibrationJson, findCalibrationPoint, getCalibrationUnitRule, importCalibrationCsv, loadCalibrationSets, parseCalibrationCsv, restoreCalibrationBackup, saveCalibrationSets, sortCalibrationPoints } from "../src/data/calibration.mjs";
import { readFileSync } from "node:fs";
import { P204_MODEL, P204_PROGRESS_KEY, createP204Progress, findP204ReferencePoint, getP204Steps, loadP204Progress, resetP204Progress, saveP204Progress, selectP204Category, updateP204Progress } from "../src/data/tests/p204.mjs";

const p204Fixture = { ...P204_MODEL, categories:[{id:"fixture",label:"Fixture",parameters:[{id:"level",input:true}],requiredEquipmentRoles:[{id:"generator",label:"Generator"}],preparationSteps:[{id:"ready",text:"Ready"}],procedureSteps:[{id:"inject",phase:"испытание",text:"Inject"}]}] };
const memoryStorage = initial => { const data=new Map(Object.entries(initial||{})); return {getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value),data}; };

test("p204: выбор, сохранение и перезагрузка категории",()=>{const storage=memoryStorage();const selected=selectP204Category(createP204Progress(),"fixture",p204Fixture);assert.equal(selected.selectedCategoryId,"fixture");saveP204Progress(storage,selected);assert.equal(loadP204Progress(storage).selectedCategoryId,"fixture");assert.ok(storage.data.has(P204_PROGRESS_KEY));});
test("p204: смена категории очищает только категорийные данные",()=>{const model={...p204Fixture,categories:[...p204Fixture.categories,{id:"two"}]};const old=createP204Progress({selectedCategoryId:"fixture",userValues:{x:1},equipmentAssignments:{r:"e1"},observations:{initial:"saved",during:"",deviation:"",comment:""}});const next=selectP204Category(old,"two",model);assert.deepEqual(next.userValues,{});assert.deepEqual(next.equipmentAssignments,{});assert.equal(next.observations.initial,"saved");});
test("p204: значения, оборудование, checklist и выполненный шаг сохраняются одним объектом",()=>{const storage=memoryStorage();let value=createP204Progress({selectedCategoryId:"fixture"});value=updateP204Progress(value,{userValues:{level:{value:"12",unit:"fixture",source:"user"}},equipmentAssignments:{generator:"e4"},checklist:{ready:true},completedSteps:{inject:true}});saveP204Progress(storage,value);const loaded=loadP204Progress(storage);assert.equal(loaded.userValues.level.value,"12");assert.equal(loaded.equipmentAssignments.generator,"e4");assert.equal(loaded.checklist.ready,true);assert.equal(loaded.completedSteps.inject,true);});
test("p204: reset удаляет только прогресс сценария",()=>{const storage=memoryStorage({emc_test_steps_p204:'[{"text":"legacy"}]',emc_test_notes_p204:"note"});saveP204Progress(storage,{selectedCategoryId:"fixture"});const reset=resetP204Progress(storage);assert.equal(reset.selectedCategoryId,null);assert.equal(storage.getItem("emc_test_notes_p204"),"note");assert.match(storage.getItem("emc_test_steps_p204"),/legacy/);});
test("p204: пользовательские и старые шаги остаются в сценарии",()=>{const progress=createP204Progress({selectedCategoryId:"fixture"});const steps=getP204Steps(progress,p204Fixture,[{text:"legacy",phase:"подготовка"}]);assert.deepEqual(steps.map(x=>x.text),["Inject","legacy"]);});
test("p204: повреждённый и старый progress читаются безопасно",()=>{assert.equal(loadP204Progress(memoryStorage({[P204_PROGRESS_KEY]:"{"})).result,"incomplete");const old=loadP204Progress(memoryStorage({[P204_PROGRESS_KEY]:'{"selectedCategoryId":"fixture"}'}));assert.deepEqual(old.checklist,{});});
test("p204: реализация не изменяет модели p205, p21 и p215",()=>{const source=readFileSync(new URL("../src/data/tests/p204.mjs",import.meta.url),"utf8");for(const id of ["p205","p21","p215"])assert.doesNotMatch(source,new RegExp(`id:\\s*[\"']${id}`));});
test("p204: нормативные категории и диапазон заполнены",()=>{assert.deepEqual(P204_MODEL.categories.map(category=>category.id),["M","O","R","S","T","W","Y"]);assert.deepEqual(P204_MODEL.range,{startMHz:.01,endMHz:400,display:"10 kHz – 400 MHz"});});
test("p204: подтверждённые опорные токи доступны без интерполяции",()=>{assert.equal(findP204ReferencePoint("T",1)?.value,7.5);assert.equal(findP204ReferencePoint("Y",100)?.value,300);assert.equal(findP204ReferencePoint("S",400)?.value,.15);assert.equal(findP204ReferencePoint("O",30)?.value,250);assert.equal(findP204ReferencePoint("T",100)?.value,null);assert.equal(findP204ReferencePoint("T",100)?.curveDefined,true);assert.equal(findP204ReferencePoint("T",2),null);});
test("p204: частота нормализуется, а смена категории меняет требуемый уровень",()=>{assert.equal(findP204ReferencePoint("T",1000,"kHz")?.value,7.5);assert.equal(findP204ReferencePoint("O",1)?.value,250);assert.equal(findP204ReferencePoint("T",1)?.value,7.5);});
test("p204: фактический ток и состояние ИРИ сохраняются отдельно от требования",()=>{const progress=updateP204Progress(createP204Progress({selectedCategoryId:"T"}),{currentFrequency:{value:"1",unit:"MHz"},measuredCurrent:"7.6",eutState:"deviation",eutComment:"Перезапуск",deviationEvents:[{frequency:{value:"1",unit:"MHz"},measuredCurrent:"7.6",effect:"Перезапуск"}]});assert.equal(findP204ReferencePoint(progress.selectedCategoryId,progress.currentFrequency.value)?.value,7.5);assert.equal(progress.measuredCurrent,"7.6");assert.equal(progress.eutState,"deviation");assert.equal(progress.deviationEvents[0].effect,"Перезапуск");});

const close = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)), `${actual} ≉ ${expected}`);

test("число типов волн прямоугольной камеры", () => close(chamberModesRectangular(3, 4, 5, 100e6), (8*Math.PI/3)*3*4*5*100e6**3/3e8**3));
test("число типов волн по эквивалентному объёму", () => close(chamberModesEquivalent(60, 100e6), (8*Math.PI/3)*60*100e6**3/3e8**3));
test("fbeat сохраняет коэффициент 150", () => close(chamberBeatFrequencyMHz(3, 4), 62.5));
test("K камеры по мощности", () => { const r=chamberKPower({frequencyHz:100e6,receivedMax:2,incident:10});close(r.wavelength,3);close(r.k,(8*Math.PI/3)*Math.sqrt(1)); });
test("K камеры по трём составляющим поля", () => { const r=chamberKField(3,4,0,2);close(r.rmsComponent,Math.sqrt(25/3));close(r.k,Math.sqrt(25/6)); });
test("шаг позиций антенн B=A/N и защита N", () => { assert.equal(antennaPositionStep(10,5),2);assert.throws(()=>antennaPositionStep(10,0)); });
test("приёмный AF в линейных единицах", () => { const r=antennaFactorReceive({frequencyHz:100e6,u1:2,u2:1,distance:3});close(r.deltaU,1);close(r.k1,2);close(r.gain,2*Math.PI);close(r.af,20*Math.log10(9.76/(3*Math.sqrt(2*Math.PI)))); });
test("приёмный AF не смешивает dB и линейное отношение", () => close(antennaFactorReceive({frequencyHz:100e6,u1:26.020599913,u2:20,distance:3,unit:"db"}).k1,2,1e-9));
test("передающий AFT", () => close(antennaFactorTransmit({af:10,distance:3,wavelength:2}),20*Math.log10(3)-10-32-20*Math.log10(2)));
test("эффективность экранирования", () => assert.equal(shieldingEffectiveness(80,25),55));
test("точная конвертация mmHg ↔ Pa", () => {
  assert.equal(convertPressure(1, "mmHgToPa"), MMHG_TO_PA);
  close(convertPressure(convertPressure(760), "paToMmHg"), 760, 1e-14);
});
test("создание и удаление пользовательского испытания не затрагивает встроенное", () => {
  const builtIn = { id: "p15" };
  const custom = createUserTest({ short: "U-1", name: "Проверка", steps: [{ text: "A" }] }, 123);
  assert.equal(custom.id, "user_test_123"); assert.equal(custom.steps[0].n, 1);
  assert.deepEqual(deleteUserTest([builtIn, custom], custom.id), [builtIn]);
  assert.deepEqual(deleteUserTest([builtIn], builtIn.id), [builtIn]);
});
test("новый порядок шагов пересчитывается и сериализуется", () => {
  const reordered = moveStep([{ text:"A" }, { text:"B" }, { text:"C" }], 2, 0);
  assert.deepEqual(reordered.map(x=>[x.n,x.text]), [[1,"C"],[2,"A"],[3,"B"]]);
  assert.deepEqual(JSON.parse(JSON.stringify(reordered)), reordered);
});
test("пустые шаги не создаются автоматически и не добавляются", () => {
  assert.deepEqual(addStep([], { phase:"подготовка", text:"   " }), []);
  const source=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
  assert.doesNotMatch(source,/const STEP_TEMPLATE/);
});
test("одно подтверждение формы добавляет ровно один шаг", () => {
  const result=addStep([], { phase:"калибровка", text:"  Настроить генератор  " });
  assert.deepEqual(result,[{n:1,phase:"калибровка",text:"Настроить генератор"}]);
});
test("шаг можно удалить, изменить и перенумеровать", () => {
  const steps=[{n:1,phase:"подготовка",text:"A"},{n:2,phase:"испытание",text:"B"}];
  assert.deepEqual(updateStep(steps,1,{phase:"завершение",text:"Итог"})[1],{n:2,phase:"завершение",text:"Итог"});
  assert.deepEqual(removeStep(steps,0),[{n:1,phase:"испытание",text:"B"}]);
});
test("порядок шагов сохраняется после повторного чтения хранилища", () => {
  const saved=JSON.stringify(moveStep([{text:"A"},{text:"B"},{text:"C"}],2,0));
  const reopened=JSON.parse(saved);
  assert.deepEqual(reopened.map(step=>step.text),["C","A","B"]);
  assert.deepEqual(reopened.map(step=>step.n),[1,2,3]);
});
test("тип и ручная иконка оборудования сохраняются, старые данные мигрируют", () => {
  assert.deepEqual(migrateEquipmentItem({ id:"old" }), { id:"old", type:"Другое", icon:"🔧" });
  assert.equal(migrateEquipmentItem({ type:"LISN", icon:"🔌" }).icon, "🔌");
});

test("раздел 16 редактируется через слой пользовательских данных", () => {
  const base = [{ id:"p16_placeholder", short:"п.16", name:"Раздел 16", desc:"Требует заполнения" }];
  const result = buildTestCatalog(base, [], { p16_placeholder:{ desc:"Описание инженера", normDoc:"Документ лаборатории" } });
  assert.equal(result[0].desc, "Описание инженера");
  assert.equal(result[0].normDoc, "Документ лаборатории");
});
test("разделы 16–20 имеют актуальные технические названия, используемые журналом", () => {
  const source=readFileSync(new URL("../src/App.jsx",import.meta.url),"utf8");
  for (const section of [16,17,18,19,20]) assert.doesNotMatch(source,new RegExp(`name:\\s*['\"]Раздел ${section}['\"]`));
  for (const name of ["Входное электропитание","Выбросы напряжения","Восприимчивость к кондуктивным помехам звуковой частоты по цепям электропитания","Восприимчивость к индуцированным сигналам","Радиочастотная восприимчивость"]) assert.match(source,new RegExp(name));
});
test("в пользовательское испытание добавляется и перенумеровывается шаг", () => {
  const custom=createUserTest({steps:[{text:"Подготовка"},{text:"Новый шаг"}]},42);
  assert.deepEqual(custom.steps.map(x=>[x.n,x.text]),[[1,"Подготовка"],[2,"Новый шаг"]]);
});
test("общая форма оборудования сохраняет все поля одновременно", () => {
  const patch=createEquipmentPatch({name:"Генератор A",type:"Генератор",arm:"АРМ 1",desc:"Описание",specs:[{key:"f",value:"1 GHz"}],photo:"data:image/png;base64,x",icon:"⚡"});
  assert.equal(Object.keys(patch).length,7); assert.equal(patch.name,"Генератор A"); assert.equal(patch.photo,"data:image/png;base64,x");
});
test("выбранная иконка входит в общую транзакцию оборудования",()=>assert.equal(createEquipmentPatch({icon:"📡"}).icon,"📡"));

test("набор раздела 21 сохраняет, загружает и обрабатывает 700+ точек", () => {
  const points=Array.from({length:725},(_,i)=>createCalibrationPoint({frequency:.15+i*.01,frequencyUnit:"MHz",correction:i/10,correctionUnit:"dB",comment:`Точка ${i+1}`},i));
  const set=createCalibrationSet({name:"Рабочий тракт",testType:"21.4",laboratory:"Лаборатория",workplace:"Стенд 2",equipmentIds:["e2","e5"],points},"2026-09-14T00:00:00.000Z");
  const values=new Map(); const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  saveCalibrationSets(storage,[set]); const loaded=loadCalibrationSets(storage);
  assert.equal(loaded[0].points.length,725); assert.deepEqual(loaded[0].equipmentIds,["e2","e5"]); assert.ok(values.has(CALIBRATION_STORAGE_KEY));
  assert.equal(findCalibrationPoint(loaded[0],1.15,"MHz").comment,"Точка 101");
  assert.equal(findCalibrationPoint(loaded[0],1150,"kHz").comment,"Точка 101");
  assert.equal(findCalibrationPoint(loaded[0],1.151,"MHz"),null);
});
test("точки сортируются, изменяются и удаляются без изменения исходного массива",()=>{
  const a=createCalibrationPoint({id:"a",frequency:30,correction:1},0),b=createCalibrationPoint({id:"b",frequency:10,correction:2},1);
  assert.deepEqual(sortCalibrationPoints([a,b]).map(x=>x.id),["b","a"]);
  const changed=[a,b].map(x=>x.id==="a"?{...x,correction:7}:x); assert.equal(changed[0].correction,7);
  assert.deepEqual(changed.filter(x=>x.id!=="b").map(x=>x.id),["a"]);
});
test("CSV допускает ручное сопоставление лабораторных колонок и сообщает ошибки",()=>{
  const parsed=parseCalibrationCsv("F;Cable;Total;Note\n30;1,2;3,4;ok\nbad;1;2;error\n40;;4,5;ok2");
  const result=importCalibrationCsv(parsed,{frequency:0,cableLoss:1,correction:2,comment:3},{frequencyUnit:"MHz",correctionUnit:"dB"});
  assert.equal(result.imported,2); assert.equal(result.errorCount,1); assert.equal(result.points[0].cableLoss,"1,2");
  const csv=exportCalibrationCsv(createCalibrationSet({name:"T",testType:"21.5",points:result.points})); assert.match(csv,/frequencyUnit/); assert.match(csv,/ok2/);
  const json=JSON.parse(exportCalibrationJson(createCalibrationSet({name:"T",testType:"21.5",equipmentIds:["e3"],points:result.points}))); assert.equal(json.calibrationSet.equipmentIds[0],"e3");
});
test("backup/restore содержит calibrationSets, а старый backup без поля совместим",()=>{
  const set=createCalibrationSet({name:"T",testType:"21.5",points:[{frequency:1,correction:2}]});
  assert.equal(restoreCalibrationBackup(calibrationBackup([set]))[0].name,"T");
  assert.deepEqual(restoreCalibrationBackup({data:{legacy:true}}),[]);
});
test("поправка применяется только к совместимым единицам, предел необязателен",()=>{
  assert.deepEqual(calculateCorrectedValue({measured:40,measuredUnit:"dB",correction:3,correctionUnit:"dB"}),{compatible:true,corrected:43,margin:null});
  assert.deepEqual(calculateCorrectedValue({measured:40,measuredUnit:"dBµV",correction:3,correctionUnit:"dB"}),{compatible:true,corrected:43,margin:null});
  assert.ok(getCalibrationUnitRule("dBμV/m","dB"));
  assert.deepEqual(calculateCorrectedValue({measured:40,measuredUnit:"V",correction:3,correctionUnit:"dB"}),{compatible:false,corrected:null,margin:null});
  assert.equal(calculateCorrectedValue({measured:40,measuredUnit:"dB",correction:3,correctionUnit:"dB",limit:50}).margin,7);
});
test("список журнала формируется из единого каталога, включая пользовательские испытания",()=>{
  const catalog=buildTestCatalog([{id:"p15",short:"п.15",name:"Магнитное воздействие"}],[{id:"u1",short:"U-1",name:"Пользовательское"}],{});
  assert.deepEqual(buildJournalTestOptions(catalog).map(x=>x.displayValue),["п.15 — Магнитное воздействие","U-1 — Пользовательское"]);
});
test("старый testType журнала безопасно мигрирует, а выбор сохраняет snapshot",()=>{
  const catalog=[{id:"p15",short:"п.15",name:"Магнитное воздействие"}];
  const legacy=migrateJournalEntry({id:1,testType:"PFMF"},catalog); assert.equal(legacy.testName,"Магнитное поле промышленной частоты");
  const saved=snapshotJournalSelection({id:2},buildJournalTestOptions(catalog)[0]);
  assert.deepEqual([saved.testId,saved.section,saved.testName,saved.displayValue],["p15","п.15","Магнитное воздействие","п.15 — Магнитное воздействие"]);
});
test("NSIS создаёт стабильные desktop и Start Menu shortcuts",()=>{
  const config=JSON.parse(readFileSync(new URL("../package.json",import.meta.url),"utf8")).build.nsis;
  assert.equal(config.createDesktopShortcut,"always"); assert.equal(config.createStartMenuShortcut,true); assert.equal(config.shortcutName,"EMC Toolkit");
});

const cases = [
  ["voltage",0.01,94,100,48], ["current",0.15,73,30,40],
  ["field1",10,34,18000,20*Math.log10(18000)-6],
  ["field2",0.01,30-15.65*Math.log10(.01),18000,20*Math.log10(18000)-16],
];
for (const [id,start,startValue,end,endValue] of cases) test(`${id}: начало, конец и вне общего диапазона`,()=>{const c=EMC_LIMITS[id];close(evaluateLimit(c,start),startValue);close(evaluateLimit(c,end),endValue);assert.equal(evaluateLimit(c,start*(1-1e-8)),null);assert.equal(evaluateLimit(c,end*(1+1e-8)),null);});

test("границы всех piecewise-сегментов принадлежат следующему диапазону",()=>{
  assert.equal(evaluateLimit(EMC_LIMITS.voltage,2),48);
  assert.equal(evaluateLimit(EMC_LIMITS.current,2),40);
  assert.equal(evaluateLimit(EMC_LIMITS.field1,100),20*Math.log10(100)-6);
  assert.equal(evaluateLimit(EMC_LIMITS.field2,2),24);
  assert.equal(evaluateLimit(EMC_LIMITS.field2,100),20*Math.log10(100)-16);
});
