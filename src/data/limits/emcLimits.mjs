const segment = (minMHz, maxMHz, formula, expression) => ({ minMHz, maxMHz, formula, expression });
export const EMC_LIMITS = Object.freeze({
  voltage: { name: "Допустимое напряжение помех", unit: "dBµV", source: "формулы.docx", note: "f в MHz; вне диапазона экстраполяция запрещена.", segments: [segment(0.01, 2, f => 54 - 20 * Math.log10(f), "54 − 20·lg(f)"), segment(2, 100, () => 48, "48")] },
  current: { name: "Допустимый ток помех", unit: "dBµA", source: "формулы.docx", note: "Примечание для оборудования двойного назначения требует привязки к кривой по читаемому оригиналу.", segments: [segment(0.15, 2, f => 73 - 29.33 * Math.log10(f / 0.15), "73 − 29.33·lg(f/0.15)"), segment(2, 30, () => 40, "40")] },
  field1: { name: "Допустимая напряжённость поля — кривая 1", unit: "dBµV/m", source: "формулы.docx", note: "f в MHz.", segments: [segment(10, 100, () => 34, "34"), segment(100, 18000, f => 20 * Math.log10(f) - 6, "20·lg(f) − 6")] },
  field2: { name: "Допустимая напряжённость поля — кривая 2", unit: "dBµV/m", source: "формулы.docx", note: "f в MHz.", segments: [segment(0.01, 2, f => 30 - 15.65 * Math.log10(f), "30 − 15.65·lg(f)"), segment(2, 100, () => 24, "24"), segment(100, 18000, f => 20 * Math.log10(f) - 16, "20·lg(f) − 16")] },
});

export function evaluateLimit(curve, frequencyMHz) {
  if (!Number.isFinite(frequencyMHz) || frequencyMHz <= 0) return null;
  // At shared boundaries the later segment is the authoritative branch.
  const matches = curve.segments.filter(s => frequencyMHz >= s.minMHz && frequencyMHz <= s.maxMHz);
  return matches.length ? matches[matches.length - 1].formula(frequencyMHz) : null;
}

export function sampleLimit(curve, count = 160) {
  const min = Math.min(...curve.segments.map(s => s.minMHz));
  const max = Math.max(...curve.segments.map(s => s.maxMHz));
  return Array.from({ length: count }, (_, i) => {
    const f = min * (max / min) ** (i / (count - 1));
    return [f, evaluateLimit(curve, f)];
  }).filter(([, value]) => value != null);
}
