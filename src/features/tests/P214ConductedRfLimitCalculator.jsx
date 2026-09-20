import React, { useMemo, useState } from "react";
import { получить_предельный_уровень, построить_точки_кривой_21_4 } from "../../calculations/p214ConductedRfLimit.mjs";
import { НОРМАТИВНОЕ_ПРИМЕЧАНИЕ_21_4, ОБЪЕКТЫ_ИЗМЕРЕНИЯ_21_4 } from "../../data/limits/p214ConductedRfLimits.mjs";

const панель = { background: "#101827", border: "1px solid rgba(148,163,184,.18)", borderRadius: 12, padding: 16, marginBottom: 14 };
const поле = { background: "#0B1220", color: "#F8FAFC", border: "1px solid rgba(148,163,184,.3)", borderRadius: 7, padding: "9px 10px", width: "100%", boxSizing: "border-box", marginTop: 6 };
const карточка = { background: "#0B1220", borderRadius: 9, padding: 12 };
const подпись = { color: "#94A3B8", fontSize: 12, marginBottom: 5 };
const формат = значение => значение.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function График({ категория, объект }) {
  const точки = useMemo(() => категория && объект ? построить_точки_кривой_21_4(категория, объект) : [], [категория, объект]);
  if (!точки.length) return null;
  const x = частота => 48 + Math.log10(частота / 0.15) / Math.log10(152 / 0.15) * 704;
  const значения = точки.map(точка => точка.предельный_уровень_дбмка);
  const минимум = Math.min(...значения) - 5;
  const максимум = Math.max(...значения) + 5;
  const y = уровень => 242 - (уровень - минимум) / (максимум - минимум) * 200;
  return <div style={{ overflowX: "auto", marginTop: 16 }}>
    <div style={{ ...подпись, marginBottom: 8 }}>Нормативная кривая (исходные неокруглённые значения)</div>
    <svg role="img" aria-label="График предельного уровня" viewBox="0 0 800 280" style={{ minWidth: 560, width: "100%", display: "block" }}>
      <rect x="48" y="42" width="704" height="200" fill="#070D19" stroke="#334155" />
      {[0.15, 2, 30, 108, 152].map(частота => <g key={частота}><line x1={x(частота)} x2={x(частота)} y1="42" y2="242" stroke="#25324A"/><text x={x(частота)} y="261" fill="#94A3B8" fontSize="11" textAnchor="middle">{String(частота).replace(".", ",")}</text></g>)}
      <polyline points={точки.map(точка => `${x(точка.частота_мгц)},${y(точка.предельный_уровень_дбмка)}`).join(" ")} fill="none" stroke="#34D399" strokeWidth="3" />
      <text x="400" y="278" fill="#94A3B8" fontSize="12" textAnchor="middle">Частота, МГц (логарифмическая шкала)</text>
    </svg>
  </div>;
}

export default function P214ConductedRfLimitCalculator() {
  const [категория, задатьКатегорию] = useState("");
  const [объект, задатьОбъект] = useState("");
  const [частота, задатьЧастоту] = useState("");
  const числоваяЧастота = Number(String(частота).replace(",", "."));
  const результат = получить_предельный_уровень(частота === "" ? Number.NaN : числоваяЧастота, категория, объект);

  return <section style={панель}>
    <h3 style={{ marginTop: 0 }}>21.4 — Кондуктивные радиочастотные помехи</h3>
    <p style={{ color: "#94A3B8" }}>Рабочий диапазон: 0,15–152 МГц. Предельный уровень измеряется в дБмкА.</p>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 12 }}>
      <label>Категория<select aria-label="Категория" value={категория} onChange={событие => задатьКатегорию(событие.target.value)} style={поле}><option value="">Выберите категорию</option>{["B", "L", "M", "H", "P", "Q"].map(значение => <option key={значение}>{значение}</option>)}</select></label>
      <label>Объект измерения<select aria-label="Объект измерения" value={объект} onChange={событие => задатьОбъект(событие.target.value)} style={поле}><option value="">Выберите объект измерения</option>{ОБЪЕКТЫ_ИЗМЕРЕНИЯ_21_4.map(значение => <option key={значение}>{значение}</option>)}</select></label>
      <label>Частота, МГц<input aria-label="Частота, МГц" inputMode="decimal" value={частота} onChange={событие => задатьЧастоту(событие.target.value)} placeholder="Например, 50" style={поле}/></label>
    </div>

    {результат.ошибка ? <p role="alert" style={{ color: "#F59E0B", marginBottom: 0 }}>{результат.ошибка}</p> : <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, marginTop: 16 }} aria-live="polite">
        <div style={карточка}><div style={подпись}>Нормативный рисунок</div><strong>{результат.рисунок}</strong></div>
        <div style={карточка}><div style={подпись}>Предельный уровень</div><strong style={{ color: "#34D399", fontSize: 20 }}>{формат(результат.предельный_уровень_дбмка)} дБмкА</strong></div>
        <div style={карточка}><div style={подпись}>Диапазон частот</div><strong>{результат.диапазон}</strong></div>
        <div style={карточка}><div style={подпись}>Способ расчёта</div><strong>{результат.способ_расчёта}</strong></div>
        {результат.формула && <div style={{ ...карточка, gridColumn: "1 / -1" }}><div style={подпись}>Формула расчёта</div><strong>{результат.формула}</strong></div>}
      </div>
      {результат.есть_нормативное_примечание && <details style={{ marginTop: 14, border: "1px solid rgba(245,158,11,.4)", borderRadius: 9, padding: 12 }}><summary style={{ cursor: "pointer", color: "#F59E0B", fontWeight: 700 }}>Нормативное примечание</summary><p style={{ lineHeight: 1.6, marginBottom: 0 }}>{НОРМАТИВНОЕ_ПРИМЕЧАНИЕ_21_4}</p></details>}
      <График категория={категория} объект={объект}/>
    </>}
  </section>;
}
