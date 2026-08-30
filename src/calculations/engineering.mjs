export const SPEED_OF_LIGHT = 3e8;
export const frequencyToHz = (value, unit = "Hz") => value * ({ Hz: 1, kHz: 1e3, MHz: 1e6, GHz: 1e9 }[unit] ?? NaN);

const positive = (value, name) => {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} должно быть положительным числом.`);
  return value;
};

export const chamberModesRectangular = (a, b, d, frequencyHz) =>
  (8 * Math.PI / 3) * positive(a, "a") * positive(b, "b") * positive(d, "d") * positive(frequencyHz, "Частота") ** 3 / SPEED_OF_LIGHT ** 3;

export const chamberModesEquivalent = (volume, frequencyHz) =>
  (8 * Math.PI / 3) * positive(volume, "Vэкв") * positive(frequencyHz, "Частота") ** 3 / SPEED_OF_LIGHT ** 3;

export const chamberBeatFrequencyMHz = (a, b) =>
  150 * Math.sqrt((1 / positive(a, "a")) ** 2 + (1 / positive(b, "b")) ** 2);

export const chamberKPower = ({ frequencyHz, wavelength, receivedMax, incident }) => {
  const lambda = wavelength == null ? SPEED_OF_LIGHT / positive(frequencyHz, "Частота") : positive(wavelength, "λ");
  if (!Number.isFinite(receivedMax) || receivedMax < 0) throw new RangeError("Pприём max не может быть отрицательной.");
  positive(incident, "Pпад");
  return { wavelength: lambda, k: (8 * Math.PI / lambda) * Math.sqrt(5 * (receivedMax / incident)) };
};

export const chamberKField = (ex, ey, ez, incident) => {
  [ex, ey, ez].forEach((v) => { if (!Number.isFinite(v)) throw new RangeError("Составляющие поля должны быть числами."); });
  positive(incident, "Pпад");
  const rmsComponent = Math.sqrt((ex ** 2 + ey ** 2 + ez ** 2) / 3);
  return { rmsComponent, k: Math.sqrt(((ex ** 2 + ey ** 2 + ez ** 2) / 3) / incident) };
};

export const antennaPositionStep = (distance, positions) => positive(distance, "A") / positive(positions, "N");

export const antennaFactorReceive = ({ frequencyHz, u1, u2, distance, unit = "linear" }) => {
  positive(frequencyHz, "Частота"); positive(distance, "r");
  const wavelength = SPEED_OF_LIGHT / frequencyHz;
  let deltaU; let k1;
  if (unit === "linear") {
    positive(u1, "U1"); positive(u2, "U2");
    deltaU = u1 - u2; k1 = u1 / u2;
  } else {
    if (!Number.isFinite(u1) || !Number.isFinite(u2)) throw new RangeError("U1 и U2 должны быть числами.");
    deltaU = u1 - u2;
    k1 = 10 ** (deltaU / 20);
  }
  const gain = 4 * Math.PI * distance ** 2 / (k1 * wavelength ** 2);
  const af = 20 * Math.log10(9.76 / (wavelength * Math.sqrt(gain)));
  return { deltaU, k1, wavelength, gain, af };
};

export const antennaFactorTransmit = ({ af, distance, frequencyHz, wavelength }) => {
  if (!Number.isFinite(af)) throw new RangeError("AF должен быть числом.");
  positive(distance, "r");
  const lambda = wavelength == null ? SPEED_OF_LIGHT / positive(frequencyHz, "Частота") : positive(wavelength, "λ");
  return 20 * Math.log10(distance) - af - 32.0 - 20 * Math.log10(lambda);
};

export const shieldingEffectiveness = (withoutEnclosure, withEnclosure) => {
  if (![withoutEnclosure, withEnclosure].every(Number.isFinite)) throw new RangeError("Уровни должны быть числами.");
  return withoutEnclosure - withEnclosure;
};

export const fieldFromMeasuredVoltage = (measuredDbUv, antennaFactorDbPerM) => {
  if (![measuredDbUv, antennaFactorDbPerM].every(Number.isFinite)) throw new RangeError("Уровни должны быть числами.");
  return measuredDbUv + antennaFactorDbPerM;
};
