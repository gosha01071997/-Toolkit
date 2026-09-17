import test from "node:test";
import assert from "node:assert/strict";
import { calculateP215RadiatedLimit, generateP215RadiatedLimitTable, P215_CATEGORY_LIMITS } from "../src/calculations/p215RadiatedLimit.mjs";

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

test("п.21.5: M/H/P/Q описаны piecewise-архитектурой, но не рассчитываются до подтверждения сегментов", () => {
  for (const category of ["M", "H", "P", "Q"]) {
    const definition = P215_CATEGORY_LIMITS[category];
    assert.deepEqual(definition.baseCurve, { type: "log10", slope: 15.965, intercept: 12.682 });
    assert.deepEqual(definition.piecewiseSegments, []);
    assert.equal(definition.calculationAvailable, false);
    assert.deepEqual(calculateP215RadiatedLimit(200, category), {
      frequencyMHz: 200, category, limitDbUvM: null, inRange: true, calculationAvailable: false,
    });
  }
});

test("п.21.5: H хранит только однозначно подтверждённые контрольные точки", () => {
  assert.deepEqual(P215_CATEGORY_LIMITS.H.verifiedPoints, [
    { frequencyMHz: 108, limitDbUvM: 25 }, { frequencyMHz: 152, limitDbUvM: 27.5 },
    { frequencyMHz: 320, limitDbUvM: 37.7 }, { frequencyMHz: 340, limitDbUvM: 38.1 },
    { frequencyMHz: 960, limitDbUvM: 45.3 }, { frequencyMHz: 1215, limitDbUvM: 47 },
    { frequencyMHz: 1525, limitDbUvM: 48.5 }, { frequencyMHz: 1680, limitDbUvM: 49.2 },
    { frequencyMHz: 5020, limitDbUvM: 56.8 }, { frequencyMHz: 5100, limitDbUvM: 56.9 },
  ]);
});

test("п.21.5: уровни P/Q хранятся отдельно и не сопоставляются частотам", () => {
  for (const category of ["P", "Q"]) {
    assert.deepEqual(P215_CATEGORY_LIMITS[category].verifiedBreakpointsMHz, [108, 152, 320, 340, 960, 1164, 1215, 1525, 1559, 1610, 1680, 5020, 5100]);
    assert.deepEqual(P215_CATEGORY_LIMITS[category].unmappedVerifiedLevelsDbUvM, [25, 27.5, 37.7, 38.1, 38, 38.5, 40, 40.2, 44.6, 45.3, 47, 48.5, 48.65, 48.7, 49.17, 56.8, 56.9, 73]);
  }
});
