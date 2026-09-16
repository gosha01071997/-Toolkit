export const P215_MIN_FREQUENCY_MHZ = 100;
export const P215_MAX_FREQUENCY_MHZ = 6000;

const SLOPE = 15.965;
const INTERCEPTS = Object.freeze({ B: 32.682, L: 12.682 });

export function calculateP215RadiatedLimit(frequencyMHz, category) {
  const frequency = typeof frequencyMHz === "number" ? frequencyMHz : Number(frequencyMHz);
  const normalizedCategory = String(category || "").toUpperCase();
  const inRange = Number.isFinite(frequency)
    && frequency >= P215_MIN_FREQUENCY_MHZ
    && frequency <= P215_MAX_FREQUENCY_MHZ
    && Object.hasOwn(INTERCEPTS, normalizedCategory);

  return {
    frequencyMHz: frequency,
    category: normalizedCategory,
    limitDbUvM: inRange ? SLOPE * Math.log10(frequency) + INTERCEPTS[normalizedCategory] : null,
    inRange,
  };
}

export function generateP215RadiatedLimitTable({ category, startMHz, endMHz, stepMHz }) {
  const start = Number(startMHz);
  const end = Number(endMHz);
  const step = Number(stepMHz);
  if (![start, end, step].every(Number.isFinite) || step <= 0 || start > end) return [];

  const count = Math.floor((end - start) / step + 1e-10);
  const frequencies = Array.from({ length: count + 1 }, (_, index) => start + index * step);
  if (frequencies.at(-1) < end - 1e-9) frequencies.push(end);
  return frequencies.map(frequency => calculateP215RadiatedLimit(frequency, category));
}
