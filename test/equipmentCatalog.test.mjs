import test from "node:test";
import assert from "node:assert/strict";
import { EQUIPMENT_CATALOG, createLaboratoryEquipment, migrateLaboratoryEquipment, searchCatalog, visibleSpecifications } from "../src/data/equipmentCatalog.mjs";
import { readExistingEquipment } from "../src/features/guidedTest/persistence.mjs";

const akip = EQUIPMENT_CATALOG.find(item => item.id === "akip-3208");
const storage = values => ({ getItem: key => values[key] ?? null, setItem: (key, value) => { values[key] = value; } });

test("catalog search finds manufacturer, model fragment and normalized type", () => {
  assert.equal(searchCatalog(EQUIPMENT_CATALOG, "АКИП")[0].id, "akip-3208");
  assert.equal(searchCatalog(EQUIPMENT_CATALOG, "3208")[0].id, "akip-3208");
  assert.equal(searchCatalog(EQUIPMENT_CATALOG, "current probe")[0].id, "tekbox-tbcp1-250");
  assert.equal(searchCatalog(EQUIPMENT_CATALOG, "токосъёмник")[0].id, "tekbox-tbcp1-250");
});

test("catalog type filter is independent from text", () => {
  assert.ok(searchCatalog(EQUIPMENT_CATALOG, "", "signal_generator").every(item => item.equipmentType === "signal_generator"));
});

test("catalog model creates distinct laboratory instances and retains local fields", () => {
  const first = createLaboratoryEquipment(akip, { serialNumber: "123456", arm: "Станция B", calibrationValidUntil: "2027-05-12" }, 1);
  const second = createLaboratoryEquipment(akip, {}, 2);
  assert.notEqual(first.id, second.id);
  assert.equal(first.catalogModelId, akip.id);
  assert.equal(second.catalogModelId, akip.id);
  assert.equal(first.serialNumber, "123456");
  assert.equal(first.arm, "Станция B");
  assert.equal(first.calibrationValidUntil, "2027-05-12");
  assert.equal("calibrationCharacteristic" in first, false, "a typical curve must never be injected");
});

test("manual and legacy equipment migrate without data loss", () => {
  const legacy = { id: "old", name: "Мой прибор", serialNumber: "S-7", calibrationCharacteristic: { rows: [{ frequency: 1 }] } };
  const migrated = migrateLaboratoryEquipment(legacy);
  assert.equal(migrated.source, "custom");
  assert.equal(migrated.catalogModelId, null);
  assert.deepEqual(migrated.calibrationCharacteristic, legacy.calibrationCharacteristic);
});

test("Guided Test sees a newly saved laboratory instance, not global models", () => {
  const instance = createLaboratoryEquipment(akip, { serialNumber: "GT-1" }, 3);
  const local = storage({ emc_custom_equip_v1: JSON.stringify([instance]) });
  assert.deepEqual(readExistingEquipment(local, []), [instance]);
  assert.equal(readExistingEquipment(storage({}), []).length, 0);
});

test("unknown and null specifications are not rendered", () => {
  assert.deepEqual(visibleSpecifications({ specifications: { known: "1", absent: null, empty: "" } }), [["known", "1"]]);
  assert.deepEqual(visibleSpecifications(akip), []);
});
