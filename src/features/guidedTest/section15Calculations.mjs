import { normalizeNumber } from "./engine.mjs";

export const SECTION_15_LIMITS = Object.freeze({ hMin: 12.96, hMax: 15.84, temperature: [15, 35], humidity: [0, 85], pressure: [84, 107] });

export function calculateControlDeflection(value) {
  const h = normalizeNumber(value);
  if (!Number.isFinite(h) || h <= 0) throw new RangeError("H должно быть конечным числом больше 0");
  return h >= SECTION_15_LIMITS.hMin && h <= SECTION_15_LIMITS.hMax ? 1 : 14.4 / h;
}

export function classifyMagneticEffect(distance, reachesControlDeflection = true) {
  if (!reachesControlDeflection) return "Y";
  const d = normalizeNumber(distance);
  if (!Number.isFinite(d) || d < 0) throw new RangeError("D должно быть конечным неотрицательным числом");
  if (d === 0) return "Y";
  if (d <= .3) return "Z";
  if (d <= 1) return "A";
  if (d <= 3) return "B";
  return "C";
}

export function checkFieldUniformity(value) {
  const change = normalizeNumber(value);
  if (!Number.isFinite(change)) return { ok: false, invalid: true };
  return { ok: Math.abs(change) <= .5, invalid: false };
}

export function checkLaboratoryConditions(values) {
  const checks = {
    temperature: inRange(values.temperature, ...SECTION_15_LIMITS.temperature),
    humidity: inRange(values.humidity, ...SECTION_15_LIMITS.humidity),
    pressure: inRange(values.pressure, ...SECTION_15_LIMITS.pressure),
  };
  return { checks, ok: Object.values(checks).every(Boolean) };
}
const inRange = (value, min, max) => { const number = normalizeNumber(value); return Number.isFinite(number) && number >= min && number <= max; };
