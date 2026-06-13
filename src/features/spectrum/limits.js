/**
 * EMC Pro — анализатор спектра: лимит-линии и парсер CSV.
 *
 * Лимит-линия задаётся опорными точками [частота_Гц, уровень_dBмкВ(/м)];
 * между точками — линейная интерполяция по log10(f), как принято в нормах ЭМС.
 *
 * ВНИМАНИЕ: значения ниже — типовые уровни для демонстрации механики
 * (по мотивам общеизвестных норм CISPR). Перед боевым применением внесите
 * сюда точные значения из ваших рабочих стандартов (ГОСТ РВ 20.57.306,
 * ГОСТ Р 51317.x и т.д.) — структура данных к этому готова.
 */

export const LIMIT_LINES = [
  {
    id: 'ce_qp_demo',
    name: 'Кондуктивные помехи, QP (демо)',
    unit: 'дБмкВ',
    domain: 'conducted',
    fMin: 150e3,
    fMax: 30e6,
    points: [
      [150e3, 66], [500e3, 56],   // линейный спад по log(f)
      [500e3, 56], [5e6, 56],
      [5e6, 60], [30e6, 60],
    ],
  },
  {
    id: 're_3m_demo',
    name: 'Излучаемые помехи, 3 м (демо)',
    unit: 'дБмкВ/м',
    domain: 'radiated',
    fMin: 30e6,
    fMax: 1e9,
    points: [
      [30e6, 40], [230e6, 40],
      [230e6, 47], [1e9, 47],
    ],
  },
  {
    id: 'custom',
    name: 'Пользовательская линия…',
    unit: 'дБ',
    domain: 'any',
    fMin: 0,
    fMax: Infinity,
    points: [],
  },
];

/** Уровень лимит-линии на частоте f (Гц), линейная интерполяция по log10(f). */
export function limitAt(line, f) {
  const pts = line.points;
  if (!pts.length) return null;
  if (f < line.fMin || f > line.fMax) return null;
  if (f <= pts[0][0]) return pts[0][1];
  if (f >= pts[pts.length - 1][0]) return pts[pts.length - 1][1];
  for (let i = 0; i < pts.length - 1; i++) {
    const [f1, v1] = pts[i];
    const [f2, v2] = pts[i + 1];
    if (f >= f1 && f <= f2) {
      if (f1 === f2) return Math.max(v1, v2); // вертикальная ступень
      const t = (Math.log10(f) - Math.log10(f1)) / (Math.log10(f2) - Math.log10(f1));
      return v1 + t * (v2 - v1);
    }
  }
  return null;
}

/**
 * Вердикт по трассе: PASS/FAIL, список превышений, худшая точка, минимальный запас.
 * points: [[fГц, дБ], ...]
 */
export function evaluate(points, line, marginWarnDb = 6) {
  const violations = [];
  let worst = null;       // точка с минимальным запасом
  let minMargin = Infinity;
  let evaluated = 0;

  for (const [f, v] of points) {
    const lim = limitAt(line, f);
    if (lim == null) continue;
    evaluated++;
    const margin = lim - v;             // >0 — запас, <0 — превышение
    if (margin < minMargin) {
      minMargin = margin;
      worst = { f, value: v, limit: lim, margin };
    }
    if (margin < 0) violations.push({ f, value: v, limit: lim, excess: -margin });
  }

  const verdict = evaluated === 0 ? 'N/A' : violations.length ? 'FAIL' : 'PASS';
  const warn = verdict === 'PASS' && minMargin < marginWarnDb;
  return { verdict, warn, violations, worst, minMargin, evaluated };
}

// ─── Парсер CSV ─────────────────────────────────────────────────────────────
/**
 * Понимает типовые выгрузки спектроанализаторов (Rohde & Schwarz, Keysight,
 * Rigol, общий CSV): разделители ; , или таб; десятичная запятая; строки
 * заголовков/метаданных пропускаются. Частота автоопределяется: Гц/кГц/МГц.
 *
 * Возвращает { points:[[fГц,дБ],...], skipped, freqUnitGuess }.
 */
export function parseSpectrumCsv(text) {
  const lines = text.split(/\r?\n/);
  const raw = [];
  let skipped = 0;

  for (const line of lines) {
    const s = line.trim();
    if (!s) continue;
    // разделитель: ; приоритетнее (в нём запятая — десятичная)
    let parts;
    if (s.includes(';')) parts = s.split(';');
    else if (s.includes('\t')) parts = s.split('\t');
    else parts = s.split(',');

    if (parts.length < 2) { skipped++; continue; }

    const num = (t) => {
      const cleaned = t.trim().replace(/\s/g, '').replace(',', '.');
      const v = parseFloat(cleaned);
      return Number.isFinite(v) ? v : null;
    };

    const f = num(parts[0]);
    const v = num(parts[1]);
    if (f == null || v == null) { skipped++; continue; } // заголовок или метаданные
    raw.push([f, v]);
  }

  if (!raw.length) return { points: [], skipped, freqUnitGuess: null };

  // Автоопределение единицы частоты по максимуму
  const fMax = Math.max(...raw.map(p => p[0]));
  let mult = 1, freqUnitGuess = 'Гц';
  if (fMax < 2e3) { mult = 1e6; freqUnitGuess = 'МГц'; }       // 30..1000 → МГц
  else if (fMax < 2e6) { mult = 1e3; freqUnitGuess = 'кГц'; }  // 150..30000 → кГц
  // иначе уже в Гц

  const points = raw
    .map(([f, v]) => [f * mult, v])
    .sort((a, b) => a[0] - b[0]);

  return { points, skipped, freqUnitGuess };
}

/** Формат частоты для подписи: 142.3 МГц / 450 кГц */
export function fmtFreq(f) {
  if (f >= 1e9) return (f / 1e9).toFixed(f % 1e9 ? 3 : 0) + ' ГГц';
  if (f >= 1e6) return (f / 1e6).toFixed(f % 1e6 ? 2 : 0) + ' МГц';
  if (f >= 1e3) return (f / 1e3).toFixed(f % 1e3 ? 1 : 0) + ' кГц';
  return f.toFixed(0) + ' Гц';
}
