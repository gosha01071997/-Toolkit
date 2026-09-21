import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { SECTION_16_PROFILE } from "../src/features/guidedTest/section16/profiles.mjs";
import { SECTION_16_PROCEDURES } from "../src/features/guidedTest/section16/procedures.mjs";
import { applicableSection16Procedures } from "../src/features/guidedTest/section16/applicability.mjs";
import { AUTOMATION_SYSTEMS, automationSystemById, executionPlan, verifiedForProcedure } from "../src/features/guidedTest/section16/executionAdapters.mjs";
import { createSection16Result, SECTION_16_SCENARIO_ID } from "../src/features/guidedTest/section16/state.mjs";
import { loadProgress, saveProgress } from "../src/features/guidedTest/persistence.mjs";

const memoryStorage = () => { const values = new Map(); return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) }; };

test("applicability строится из конфигурации и скрывает неприменимые процедуры", () => {
  assert.deepEqual(applicableSection16Procedures({}, SECTION_16_PROFILE), []);
  const dc = applicableSection16Procedures({ powerType: "DC" }, SECTION_16_PROFILE).map(item => item.id);
  const ac = applicableSection16Procedures({ powerType: "AC" }, SECTION_16_PROFILE).map(item => item.id);
  assert.ok(dc.includes("ripple")); assert.ok(!ac.includes("ripple")); assert.ok(ac.includes("steadyVoltage"));
});

test("manual и automated используют одну нормативную процедуру", () => {
  const procedure = SECTION_16_PROCEDURES.steadyVoltage;
  const manual = executionPlan(procedure, "manual"); const automated = executionPlan(procedure, "automated", AUTOMATION_SYSTEMS[0]);
  assert.equal(manual.procedureId, procedure.id); assert.equal(automated.procedureId, procedure.id);
  assert.deepEqual(manual.parameters, automated.parameters);
});

test("настройки ПО отделены от нормативного профиля, универсального 27 В нет", async () => {
  assert.equal("automationSystems" in SECTION_16_PROFILE, false);
  assert.ok(Object.values(SECTION_16_PROFILE.parameters).every(value => value === null));
  const profileSource = await readFile(new URL("../src/features/guidedTest/section16/profiles.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(profileSource, /\b27\s*В?\b/);
});

test("неизвестной системе не назначаются выдуманные capabilities", () => {
  assert.equal(automationSystemById("unknown"), null);
  assert.equal(verifiedForProcedure({ id: "unknown", supportedProcedureTypes: [], verifiedCapabilities: [], source: null }, SECTION_16_PROCEDURES.ripple), false);
});

test("Другое ПО и Собственный стенд доступны без ложной совместимости", () => {
  assert.deepEqual(AUTOMATION_SYSTEMS.map(item => item.id), ["other", "own-stand"]);
  for (const system of AUTOMATION_SYSTEMS) { assert.deepEqual(system.verifiedCapabilities, []); assert.equal(verifiedForProcedure(system, SECTION_16_PROCEDURES.steadyVoltage), false); }
});

test("структурированное состояние Section 16 сохраняется и формирует память лаборатории", () => {
  const storage = memoryStorage(); const progress = { currentStage: 4, inputs: { eutName: "Блок" }, configuration: { powerType: "DC", nominalVoltage: "24" }, executionMode: "manual", equipment: { powerSource: "e1" }, procedureResults: { steadyVoltage: "Без замечаний" } };
  saveProgress(storage, SECTION_16_SCENARIO_ID, progress);
  assert.deepEqual(loadProgress(storage, SECTION_16_SCENARIO_ID).configuration, progress.configuration);
  const procedures = applicableSection16Procedures(progress.configuration, SECTION_16_PROFILE);
  const result = createSection16Result(progress, SECTION_16_PROFILE, procedures);
  assert.equal(result.normativeProfile, SECTION_16_PROFILE.id); assert.equal(result.product.name, "Блок"); assert.deepEqual(result.equipmentInstances, ["e1"]);
});
