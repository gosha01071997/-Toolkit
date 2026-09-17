export const P215_MIN_FREQUENCY_MHZ = 100;
export const P215_MAX_FREQUENCY_MHZ = 6000;

const SLOPE = 15.965;
const INTERCEPTS = Object.freeze({ B: 32.682, L: 12.682 });

const BASE_CURVE = Object.freeze({ type: "log10", slope: SLOPE, intercept: 12.682 });
const H_VERIFIED_POINTS = Object.freeze([
  [108, 25], [152, 27.5], [320, 37.7], [340, 38.1], [960, 45.3],
  [1215, 47], [1525, 48.5], [1680, 49.2], [5020, 56.8], [5100, 56.9],
].map(([frequencyMHz, limitDbUvM]) => Object.freeze({ frequencyMHz, limitDbUvM })));
const PQ_VERIFIED_BREAKPOINTS_MHZ = Object.freeze([
  108, 152, 320, 340, 960, 1164, 1215, 1525, 1559, 1610, 1680, 5020, 5100,
]);
const PQ_UNMAPPED_VERIFIED_LEVELS_DB_UV_M = Object.freeze([
  25, 27.5, 37.7, 38.1, 38, 38.5, 40, 40.2, 44.6, 45.3, 47, 48.5, 48.65, 48.7, 49.17, 56.8, 56.9, 73,
]);

export const P215_CATEGORY_LIMITS = Object.freeze({
  B: Object.freeze({ baseCurve: Object.freeze({ type: "log10", slope: SLOPE, intercept: INTERCEPTS.B }), piecewiseSegments: Object.freeze([]), calculationAvailable: true }),
  L: Object.freeze({ baseCurve: BASE_CURVE, piecewiseSegments: Object.freeze([]), calculationAvailable: true }),
  M: Object.freeze({ baseCurve: BASE_CURVE, piecewiseSegments: Object.freeze([]), calculationAvailable: false }),
  H: Object.freeze({ baseCurve: BASE_CURVE, piecewiseSegments: Object.freeze([]), verifiedPoints: H_VERIFIED_POINTS, calculationAvailable: false }),
  P: Object.freeze({ baseCurve: BASE_CURVE, piecewiseSegments: Object.freeze([]), verifiedBreakpointsMHz: PQ_VERIFIED_BREAKPOINTS_MHZ, unmappedVerifiedLevelsDbUvM: PQ_UNMAPPED_VERIFIED_LEVELS_DB_UV_M, calculationAvailable: false }),
  Q: Object.freeze({ baseCurve: BASE_CURVE, piecewiseSegments: Object.freeze([]), verifiedBreakpointsMHz: PQ_VERIFIED_BREAKPOINTS_MHZ, unmappedVerifiedLevelsDbUvM: PQ_UNMAPPED_VERIFIED_LEVELS_DB_UV_M, calculationAvailable: false }),
});

export function calculateP215RadiatedLimit(frequencyMHz, category) {
  const frequency = typeof frequencyMHz === "number" ? frequencyMHz : Number(frequencyMHz);
  const normalizedCategory = String(category || "").toUpperCase();
  const categoryLimit = P215_CATEGORY_LIMITS[normalizedCategory];
  const inRange = Number.isFinite(frequency)
    && frequency >= P215_MIN_FREQUENCY_MHZ
    && frequency <= P215_MAX_FREQUENCY_MHZ
    && Boolean(categoryLimit);
  const calculationAvailable = Boolean(categoryLimit?.calculationAvailable);

  return {
    frequencyMHz: frequency,
    category: normalizedCategory,
    limitDbUvM: inRange && calculationAvailable
      ? SLOPE * Math.log10(frequency) + INTERCEPTS[normalizedCategory]
      : null,
    inRange,
    calculationAvailable,
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
