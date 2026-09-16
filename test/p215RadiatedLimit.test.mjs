import test from "node:test";
import assert from "node:assert/strict";
import { calculateP215RadiatedLimit, generateP215RadiatedLimitTable } from "../src/calculations/p215RadiatedLimit.mjs";

const expected = {
  L: [[200,49.4179438808],[300,52.2292408316],[400,54.2238877616],[1000,60.577],[6000,73.0001847124]],
  B: [[200,69.4179438808],[300,72.2292408316],[400,74.2238877616],[1000,80.577],[6000,93.0001847124]],
};

for (const [category, points] of Object.entries(expected)) {
  for (const [frequency, limit] of points) test(`п.21.5: ${category} / ${frequency} MHz`, () => {
    const result = calculateP215RadiatedLimit(frequency, category);
    assert.equal(result.inRange, true);
    assert.ok(Math.abs(result.limitDbUvM - limit) < 5e-11, `${result.limitDbUvM} != ${limit}`);
  });
}

test("п.21.5: границы 100 MHz рассчитываются формулой без подмены", () => {
  assert.equal(calculateP215RadiatedLimit(100, "L").limitDbUvM, 44.612);
  assert.equal(calculateP215RadiatedLimit(100, "B").limitDbUvM, 64.612);
});

test("п.21.5: значения вне диапазона и неизвестная категория не рассчитываются", () => {
  for (const [frequency, category] of [[99.999,"L"],[6000.001,"B"],[NaN,"L"],[200,"X"]]) {
    assert.deepEqual(calculateP215RadiatedLimit(frequency, category).inRange, false);
    assert.equal(calculateP215RadiatedLimit(frequency, category).limitDbUvM, null);
  }
});

test("п.21.5: таблица из 701 точки сохраняет полную точность общей функции", () => {
  const rows = generateP215RadiatedLimitTable({ category: "L", startMHz: 100, endMHz: 800, stepMHz: 1 });
  assert.equal(rows.length, 701);
  assert.deepEqual(rows[100], calculateP215RadiatedLimit(200, "L"));
});

test("п.21.5: некорректный диапазон таблицы безопасно отклоняется", () => {
  assert.deepEqual(generateP215RadiatedLimitTable({ category: "B", startMHz: 300, endMHz: 100, stepMHz: 1 }), []);
  assert.deepEqual(generateP215RadiatedLimitTable({ category: "B", startMHz: 100, endMHz: 300, stepMHz: 0 }), []);
});
