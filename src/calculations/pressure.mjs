export const MMHG_TO_PA = 133.322387415;

export function convertPressure(value, direction = "mmHgToPa") {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) throw new TypeError("Pressure must be a finite number");
  return direction === "paToMmHg" ? numeric / MMHG_TO_PA : numeric * MMHG_TO_PA;
}

export function formatEngineeringPressure(value) {
  if (!Number.isFinite(value)) return "—";
  if (value === 0) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= 1e9 || magnitude < 1e-6) return value.toExponential(9).replace(/\.?0+e/, "e");
  return Number(value.toPrecision(12)).toString();
}
