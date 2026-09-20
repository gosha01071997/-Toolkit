import React, { useEffect, useRef, useState } from "react";
import {
  createEquipmentCharacteristic,
  formatCharacteristicNumber,
  formatCharacteristicTable,
  normalizeEquipmentCharacteristic,
  parseCharacteristicTable,
  validateCharacteristicRows,
} from "../../data/equipmentCharacteristics.mjs";

const button = {border:0,borderRadius:9,padding:"9px 12px",background:"#334155",color:"#F8FAFC",fontWeight:700,cursor:"pointer"};
const input = {width:"100%",boxSizing:"border-box",border:"1px solid rgba(148,163,184,.3)",borderRadius:8,padding:"9px",background:"#0B1220",color:"#F8FAFC"};
const toDraft = characteristic => characteristic.points.map(point => ({ frequencyMHz: String(point.frequencyMHz), value: String(point.value) }));

export default function CharacteristicTable({ definition, value, onSave }) {
  const normalized = normalizeEquipmentCharacteristic(value, definition);
  const [rows, setRows] = useState(() => toDraft(normalized));
  const [error, setError] = useState("");
  const tableRef = useRef(null);
  useEffect(() => { setRows(toDraft(normalizeEquipmentCharacteristic(value, definition))); setError(""); }, [value, definition]);

  const applyText = text => {
    try { setRows(toDraft({ points: parseCharacteristicTable(text) })); setError(""); }
    catch (reason) { setError(reason.message); }
  };
  const paste = event => { event.preventDefault(); applyText(event.clipboardData.getData("text")); };
  const pasteFromExcel = async () => {
    try { applyText(await navigator.clipboard.readText()); }
    catch { const text = window.prompt("Вставьте скопированные из Excel ячейки:", ""); if (text !== null) applyText(text); }
  };
  const save = () => {
    try {
      const points = validateCharacteristicRows(rows);
      setRows(toDraft({ points }));
      onSave(createEquipmentCharacteristic(definition, points));
      setError("");
    } catch (reason) { setError(reason.message); }
  };
  const copy = async () => {
    try {
      const text = formatCharacteristicTable(rows, definition);
      await navigator.clipboard.writeText(text);
      setError("");
    } catch (reason) { setError(reason.message || "Не удалось скопировать таблицу."); }
  };
  const clear = () => { if (window.confirm("Удалить все калибровочные точки?")) { setRows([]); setError(""); } };
  const preview = (() => { try { return validateCharacteristicRows(rows); } catch { return []; } })();

  return <section style={{marginTop:18,padding:16,border:"1px solid rgba(148,163,184,.22)",borderRadius:14,background:"rgba(11,18,32,.72)"}}>
    <div style={{fontSize:13,color:"#94A3B8",fontWeight:800,marginBottom:4}}>Калибровочные данные</div>
    <h3 style={{margin:"0 0 8px",fontSize:17}}>{definition.title}</h3>
    {preview.length ? <div style={{fontSize:12,color:"#94A3B8",marginBottom:12}}>Точек: {preview.length} · Диапазон калибровки: {formatCharacteristicNumber(preview[0].frequencyMHz)}–{formatCharacteristicNumber(preview.at(-1).frequencyMHz)} МГц</div> : <div style={{fontSize:12,color:"#94A3B8",marginBottom:12}}>Калибровочные данные не добавлены.</div>}
    <div ref={tableRef} onPaste={paste} style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",minWidth:520}}><thead><tr><th style={{textAlign:"left",padding:7}}>{definition.frequencyLabel}</th><th style={{textAlign:"left",padding:7}}>{definition.valueLabel}</th><th style={{width:130}} /></tr></thead>
      <tbody>{rows.map((row,index)=><tr key={index}><td style={{padding:4}}><input aria-label={`${definition.frequencyLabel}, строка ${index + 1}`} style={input} inputMode="decimal" value={row.frequencyMHz} onChange={event=>setRows(rows.map((item,i)=>i===index?{...item,frequencyMHz:event.target.value}:item))}/></td><td style={{padding:4}}><input aria-label={`${definition.valueLabel}, строка ${index + 1}`} style={input} inputMode="decimal" value={row.value} onChange={event=>setRows(rows.map((item,i)=>i===index?{...item,value:event.target.value}:item))}/></td><td style={{padding:4}}><button type="button" style={{...button,background:"#7F1D1D",width:"100%"}} onClick={()=>setRows(rows.filter((_,i)=>i!==index))}>Удалить строку</button></td></tr>)}</tbody></table>
    </div>
    {error && <div role="alert" style={{marginTop:9,color:"#FCA5A5",fontSize:13}}>{error}</div>}
    <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
      <button type="button" style={button} onClick={()=>setRows([...rows,{frequencyMHz:"",value:""}])}>Добавить строку</button>
      <button type="button" style={button} onClick={pasteFromExcel}>Вставить из Excel</button>
      <button type="button" style={button} onClick={copy}>Копировать таблицу</button>
      <button type="button" style={{...button,background:"#7F1D1D"}} onClick={clear}>Очистить таблицу</button>
      <button type="button" style={{...button,background:"#2563EB",marginLeft:"auto"}} onClick={save}>Сохранить</button>
    </div>
  </section>;
}
