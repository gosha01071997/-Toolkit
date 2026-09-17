import React, { useMemo, useState } from "react";
import {
  calculateP215RadiatedLimit,
  generateP215RadiatedLimitTable,
  P215_MAX_FREQUENCY_MHZ,
  P215_MIN_FREQUENCY_MHZ,
} from "../../calculations/p215RadiatedLimit.mjs";

const panel = { background: "#101827", border: "1px solid rgba(148,163,184,.18)", borderRadius: 12, padding: 16, marginBottom: 14 };
const input = { background: "#0B1220", color: "#F8FAFC", border: "1px solid rgba(148,163,184,.3)", borderRadius: 7, padding: "9px 10px", width: "100%", boxSizing: "border-box" };
const button = active => ({ background: active ? "#2563EB" : "#172238", color: "#F8FAFC", border: "1px solid rgba(148,163,184,.25)", borderRadius: 7, padding: "8px 12px", cursor: "pointer", fontWeight: 700 });
const parseNumber = value => Number(String(value).replace(",", "."));
const formatLimit = value => `${value.toFixed(2)} dBµV/m`;
const unavailableMessage = "Расчёт категории требует подтверждения нормативных точек";

function LimitChart({ mode }) {
  const categories = mode === "BL" ? ["B", "L"] : [mode];
  const series = useMemo(() => categories.map(category => ({
    category,
    points: Array.from({ length: 181 }, (_, index) => {
      const frequency = P215_MIN_FREQUENCY_MHZ * (P215_MAX_FREQUENCY_MHZ / P215_MIN_FREQUENCY_MHZ) ** (index / 180);
      return calculateP215RadiatedLimit(frequency, category);
    }),
  })), [mode]);
  const x = frequency => 50 + Math.log10(frequency / 100) / Math.log10(60) * 700;
  const y = limit => 260 - (limit - 40) / 60 * 220;

  return <div style={{ overflowX: "auto" }}><svg role="img" aria-label={`График предельных линий ${mode === "BL" ? "B и L" : mode}`} viewBox="0 0 800 300" style={{ display: "block", minWidth: 620, width: "100%" }}>
    <rect x="50" y="40" width="700" height="220" fill="#0B1220" stroke="#334155" />
    {[40, 60, 80, 100].map(value => <g key={value}><line x1="50" x2="750" y1={y(value)} y2={y(value)} stroke="#25324A"/><text x="43" y={y(value)+4} fill="#94A3B8" fontSize="11" textAnchor="end">{value}</text></g>)}
    {[100, 300, 1000, 3000, 6000].map(value => <g key={value}><line x1={x(value)} x2={x(value)} y1="40" y2="260" stroke="#25324A"/><text x={x(value)} y="279" fill="#94A3B8" fontSize="11" textAnchor="middle">{value}</text></g>)}
    {series.map(item => item.points.every(point => point.calculationAvailable) && <polyline key={item.category} points={item.points.map(point => `${x(point.frequencyMHz)},${y(point.limitDbUvM)}`).join(" ")} fill="none" stroke={item.category === "B" ? "#60A5FA" : "#34D399"} strokeWidth="3" />)}
    <text x="400" y="297" fill="#94A3B8" fontSize="12" textAnchor="middle">Частота, MHz (логарифмическая шкала)</text>
    {series.filter(item => item.points.every(point => point.calculationAvailable)).map((item, index) => <g key={`legend-${item.category}`}><line x1={620+index*65} x2={640+index*65} y1="22" y2="22" stroke={item.category === "B" ? "#60A5FA" : "#34D399"} strokeWidth="3"/><text x={645+index*65} y="26" fill="#F8FAFC" fontSize="12">{item.category}</text></g>)}
  </svg></div>;
}

export default function P215RadiatedLimitCalculator() {
  const [category, setCategory] = useState("L");
  const [frequency, setFrequency] = useState("200");
  const [range, setRange] = useState({ start: "100", end: "300", step: "10" });
  const [chartMode, setChartMode] = useState("BL");
  const result = calculateP215RadiatedLimit(parseNumber(frequency), category);
  const rows = useMemo(() => generateP215RadiatedLimitTable({ category, startMHz: parseNumber(range.start), endMHz: parseNumber(range.end), stepMHz: parseNumber(range.step) }), [category, range]);
  const tableValid = rows.length > 0 && rows.every(row => row.inRange);
  const setQuickRange = (start, end) => setRange({ start: String(start), end: String(end), step: start === 1000 ? "10" : "1" });

  return <section style={panel}>
    <h3 style={{ marginTop: 0 }}>Калькулятор предела излучаемых РЧ-помех, п. 21.5</h3>
    <p style={{ color: "#94A3B8" }}>Расчётная область: 100–6000 MHz. Значения вне области не экстраполируются.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
      <label>Категория<select aria-label="Категория" value={category} onChange={event => { const value = event.target.value; setCategory(value); setChartMode(value); }} style={input}>{["B","L","M","H","P","Q"].map(value => <option key={value}>{value}</option>)}</select></label>
      <label>Частота, MHz<input aria-label="Частота, MHz" inputMode="decimal" value={frequency} onChange={event => setFrequency(event.target.value)} style={input}/></label>
      <div><span>Результат</span><div aria-live="polite" style={{ fontSize: 21, fontWeight: 800, marginTop: 8, color: result.inRange && result.calculationAvailable ? "#34D399" : "#F59E0B" }}>{!result.inRange ? "Вне диапазона" : result.calculationAvailable ? formatLimit(result.limitDbUvM) : unavailableMessage}</div></div>
    </div>

    <h4>Таблица</h4>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>{[[100,300],[300,1000],[1000,6000]].map(([start,end]) => <button key={start} style={button(false)} onClick={() => setQuickRange(start,end)}>{start}–{end} MHz</button>)}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(120px,1fr))", gap: 10 }}>
      {[["Начальная частота", "start"],["Конечная частота", "end"],["Шаг", "step"]].map(([label,key]) => <label key={key}>{label}, MHz<input aria-label={`${label}, MHz`} value={range[key]} onChange={event => setRange(current => ({ ...current, [key]: event.target.value }))} style={input}/></label>)}
    </div>
    {!tableValid && <p role="alert" style={{ color: "#F59E0B" }}>Задайте корректный диапазон 100–6000 MHz и положительный шаг.</p>}
    {tableValid && !result.calculationAvailable && <p role="status" style={{ color: "#F59E0B" }}>{unavailableMessage}</p>}
    {tableValid && result.calculationAvailable && <div style={{ maxHeight: 330, overflow: "auto", marginTop: 12 }}><table style={{ width: "100%", borderCollapse: "collapse" }}><thead><tr><th style={{ textAlign: "left", position: "sticky", top: 0, background: "#101827" }}>Частота, MHz</th><th style={{ textAlign: "left", position: "sticky", top: 0, background: "#101827" }}>Категория</th><th style={{ textAlign: "left", position: "sticky", top: 0, background: "#101827" }}>Предел, dBµV/m</th></tr></thead><tbody>{rows.map((row,index) => <tr key={`${row.frequencyMHz}-${index}`}><td>{Number(row.frequencyMHz.toFixed(10))}</td><td>{row.category}</td><td>{row.limitDbUvM.toFixed(2)}</td></tr>)}</tbody></table></div>}

    <h4>График</h4>
    <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>{["B","L","M","H","P","Q","BL"].map(mode => <button key={mode} aria-pressed={chartMode === mode} style={button(chartMode === mode)} onClick={() => setChartMode(mode)}>{mode === "BL" ? "B + L" : mode}</button>)}</div>
    {!(["B", "L", "BL"].includes(chartMode)) && <p role="status" style={{ color: "#F59E0B" }}>{unavailableMessage}</p>}
    <LimitChart mode={chartMode}/>
  </section>;
}
