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
const H_PIECEWISE_SEGMENTS = Object.freeze([
  [108, 25, 152, 27.5],
  [320, 37.7, 340, 38.1],
  [960, 45.3, 1215, 47],
  [1525, 48.5, 1680, 49.2],
  [5020, 56.8, 5100, 56.9],
].map(([startMHz, startLimitDbUvM, endMHz, endLimitDbUvM]) => Object.freeze({
  // Figure 21-9 uses a logarithmic frequency axis. A visually straight segment
  // between its verified endpoints is therefore linear in log10(frequency).
  // This reproduces the plotted geometry; it is not a claim that the text of
  // DO-160G independently prescribes a general interpolation method.
  type: "log10-linear", startMHz, startLimitDbUvM, endMHz, endLimitDbUvM,
})));

export const P215_CATEGORY_LIMITS = Object.freeze({
  B: Object.freeze({ baseCurve: Object.freeze({ type: "log10", slope: SLOPE, intercept: INTERCEPTS.B }), piecewiseSegments: Object.freeze([]), calculationAvailable: true }),
  L: Object.freeze({ baseCurve: BASE_CURVE, piecewiseSegments: Object.freeze([]), calculationAvailable: true }),
  M: Object.freeze({ baseCurve: BASE_CURVE, piecewiseSegments: Object.freeze([]), calculationAvailable: false }),
  H: Object.freeze({ baseCurve: BASE_CURVE, piecewiseSegments: H_PIECEWISE_SEGMENTS, verifiedPoints: H_VERIFIED_POINTS, calculationAvailable: true }),
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
  const segment = categoryLimit?.piecewiseSegments.find(({ startMHz, endMHz }) => frequency >= startMHz && frequency <= endMHz);
  let limitDbUvM = null;
  if (inRange && calculationAvailable) {
    if (segment) {
      const position = Math.log10(frequency / segment.startMHz) / Math.log10(segment.endMHz / segment.startMHz);
      limitDbUvM = segment.startLimitDbUvM
        + position * (segment.endLimitDbUvM - segment.startLimitDbUvM);
    } else {
      limitDbUvM = normalizedCategory === "H"
        ? categoryLimit.baseCurve.slope * Math.log10(frequency) + categoryLimit.baseCurve.intercept
        : SLOPE * Math.log10(frequency) + INTERCEPTS[normalizedCategory];
    }
  }

  return {
    frequencyMHz: frequency,
    category: normalizedCategory,
    limitDbUvM,
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

export function generateP215RadiatedLimitChartPoints(category, sampleCount = 181) {
  const normalizedCategory = String(category || "").toUpperCase();
  const categoryLimit = P215_CATEGORY_LIMITS[normalizedCategory];
  if (!categoryLimit?.calculationAvailable || !Number.isInteger(sampleCount) || sampleCount < 2) return [];

  const points = Array.from({ length: sampleCount }, (_, index) => {
    const frequency = P215_MIN_FREQUENCY_MHZ
      * (P215_MAX_FREQUENCY_MHZ / P215_MIN_FREQUENCY_MHZ) ** (index / (sampleCount - 1));
    return { ...calculateP215RadiatedLimit(frequency, normalizedCategory), order: 0 };
  });

  for (const segment of categoryLimit.piecewiseSegments) {
    const start = calculateP215RadiatedLimit(segment.startMHz, normalizedCategory);
    const end = calculateP215RadiatedLimit(segment.endMHz, normalizedCategory);
    const baseAtStart = categoryLimit.baseCurve.slope * Math.log10(segment.startMHz) + categoryLimit.baseCurve.intercept;
    const baseAtEnd = categoryLimit.baseCurve.slope * Math.log10(segment.endMHz) + categoryLimit.baseCurve.intercept;
    points.push(
      { ...start, limitDbUvM: baseAtStart, order: -1 },
      { ...start, order: 0 },
      { ...end, order: 0 },
      { ...end, limitDbUvM: baseAtEnd, order: 1 },
    );
  }

  return points
    .sort((left, right) => left.frequencyMHz - right.frequencyMHz || left.order - right.order)
    .map(({ order, ...point }) => point);
}
