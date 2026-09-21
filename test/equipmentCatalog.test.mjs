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
  assert.deepEqual(visibleSpecifications(akip), [["Диапазон частот", "9 кГц–3,2 ГГц"], ["Выходной уровень", "−110…+13 дБм"], ["Импеданс", "50 Ом"]]);
});

test("catalog data and details are synchronous local records", () => {
  assert.ok(Array.isArray(EQUIPMENT_CATALOG));
  assert.equal(akip.subtype, "ВЧ-генератор сигналов");
  assert.equal(akip.frequencyRange.maxHz, 3_200_000_000);
  assert.ok(akip.applications.length > 0);
  assert.ok(akip.sources.length > 0);
  assert.equal(EQUIPMENT_CATALOG.some(item => item.then || item.fetch), false);
});

const normalizeIdentity = value => String(value).toLocaleLowerCase("en").replace(/[^\p{L}\p{N}]/gu, "");

test("production catalog is broad, unique and uses known equipment types", async () => {
  const { EQUIPMENT_TYPE_IDS } = await import("../src/data/equipmentCatalog.mjs");
  assert.ok(EQUIPMENT_CATALOG.length >= 70, `expected at least 70 curated records, received ${EQUIPMENT_CATALOG.length}`);
  const identities = EQUIPMENT_CATALOG.map(item => `${normalizeIdentity(item.manufacturer)}:${normalizeIdentity(item.model)}`);
  assert.equal(new Set(identities).size, identities.length, "manufacturer + model must be unique after normalization");
  assert.ok(EQUIPMENT_CATALOG.every(item => EQUIPMENT_TYPE_IDS.has(item.equipmentType)));
});

test("normalized frequency ranges and provenance are structurally valid", () => {
  const sourceTypes = new Set(["official_product_page", "official_datasheet", "official_manual", "official_archive"]);
  for (const item of EQUIPMENT_CATALOG) {
    if (item.frequencyRange) {
      assert.equal(Number.isFinite(item.frequencyRange.minHz), true, `${item.id}: minHz`);
      assert.equal(Number.isFinite(item.frequencyRange.maxHz), true, `${item.id}: maxHz`);
      assert.ok(item.frequencyRange.minHz >= 0 && item.frequencyRange.minHz <= item.frequencyRange.maxHz, `${item.id}: frequency range`);
    }
    assert.ok(["current", "discontinued", "legacy"].includes(item.lifecycleStatus), `${item.id}: lifecycle`);
    assert.ok(["verified_official", "partially_verified"].includes(item.verificationStatus), `${item.id}: verification`);
    assert.ok(item.sources.length > 0, `${item.id}: verified records need provenance`);
    for (const source of item.sources) {
      assert.equal(source.manufacturer, item.manufacturer, `${item.id}: source manufacturer`);
      assert.equal(source.model, item.model, `${item.id}: source model`);
      assert.ok(source.title && /^https:\/\//.test(source.url) && sourceTypes.has(source.type));
      assert.match(source.dateChecked, /^\d{4}-\d{2}-\d{2}$/);
    }
  }
});

test("compatible accessories resolve to catalog IDs", () => {
  const ids = new Set(EQUIPMENT_CATALOG.map(item => item.id));
  for (const item of EQUIPMENT_CATALOG) for (const accessory of item.compatibleAccessories) assert.ok(ids.has(accessory), `${item.id} -> ${accessory}`);
});

test("RU/EN aliases and indexed search remain useful at catalog scale", () => {
  assert.ok(searchCatalog(EQUIPMENT_CATALOG, "измерительный приёмник").some(item => item.id === "rs-esw"));
  assert.ok(searchCatalog(EQUIPMENT_CATALOG, "receiver").some(item => item.id === "rs-esw"));
  assert.ok(searchCatalog(EQUIPMENT_CATALOG, "источник питания").some(item => item.equipmentType === "dc_power_supply"));
  for (let i = 0; i < 100; i += 1) searchCatalog(EQUIPMENT_CATALOG, "probe");
});

test("catalog runtime stays offline and records contain no executable loaders", () => {
  for (const item of EQUIPMENT_CATALOG) {
    assert.equal(typeof item.fetch, "undefined");
    assert.equal(typeof item.then, "undefined");
    assert.equal(typeof item.load, "undefined");
  }
});

test("second-pass catalog covers equipment used by Russian/CIS EMC laboratories", () => {
  const ids = new Set(EQUIPMENT_CATALOG.map(item => item.id));
  for (const id of ["gcmo-ra-00140", "gcmo-tem-1218-500", "skard-p6-522m", "skard-p6-223n", "lumiloop-lsprobe-1-2", "lumiloop-lsprobe-2-0", "lumiloop-ci-250-plus"]) {
    assert.ok(ids.has(id), `missing ${id}`);
  }
  assert.ok(EQUIPMENT_CATALOG.filter(item => item.manufacturer === "АКИП" && item.equipmentType === "signal_generator").length >= 10);
  assert.ok(EQUIPMENT_CATALOG.some(item => item.equipmentType === "tem_cell"));
  assert.ok(EQUIPMENT_CATALOG.some(item => item.equipmentType === "magnetic_field_generator"));
});
