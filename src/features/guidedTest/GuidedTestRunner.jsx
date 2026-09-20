import React, { useEffect, useMemo, useState } from "react";
import { checkEquipmentCompatibility, computeTableRows, equipmentMatchesType, equipmentOptionLabels, getVisibleStages, isVisible, parseTablePaste, searchEquipment, tableToTsv, validateField } from "./engine.mjs";
import { deletePhoto, loadPhotos, loadProgress, readExistingEquipment, savePhoto, saveProgress } from "./persistence.mjs";
import "./guidedTest.css";

const fallbackEquipment = [
  { id: "e1", name: "Оборудование 1", type: "Измерительное оборудование" },
  { id: "e2", name: "Оборудование 2", type: "Анализатор" },
  { id: "e3", name: "Оборудование 3", type: "Антенна" },
  { id: "e4", name: "Оборудование 4", type: "Генератор" },
  { id: "e5", name: "Оборудование 5", type: "Токовый пробник" },
];

const EquipmentStage = ({ requirements, selected, onSelect, onAddEquipment }) => {
  const [query, setQuery] = useState("");
  const equipment = useMemo(() => readExistingEquipment(localStorage, fallbackEquipment), []);
  return <div className="guided-stack">
    {requirements.map(requirement => {
      const choices = searchEquipment(equipment.filter(item => equipmentMatchesType(item, requirement)), query);
      const choiceLabels = equipmentOptionLabels(choices);
      const item = equipment.find(value => value.id === selected[requirement.id]);
      const compatibility = item && checkEquipmentCompatibility(item, requirement);
      return <section className="guided-panel" key={requirement.id}>
        <h3>{requirement.title || requirement.type}{requirement.optional && <small className="optional"> · необязательно</small>}</h3>
        {requirement.typeChoices && <p className="guided-muted">Подходящие типы: {requirement.typeChoices.join("; ")}</p>}
        <label>Поиск по названию, производителю или модели<input value={query} onChange={event => setQuery(event.target.value)} placeholder="Начните вводить…" /></label>
        <label>Выберите оборудование<select value={selected[requirement.id] || ""} onChange={event => onSelect(requirement.id, event.target.value)}><option value="">Не выбрано</option>{choices.map(choice => <option value={choice.id} key={choice.id}>{choiceLabels.get(choice.id)}</option>)}</select></label>
        {item && <div className="equipment-summary"><b>{equipmentOptionLabels([item]).get(item.id)}</b><dl><dt>Тип</dt><dd>{item.type || "Не указан"}</dd><dt>Производитель</dt><dd>{item.manufacturer || "Не указан"}</dd><dt>Модель</dt><dd>{item.model || "Не указана"}</dd><dt>Название экземпляра</dt><dd>{item.name || "Оборудование без названия"}</dd><dt>Рабочий диапазон</dt><dd>{typeof item.frequencyRange === "string" ? item.frequencyRange : item.frequencyRange ? `${item.frequencyRange.min}–${item.frequencyRange.max}` : "Не указан"}</dd><dt>Калибровочные данные</dt><dd>{item.calibrationStatus || (item.calibrationCharacteristic ? "Есть данные" : "Нет данных")}</dd></dl>{!item.calibrationStatus && !item.calibrationCharacteristic && <p className="guided-warning">Калибровочные данные отсутствуют. Продолжить можно, но проверьте пригодность оборудования.</p>}{compatibility?.warnings.map(text => <p className="guided-warning" key={text}>{text}</p>)}</div>}
        <button className="guided-link" onClick={onAddEquipment}>Не нашли оборудование? Добавить своё</button>
      </section>;
    })}
  </div>;
};

const MeasurementResult = ({ result }) => result && <section className="guided-panel measurement-result"><h3>КАТЕГОРИЯ</h3><div className="category"><strong>{result.category}</strong></div>{result.category === "Y" ? <p>{result.categoryRange}</p> : <dl><dt>D</dt><dd>{String(result.distance).replace(".", ",")} м</dd><dt>Dc</dt><dd>{result.dc?.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}°</dd><dt>Диапазон категории</dt><dd>{result.categoryRange}</dd></dl>}</section>;

const Photos = ({ scenarioId }) => {
  const [photos, setPhotos] = useState(() => loadPhotos(localStorage, scenarioId));
  const [caption, setCaption] = useState("");
  const add = event => { const file = event.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => { savePhoto(localStorage, scenarioId, { dataUrl: String(reader.result), caption }); setPhotos(loadPhotos(localStorage, scenarioId)); setCaption(""); }; reader.readAsDataURL(file); event.target.value = ""; };
  return <section className="guided-panel"><h3>Фотографии вашей установки</h3><p className="guided-muted">Фотографии этой установки хранятся только на этом устройстве.</p><input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Например: положение изделия, расположение компаса, АРМ-2" aria-label="Подпись фотографии"/><label className="guided-button">Добавить фото<input type="file" accept="image/*" hidden onChange={add}/></label><div className="photo-grid">{photos.map(photo => <figure key={photo.id}><a href={photo.dataUrl} target="_blank" rel="noreferrer"><img src={photo.dataUrl} alt={photo.caption || "Фото испытания"}/></a><figcaption>{photo.caption || "Без подписи"}</figcaption><div><a href={photo.dataUrl} target="_blank" rel="noreferrer">Открыть</a><button onClick={() => { setPhotos(deletePhoto(localStorage, scenarioId, photo.id)); }}>Удалить фото</button></div></figure>)}</div></section>;
};

const DataTable = ({ table, rows, onChange }) => {
  const computed = computeTableRows(table, rows);
  const setCell = (rowIndex, key, value) => onChange(computeTableRows(table, computed.map((row, index) => index === rowIndex ? { ...row, [key]: value } : row)));
  const paste = event => { const grid = parseTablePaste(event.clipboardData.getData("text"), table.columns.filter(c => !c.readonly).length); if (grid.length < 1) return; event.preventDefault(); const editable = table.columns.filter(c => !c.readonly); onChange(computeTableRows(table, grid.map(cells => Object.fromEntries(editable.map((column, i) => [column.key, cells[i]]))))); };
  return <section className="guided-panel"><div className="table-heading"><h3>{table.title}</h3><button onClick={() => navigator.clipboard?.writeText(tableToTsv(table.columns, computed))}>Копировать в Excel</button></div><div className="table-scroll"><table><thead><tr>{table.columns.map(column => <th key={column.key}>{column.title}</th>)}</tr></thead><tbody>{computed.map((row, rowIndex) => <tr key={rowIndex}>{table.columns.map(column => <td key={column.key}>{column.readonly ? <output>{row[column.key]}</output> : <input aria-label={`${column.title}, строка ${rowIndex + 1}`} value={row[column.key] || ""} onPaste={paste} onChange={e => setCell(rowIndex, column.key, e.target.value)}/>}</td>)}</tr>)}</tbody></table></div><button onClick={() => onChange([...computed, {}])}>Добавить строку</button><p className="guided-muted">Можно вставить строки из Excel. Поддерживаются десятичная точка и запятая.</p></section>;
};

export default function GuidedTestRunner({ scenario, onOpenEquipment = () => {}, onBackToSelection }) {
  const stages = useMemo(() => getVisibleStages(scenario), [scenario]);
  const [progress, setProgress] = useState(() => loadProgress(localStorage, scenario.id));
  const current = Math.min(progress.currentStage, Math.max(0, stages.length - 1));
  const stage = stages[current];
  useEffect(() => { setProgress(old => saveProgress(localStorage, scenario.id, { ...old, currentStage: current })); }, [scenario.id, current]);
  const update = patch => setProgress(old => saveProgress(localStorage, scenario.id, { ...old, ...patch }));
  const setInput = (id, value) => update({ inputs: { ...progress.inputs, [id]: value } });
  const field = definition => {
    if (!isVisible(definition, progress.inputs)) return null;
    const value = progress.inputs[definition.id] ?? "";
    const error = validateField(definition, value, progress.inputs);
    const status = typeof definition.status === "function" && value !== "" ? definition.status(progress.inputs) : "";
    return <fieldset className={`guided-field ${definition.type === "radio" ? "radio-field" : ""}`} key={definition.id}><legend>{definition.label}</legend>{definition.type === "radio" ? definition.options.map(option => <label className="radio-option" key={option.value}><input type="radio" name={definition.id} value={option.value} checked={value === option.value} onChange={e => setInput(definition.id, e.target.value)}/>{option.label}</label>) : <input type={definition.type || "text"} inputMode={definition.inputMode} placeholder={definition.placeholder} value={value} onChange={e => setInput(definition.id, e.target.value)}/>} {definition.unit && <span className="field-unit">{definition.unit}</span>}{definition.hint && <small>{definition.hint}</small>}{error && value !== "" && <span className="field-error">{error}</span>}{status && <span className={status.startsWith("⚠") ? "field-status warning" : "field-status"}>{status}</span>}</fieldset>;
  };
  const equipment = useMemo(() => readExistingEquipment(localStorage, fallbackEquipment), []);
  const result = stage?.result?.(progress.inputs, progress) || null;
  const measurementResult = stage?.measurementResult?.(progress.inputs, progress) || null;
  if (!stage) return <p>В сценарии нет доступных этапов.</p>;
  const showDerived = stage.derived && (!stage.derivedVisibleWhen || stage.derivedVisibleWhen(progress.inputs, progress));
  const derived = showDerived && <>{stage.derivedHeading && <h3 className="derived-heading">{stage.derivedHeading}</h3>}{stage.derived.map((item, index) => { const value = item.value(progress.inputs, progress); return value ? <div className={item.prominent ? "derived prominent" : "derived"} key={item.label || index}>{item.label && <span>{item.label}</span>}<strong>{value}</strong></div> : null; })}</>;
  return <main className="guided-runner">
    {onBackToSelection && <button className="back-selection" onClick={onBackToSelection}>← Вернуться к выбору испытания</button>}
    <header className="guided-header"><div><span className="guided-kicker">{scenario.standard} · {scenario.section}</span><h1>{scenario.title}</h1><p>{scenario.description}</p></div><div className="guided-progress"><b>Шаг {current + 1} из {stages.length}</b><progress value={current + 1} max={stages.length}/></div></header>
    {scenario.warnings?.map(text => <p className="guided-warning" key={text}>{text}</p>)}
    <nav className="stage-list" aria-label="Этапы испытания">{stages.map((item, index) => <button key={item.id} className={index === current ? "active" : ""} onClick={() => update({ currentStage: index })}><span>{progress.completed[`stage:${item.id}`] ? "✓" : index + 1}</span>{item.title}</button>)}</nav>
    <article className="guided-stage"><h2>{stage.heading || stage.title}</h2>
      {stage.intro && <p className="stage-intro">{stage.intro}</p>}
      {stage.showEquipment && <EquipmentStage requirements={scenario.equipmentRequirements} selected={progress.equipment} onAddEquipment={onOpenEquipment} onSelect={(id, value) => update({ equipment: { ...progress.equipment, [id]: value } })}/>}
      {stage.id === "magneticField" && progress.inputs.hKnown === "no" && <p className="guided-panel selected-equipment"><b>Магнитометр:</b> {equipmentOptionLabels(equipment).get(progress.equipment.magnetometer) || "не выбран"}</p>}
      {stage.diagram && <section className="guided-panel diagram"><h3>{stage.diagram.title}</h3><button title="Нажмите, чтобы увеличить" onClick={e => e.currentTarget.classList.toggle("enlarged")}>{stage.diagram.image && <img src={stage.diagram.image} alt={stage.diagram.alt || "Схема испытания"}/>}<strong>{stage.diagram.description}</strong><span>{stage.diagram.labels?.join(" → ")}</span><em>{stage.diagram.enlargeLabel || "Открыть схему крупнее"}</em></button></section>}
      {stage.actions?.map(action => <section className="instruction" key={action.id}><h3>{action.title}</h3><p>{action.instruction}</p>{action.image && <img className="instruction-image" src={action.image} alt={action.imageAlt || action.title}/>} {action.explanation && <small>{action.explanation}</small>}{action.warning && <div className="guided-warning">{action.warning}</div>}{stage.showActionCompletion !== false && <label className="check"><input type="checkbox" checked={Boolean(progress.completed[action.id])} onChange={e => update({ completed: { ...progress.completed, [action.id]: e.target.checked } })}/> {action.checkboxLabel || "Выполнено"}</label>}</section>)}
      {!stage.derivedAfterFields && derived}
      <div className="guided-fields">{stage.fields?.map(field)}</div>
      {stage.derivedAfterFields && derived}
      <MeasurementResult result={measurementResult}/>
      {stage.notices?.filter(item => isVisible(item, progress.inputs)).map((item, index) => <p className={item.tone === "warning" ? "guided-warning" : "guided-notice"} key={index}>{item.text}</p>)}
      {stage.tables?.map(table => <DataTable key={table.id} table={table} rows={progress.tables[table.id] || [{}]} onChange={rows => update({ tables: { ...progress.tables, [table.id]: rows } })}/>)}
      {(stage.photos || (stage.id === "diagram" && stage.photos !== false)) && <Photos scenarioId={scenario.id}/>}
      {result && <section className="guided-panel test-result"><h3>Результаты испытания</h3><div className="category"><span>Категория</span><strong>{result.category}</strong></div><dl>{result.category !== "Y" && <><dt>Расстояние D</dt><dd>{String(result.distance).replace(".", ",")} м</dd></>}<dt>Контрольное отклонение Dc</dt><dd>{result.dc == null ? "—" : `${result.dc.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}°`}</dd><dt>Магнитное поле H</dt><dd>{progress.inputs.h || "—"} А/м</dd><dt>Изделие</dt><dd>{progress.inputs.eutName || "—"}</dd><dt>Модель / обозначение</dt><dd>{progress.inputs.eutModel || "—"}</dd><dt>Магнитный индикатор</dt><dd>{equipmentOptionLabels(equipment).get(progress.equipment.deflectionInstrument) || "Не выбран"}</dd><dt>Магнитометр</dt><dd>{equipmentOptionLabels(equipment).get(progress.equipment.magnetometer) || "Не использовался"}</dd><dt>Температура</dt><dd>{progress.inputs.temperature || "—"} °C</dd><dt>Влажность</dt><dd>{progress.inputs.humidity || "—"} %</dd><dt>Давление</dt><dd>{progress.inputs.pressure || "—"} кПа</dd><dt>Метод проведения</dt><dd>{progress.inputs.method === "sensor" ? "Перемещался магнитный индикатор" : progress.inputs.method === "eut" ? "Перемещалось изделие" : "—"}</dd>{(progress.inputs.maximumMode || progress.inputs.eutMode) && <><dt>Режим максимального воздействия</dt><dd>{progress.inputs.maximumMode || progress.inputs.eutMode}</dd></>}{progress.inputs.eutNote && <><dt>Примечание</dt><dd>{progress.inputs.eutNote}</dd></>}</dl>{!result.conditions.ok && <p className="guided-warning">Лабораторные условия выходили за стандартный диапазон.</p>}{result.uniformity && !result.uniformity.ok && <p className="guided-warning">Однородность магнитного поля вдоль траектории недостаточна.</p>}<p className="guided-muted">Прогресс испытания сохранён локально и восстановится при следующем открытии.</p></section>}
      {stage.id === "result" && !result && <section className="guided-panel"><h3>Сводка</h3><p>Выполнено действий: {Object.values(progress.completed).filter(Boolean).length}</p><p>Выбрано единиц оборудования: {Object.values(progress.equipment).filter(Boolean).length}</p><p className="guided-muted">Незавершённое испытание сохранено локально и восстановится при следующем открытии.</p></section>}
      {scenario.showStageCompletion !== false && <label className="stage-complete"><input type="checkbox" checked={Boolean(progress.completed[`stage:${stage.id}`])} onChange={e => update({ completed: { ...progress.completed, [`stage:${stage.id}`]: e.target.checked } })}/> Этап выполнен</label>}
    </article>
    <footer><button disabled={current === 0} onClick={() => update({ currentStage: current - 1 })}>Назад</button><button disabled={current === stages.length - 1} onClick={() => update({ currentStage: current + 1 })}>Далее</button></footer>
  </main>;
}
