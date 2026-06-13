/**
 * EMC Pro — Анализатор спектра.
 *
 * Импорт CSV со спектроанализатора (drag-n-drop или кнопка), наложение
 * лимит-линии, автоматический вердикт PASS/FAIL, таблица превышений,
 * сохранение результата в журнал (через services/storage).
 *
 * Подключение в App.jsx:
 *   import SpectrumAnalyzer from './features/spectrum/SpectrumAnalyzer';
 *   ...
 *   {page === 'spectrum' && <SpectrumAnalyzer />}
 *
 * Зависимостей нет — чистый React + SVG.
 */
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { LIMIT_LINES, limitAt, evaluate, parseSpectrumCsv, fmtFreq } from './limits';
import { store } from '../../services/storage';

// Палитра в стиле приложения, но строже: один акцент, без лишнего свечения
const T = {
  bg: 'rgba(15,23,42,0.72)',
  border: 'rgba(148,163,184,0.14)',
  text: '#E6EDF7',
  textSec: '#8A9BB8',
  accent: '#4A9FFF',
  pass: '#1A9B5A',
  fail: '#D93025',
  warn: '#E07B00',
  grid: 'rgba(148,163,184,0.12)',
  mono: "'JetBrains Mono','SF Mono',Consolas,monospace",
};

const card = {
  background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16,
  padding: 18, marginBottom: 14, color: T.text,
};

export default function SpectrumAnalyzer() {
  const [points, setPoints] = useState([]);       // [[fГц, дБ], ...]
  const [fileName, setFileName] = useState('');
  const [limitId, setLimitId] = useState(LIMIT_LINES[0].id);
  const [customPts, setCustomPts] = useState('30e6 40\n230e6 40\n230e6 47\n1e9 47');
  const [hover, setHover] = useState(null);       // {x,y,f,v,lim}
  const [dragOver, setDragOver] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const fileRef = useRef(null);

  // ─── Активная лимит-линия (включая пользовательскую) ─────────────────────
  const line = useMemo(() => {
    const base = LIMIT_LINES.find(l => l.id === limitId) || LIMIT_LINES[0];
    if (base.id !== 'custom') return base;
    const pts = customPts.split(/\n/).map(s => s.trim()).filter(Boolean).map(s => {
      const [f, v] = s.split(/[\s;,]+/).map(Number);
      return [f, v];
    }).filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]))
      .sort((a, b) => a[0] - b[0]);
    return {
      ...base,
      points: pts,
      fMin: pts[0]?.[0] ?? 0,
      fMax: pts[pts.length - 1]?.[0] ?? Infinity,
    };
  }, [limitId, customPts]);

  const result = useMemo(() => evaluate(points, line), [points, line]);

  // ─── Загрузка файла ───────────────────────────────────────────────────────
  const loadText = useCallback((name, text) => {
    const { points: pts, skipped, freqUnitGuess } = parseSpectrumCsv(text);
    setFileName(pts.length
      ? `${name} — ${pts.length} точек (частота: ${freqUnitGuess}${skipped ? `, пропущено строк: ${skipped}` : ''})`
      : `${name} — не удалось распознать данные`);
    setPoints(pts);
    setSavedMsg('');
  }, []);

  const onFile = (file) => {
    if (!file) return;
    const r = new FileReader();
    r.onload = () => loadText(file.name, String(r.result));
    r.readAsText(file);
  };

  const loadDemo = () => {
    // синтетическая трасса 30–1000 МГц с резонансом на 142 МГц
    const pts = [];
    for (let i = 0; i <= 300; i++) {
      const f = 30e6 * Math.pow(1000 / 30, i / 300);
      const base = 26 + 6 * Math.sin(Math.log10(f) * 9) + (Math.random() * 2 - 1);
      const peak = 22 * Math.exp(-Math.pow((f - 142e6) / 4e6, 2));
      const peak2 = 12 * Math.exp(-Math.pow((f - 426e6) / 9e6, 2));
      pts.push([f, +(base + peak + peak2).toFixed(2)]);
    }
    setPoints(pts);
    setFileName('demo-scan.csv — 301 точка (синтетика, пик 142 МГц)');
    setSavedMsg('');
  };

  // ─── Геометрия графика ────────────────────────────────────────────────────
  const W = 920, H = 360, mL = 56, mR = 16, mT = 14, mB = 38;
  const plotW = W - mL - mR, plotH = H - mT - mB;

  const geo = useMemo(() => {
    if (!points.length) return null;
    const fs = points.map(p => p[0]);
    const vs = points.map(p => p[1]);
    const limVals = line.points.map(p => p[1]);
    const f0 = Math.min(...fs), f1 = Math.max(...fs);
    let v0 = Math.min(...vs, ...(limVals.length ? limVals : [Infinity]));
    let v1 = Math.max(...vs, ...(limVals.length ? limVals : [-Infinity]));
    const pad = Math.max(4, (v1 - v0) * 0.12);
    v0 -= pad; v1 += pad;
    const lx = (f) => mL + plotW * (Math.log10(f) - Math.log10(f0)) / (Math.log10(f1) - Math.log10(f0) || 1);
    const ly = (v) => mT + plotH * (1 - (v - v0) / (v1 - v0 || 1));
    return { f0, f1, v0, v1, lx, ly };
  }, [points, line]);

  const tracePath = useMemo(() => {
    if (!geo) return '';
    return points.map((p, i) => `${i ? 'L' : 'M'}${geo.lx(p[0]).toFixed(1)},${geo.ly(p[1]).toFixed(1)}`).join('');
  }, [points, geo]);

  const limitPath = useMemo(() => {
    if (!geo || !line.points.length) return '';
    // лимит рисуем в пределах видимого диапазона, дискретизируя интерполяцию
    const f0 = Math.max(geo.f0, line.fMin), f1 = Math.min(geo.f1, line.fMax);
    if (!(f1 > f0)) return '';
    let d = '';
    const N = 200;
    for (let i = 0; i <= N; i++) {
      const f = f0 * Math.pow(f1 / f0, i / N);
      const v = limitAt(line, f);
      if (v == null) continue;
      d += `${d ? 'L' : 'M'}${geo.lx(f).toFixed(1)},${geo.ly(v).toFixed(1)}`;
    }
    return d;
  }, [geo, line]);

  // частотные тики: 1-2-5 на декаду
  const fTicks = useMemo(() => {
    if (!geo) return [];
    const ticks = [];
    const d0 = Math.floor(Math.log10(geo.f0)), d1 = Math.ceil(Math.log10(geo.f1));
    for (let d = d0; d <= d1; d++) {
      for (const m of [1, 2, 5]) {
        const f = m * Math.pow(10, d);
        if (f >= geo.f0 * 0.999 && f <= geo.f1 * 1.001) ticks.push(f);
      }
    }
    return ticks;
  }, [geo]);

  const vTicks = useMemo(() => {
    if (!geo) return [];
    const span = geo.v1 - geo.v0;
    const step = span > 80 ? 20 : span > 40 ? 10 : 5;
    const ticks = [];
    for (let v = Math.ceil(geo.v0 / step) * step; v <= geo.v1; v += step) ticks.push(v);
    return ticks;
  }, [geo]);

  const onMove = (e) => {
    if (!geo || !points.length) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * W;
    // ближайшая точка по x
    let best = null, bd = Infinity;
    for (const [f, v] of points) {
      const d = Math.abs(geo.lx(f) - x);
      if (d < bd) { bd = d; best = [f, v]; }
    }
    if (best) {
      setHover({
        f: best[0], v: best[1],
        lim: limitAt(line, best[0]),
        x: geo.lx(best[0]), y: geo.ly(best[1]),
      });
    }
  };

  // ─── Сохранение в журнал ──────────────────────────────────────────────────
  const saveToJournal = async () => {
    const entry = await store.insert('journal_entries', {
      date: new Date().toISOString().slice(0, 10),
      title: fileName.split(' — ')[0] || 'Скан спектра',
      test_type: line.domain === 'conducted' ? 'Conducted Emissions' : 'Radiated Emissions',
      standard: line.name,
      freq_range: geo ? `${fmtFreq(geo.f0)} – ${fmtFreq(geo.f1)}` : '',
      level: result.worst ? `${result.worst.value.toFixed(1)} ${line.unit} @ ${fmtFreq(result.worst.f)}` : '',
      status: result.verdict === 'FAIL' ? 'FAIL' : result.warn ? 'WARN' : 'PASS',
      problem: result.violations.length
        ? `Превышений: ${result.violations.length}. Худшее: +${(-result.minMargin).toFixed(1)} дБ @ ${fmtFreq(result.worst.f)}`
        : `Мин. запас ${result.minMargin === Infinity ? '—' : result.minMargin.toFixed(1) + ' дБ'}`,
      fix: '',
    });
    await store.insert('spectrum_scans', {
      journal_id: entry?.id ?? null,
      name: fileName || 'scan',
      limit_id: line.id,
      verdict: result.verdict,
      points_json: JSON.stringify(points),
    });
    setSavedMsg(`Сохранено в журнал (запись №${entry?.id ?? '—'})`);
  };

  const verdictColor = result.verdict === 'FAIL' ? T.fail : result.warn ? T.warn : T.pass;

  // ─── UI ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 980, margin: '0 auto', fontFamily: "'Inter',sans-serif" }}>

      {/* Панель управления */}
      <div style={{ ...card, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 260px' }}>
          <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 5 }}>
            Лимит-линия (норма)
          </label>
          <select
            value={limitId}
            onChange={e => setLimitId(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 14,
              background: 'rgba(8,15,30,0.9)', color: T.text, border: `1px solid ${T.border}`,
            }}
          >
            {LIMIT_LINES.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
        <button onClick={() => fileRef.current?.click()} style={btn(T.accent)}>
          Загрузить CSV
        </button>
        <button onClick={loadDemo} style={btn('transparent', T.text, T.border)}>
          Демо-данные
        </button>
        {points.length > 0 && (
          <button onClick={saveToJournal} style={btn(verdictColor)}>
            Записать в журнал
          </button>
        )}
        <input
          ref={fileRef} type="file" accept=".csv,.txt,.dat" hidden
          onChange={e => onFile(e.target.files?.[0])}
        />
      </div>

      {limitId === 'custom' && (
        <div style={card}>
          <label style={{ fontSize: 12, color: T.textSec, display: 'block', marginBottom: 6 }}>
            Опорные точки линии — по одной на строку: частота(Гц) уровень(дБ). Допустима запись 230e6.
          </label>
          <textarea
            value={customPts} onChange={e => setCustomPts(e.target.value)} rows={4}
            style={{
              width: '100%', boxSizing: 'border-box', resize: 'vertical', padding: 10,
              borderRadius: 8, background: 'rgba(8,15,30,0.9)', color: T.text,
              border: `1px solid ${T.border}`, fontFamily: T.mono, fontSize: 13,
            }}
          />
        </div>
      )}

      {/* Зона графика / drop-зона */}
      <div
        style={{
          ...card, padding: 12,
          outline: dragOver ? `2px dashed ${T.accent}` : 'none', outlineOffset: -6,
        }}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0]); }}
      >
        {!points.length ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: T.textSec }}>
            <div style={{ fontSize: 15, marginBottom: 6 }}>Перетащите сюда CSV со спектроанализатора</div>
            <div style={{ fontSize: 12.5 }}>
              Два столбца: частота и уровень. Разделители ; , или таб, десятичная запятая — поддерживаются.
              Единица частоты (Гц/кГц/МГц) определится автоматически.
            </div>
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '2px 6px 10px', flexWrap: 'wrap', gap: 8,
            }}>
              <span style={{ fontSize: 12.5, color: T.textSec }}>{fileName}</span>
              <span style={{
                fontFamily: T.mono, fontSize: 13, fontWeight: 700, color: verdictColor,
                border: `1px solid ${verdictColor}`, borderRadius: 999, padding: '3px 12px',
              }}>
                {result.verdict}{result.warn ? ' · запас < 6 дБ' : ''}
                {result.minMargin !== Infinity &&
                  ` · мин. запас ${result.minMargin.toFixed(1)} дБ`}
              </span>
            </div>

            <svg
              viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
              onMouseMove={onMove} onMouseLeave={() => setHover(null)}
            >
              {/* сетка */}
              {geo && fTicks.map(f => (
                <line key={'f' + f} x1={geo.lx(f)} x2={geo.lx(f)} y1={mT} y2={mT + plotH}
                  stroke={T.grid} strokeWidth="1" />
              ))}
              {geo && vTicks.map(v => (
                <line key={'v' + v} x1={mL} x2={mL + plotW} y1={geo.ly(v)} y2={geo.ly(v)}
                  stroke={T.grid} strokeWidth="1" />
              ))}

              {/* подписи осей */}
              {geo && fTicks.map(f => (
                <text key={'ft' + f} x={geo.lx(f)} y={H - 12} textAnchor="middle"
                  fontSize="10.5" fill={T.textSec} fontFamily={T.mono}>
                  {fmtFreq(f).replace(' ', '\u00A0')}
                </text>
              ))}
              {geo && vTicks.map(v => (
                <text key={'vt' + v} x={mL - 8} y={geo.ly(v) + 3.5} textAnchor="end"
                  fontSize="10.5" fill={T.textSec} fontFamily={T.mono}>{v}</text>
              ))}
              <text x={14} y={mT + 10} fontSize="10.5" fill={T.textSec}
                fontFamily={T.mono}>{line.unit}</text>

              {/* зоны превышения */}
              {geo && result.violations.map((vi, i) => (
                <circle key={i} cx={geo.lx(vi.f)} cy={geo.ly(vi.value)} r="3.4"
                  fill={T.fail} opacity="0.9" />
              ))}

              {/* лимит-линия */}
              {limitPath && (
                <path d={limitPath} fill="none" stroke={T.fail} strokeWidth="2"
                  strokeDasharray="7 4" opacity="0.9" />
              )}

              {/* трасса */}
              <path d={tracePath} fill="none" stroke={T.accent} strokeWidth="1.6" />

              {/* курсор */}
              {hover && (
                <g>
                  <line x1={hover.x} x2={hover.x} y1={mT} y2={mT + plotH}
                    stroke={T.textSec} strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={hover.x} cy={hover.y} r="4" fill={T.accent} />
                  <g transform={`translate(${Math.min(hover.x + 10, W - 215)},${mT + 8})`}>
                    <rect width="205" height={hover.lim != null ? 58 : 42} rx="8"
                      fill="rgba(5,8,20,0.92)" stroke={T.border} />
                    <text x="10" y="17" fontSize="11.5" fill={T.text} fontFamily={T.mono}>
                      {fmtFreq(hover.f)}
                    </text>
                    <text x="10" y="33" fontSize="11.5" fill={T.accent} fontFamily={T.mono}>
                      Уровень: {hover.v.toFixed(1)} {line.unit}
                    </text>
                    {hover.lim != null && (
                      <text x="10" y="49" fontSize="11.5" fontFamily={T.mono}
                        fill={hover.v > hover.lim ? T.fail : T.pass}>
                        Норма: {hover.lim.toFixed(1)} · запас {(hover.lim - hover.v).toFixed(1)} дБ
                      </text>
                    )}
                  </g>
                </g>
              )}
            </svg>
          </>
        )}
      </div>

      {/* Таблица превышений */}
      {result.violations.length > 0 && (
        <div style={card}>
          <div style={{
            fontSize: 12, fontWeight: 700, letterSpacing: 1, color: T.textSec,
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            Превышения нормы — {result.violations.length}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: T.textSec, textAlign: 'right' }}>
                <th style={th()}>№</th>
                <th style={{ ...th(), textAlign: 'left' }}>Частота</th>
                <th style={th()}>Уровень, {line.unit}</th>
                <th style={th()}>Норма, {line.unit}</th>
                <th style={th()}>Превышение, дБ</th>
              </tr>
            </thead>
            <tbody>
              {result.violations
                .slice()
                .sort((a, b) => b.excess - a.excess)
                .slice(0, 20)
                .map((v, i) => (
                  <tr key={i} style={{ borderTop: `1px solid ${T.grid}` }}>
                    <td style={td()}>{i + 1}</td>
                    <td style={{ ...td(), textAlign: 'left' }}>{fmtFreq(v.f)}</td>
                    <td style={td()}>{v.value.toFixed(1)}</td>
                    <td style={td()}>{v.limit.toFixed(1)}</td>
                    <td style={{ ...td(), color: T.fail, fontWeight: 700 }}>
                      +{v.excess.toFixed(1)}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {result.violations.length > 20 && (
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 8 }}>
              Показаны 20 худших из {result.violations.length}.
            </div>
          )}
        </div>
      )}

      {savedMsg && (
        <div style={{ ...card, borderColor: T.pass, color: T.pass, fontSize: 13.5 }}>
          {savedMsg}
        </div>
      )}
    </div>
  );
}

// ─── мелкие стили ────────────────────────────────────────────────────────────
function btn(bg, color = '#fff', border = 'transparent') {
  return {
    padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', background: bg, color, border: `1px solid ${border}`,
  };
}
function th() {
  return { padding: '6px 10px', fontWeight: 600, fontSize: 12 };
}
function td() {
  return {
    padding: '7px 10px', textAlign: 'right',
    fontFamily: "'JetBrains Mono','SF Mono',Consolas,monospace",
    fontVariantNumeric: 'tabular-nums', color: '#E6EDF7',
  };
}
