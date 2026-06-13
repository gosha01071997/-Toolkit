/**
 * EMC Pro — Генератор протокола испытаний (localStorage-only версия).
 *
 * Отличия от полной версии:
 *   - НЕТ window.open: предпросмотр — модальное окно с iframe прямо в приложении;
 *   - экспорт в PDF — системный диалог печати через скрытый iframe
 *     (пользователь выбирает «Сохранить как PDF»);
 *   - никаких Electron IPC, electron.js не требуется менять.
 *
 * Подключение в App.jsx:
 *   import ProtocolGenerator from './features/protocol/ProtocolGenerator';
 *   {page === 'protocol' && <ProtocolGenerator />}
 */
import React, { useEffect, useState } from 'react';
import { renderProtocolHtml } from './protocolTemplate';
import { store, printHtml } from '../../services/storage';

const T = {
  bg: 'rgba(15,23,42,0.72)', border: 'rgba(148,163,184,0.14)',
  text: '#E6EDF7', textSec: '#8A9BB8', accent: '#4A9FFF',
  pass: '#1A9B5A', fail: '#D93025',
};
const card = {
  background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16,
  padding: 18, marginBottom: 14, color: T.text,
};
const inp = {
  width: '100%', boxSizing: 'border-box', padding: '9px 11px', borderRadius: 8,
  fontSize: 14, background: 'rgba(8,15,30,0.9)', color: T.text,
  border: `1px solid ${T.border}`, fontFamily: 'inherit',
};
const lbl = { fontSize: 12, color: T.textSec, display: 'block', margin: '0 0 4px' };
const secTitle = {
  fontSize: 12, fontWeight: 700, letterSpacing: 1, color: T.textSec,
  textTransform: 'uppercase', marginBottom: 12,
};

const EMPTY_RESULT = { parameter: '', requirement: '', measured: '', verdict: 'PASS' };

export default function ProtocolGenerator() {
  const today = new Date().toISOString().slice(0, 10);
  const [p, setP] = useState({
    orgName: '', orgAddress: '', accreditation: '',
    number: '', date: today,
    objectName: '', objectId: '', customer: '',
    testType: 'Излучаемые радиопомехи', standard: 'ГОСТ РВ 20.57.306-98',
    range: '', conditions: 'нормальные климатические условия',
    notes: '', engineer: '', chief: '',
    results: [{ ...EMPTY_RESULT }],
    equipment: [],
  });
  const [dbEquip, setDbEquip] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);          // {ok, text}
  const [previewHtml, setPreviewHtml] = useState(null); // модальный предпросмотр

  // реквизиты организации запоминаются между протоколами
  useEffect(() => {
    (async () => {
      try {
        const saved = await store.getSetting('protocol_org');
        if (saved) setP(prev => ({ ...prev, ...JSON.parse(saved) }));
        const eq = await store.calibrationSummary(30);
        setDbEquip(Array.isArray(eq) ? eq : []);
      } catch { /* не критично */ }
    })();
  }, []);

  // Esc закрывает предпросмотр
  useEffect(() => {
    if (!previewHtml) return;
    const onKey = (e) => { if (e.key === 'Escape') setPreviewHtml(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewHtml]);

  const set = (k) => (e) => setP(prev => ({ ...prev, [k]: e.target.value }));

  const setResult = (i, k, v) => setP(prev => {
    const results = prev.results.slice();
    results[i] = { ...results[i], [k]: v };
    return { ...prev, results };
  });
  const addResult = () =>
    setP(prev => ({ ...prev, results: [...prev.results, { ...EMPTY_RESULT }] }));
  const delResult = (i) =>
    setP(prev => ({ ...prev, results: prev.results.filter((_, j) => j !== i) }));

  const pullEquipment = () => {
    const rows = dbEquip.map(e => ({
      name: [e.name, e.kind].filter(Boolean).join(', '),
      serial: e.serial || e.inventory_no || '—',
      cert: e.cert_no || '—',
      validUntil: e.valid_until || '—',
    }));
    setP(prev => ({ ...prev, equipment: rows }));
    setMsg(rows.length
      ? { ok: true, text: `Подтянуто позиций: ${rows.length}` }
      : { ok: false, text: 'Список оборудования пуст — заполните раздел «Оборудование» или добавьте позиции вручную в коде интеграции' });
  };

  const validate = () => {
    if (!p.objectName.trim()) return 'Укажите наименование изделия (раздел 1)';
    if (!p.number.trim()) return 'Укажите номер протокола';
    if (!p.results.some(r => r.parameter.trim())) return 'Добавьте хотя бы один результат (раздел 4)';
    return null;
  };

  const persistOrg = () => store.setSetting('protocol_org', JSON.stringify({
    orgName: p.orgName, orgAddress: p.orgAddress,
    accreditation: p.accreditation, engineer: p.engineer, chief: p.chief,
  }));

  const doExport = async () => {
    const err = validate();
    if (err) { setMsg({ ok: false, text: err }); return; }
    setBusy(true); setMsg(null);
    try {
      await persistOrg();
      const res = await printHtml(renderProtocolHtml(p));
      setMsg(res.ok
        ? { ok: true, text: 'Открыт диалог печати — выберите принтер «Сохранить как PDF» (Save as PDF)' }
        : { ok: false, text: res.error || 'Не удалось открыть диалог печати' });
    } catch (e) {
      setMsg({ ok: false, text: 'Ошибка экспорта: ' + e.message });
    } finally {
      setBusy(false);
    }
  };

  const doPreview = () => {
    const err = validate();
    if (err) { setMsg({ ok: false, text: err }); return; }
    setPreviewHtml(renderProtocolHtml(p));
  };

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 };
  const grid3 = { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10, marginBottom: 10 };

  return (
    <div style={{ maxWidth: 880, margin: '0 auto', fontFamily: "'Inter',sans-serif" }}>

      <div style={card}>
        <div style={secTitle}>Организация (запоминается)</div>
        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>Наименование лаборатории</label>
          <input style={inp} value={p.orgName} onChange={set('orgName')}
            placeholder="АО «Пример» — испытательная лаборатория ЭМС" />
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>Адрес, контакты</label>
            <input style={inp} value={p.orgAddress} onChange={set('orgAddress')} />
          </div>
          <div>
            <label style={lbl}>Аттестат аккредитации (если есть)</label>
            <input style={inp} value={p.accreditation} onChange={set('accreditation')}
              placeholder="RA.RU.XXXXXX" />
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={secTitle}>Протокол и объект</div>
        <div style={grid3}>
          <div>
            <label style={lbl}>Наименование изделия *</label>
            <input style={inp} value={p.objectName} onChange={set('objectName')}
              placeholder="Блок питания БП-4" />
          </div>
          <div>
            <label style={lbl}>№ протокола *</label>
            <input style={inp} value={p.number} onChange={set('number')} placeholder="042-ЭМС/26" />
          </div>
          <div>
            <label style={lbl}>Дата</label>
            <input style={inp} type="date" value={p.date} onChange={set('date')} />
          </div>
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>Обозначение / зав. №</label>
            <input style={inp} value={p.objectId} onChange={set('objectId')} />
          </div>
          <div>
            <label style={lbl}>Заказчик</label>
            <input style={inp} value={p.customer} onChange={set('customer')} />
          </div>
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>Вид испытаний</label>
            <input style={inp} value={p.testType} onChange={set('testType')} />
          </div>
          <div>
            <label style={lbl}>Методика / стандарт</label>
            <input style={inp} value={p.standard} onChange={set('standard')} />
          </div>
        </div>
        <div style={grid2}>
          <div>
            <label style={lbl}>Диапазон / режимы</label>
            <input style={inp} value={p.range} onChange={set('range')} placeholder="30–1000 МГц" />
          </div>
          <div>
            <label style={lbl}>Условия испытаний</label>
            <input style={inp} value={p.conditions} onChange={set('conditions')} />
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ ...secTitle, marginBottom: 0 }}>
            Средства измерений — {p.equipment.length}
          </div>
          <button onClick={pullEquipment} style={btn('transparent', T.accent, T.accent)}>
            Подтянуть из базы с поверками
          </button>
        </div>
        {p.equipment.length === 0 ? (
          <div style={{ fontSize: 13, color: T.textSec }}>
            Список пуст. Нажмите «Подтянуть из базы» — попадут позиции раздела
            «Оборудование» вместе с номерами свидетельств о поверке.
          </div>
        ) : (
          <div style={{ fontSize: 13, color: T.textSec }}>
            {p.equipment.map((e, i) => (
              <div key={i} style={{ padding: '5px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
                {i + 1}. <span style={{ color: T.text }}>{e.name}</span>
                {' · зав. № '}{e.serial}{' · поверка '}{e.cert}{' до '}{e.validUntil}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={card}>
        <div style={secTitle}>Результаты испытаний</div>
        {p.results.map((r, i) => (
          <div key={i} style={{
            display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr 92px 34px',
            gap: 8, marginBottom: 8, alignItems: 'center',
          }}>
            <input style={inp} placeholder="Параметр" value={r.parameter}
              onChange={e => setResult(i, 'parameter', e.target.value)} />
            <input style={inp} placeholder="Норма" value={r.requirement}
              onChange={e => setResult(i, 'requirement', e.target.value)} />
            <input style={inp} placeholder="Измерено" value={r.measured}
              onChange={e => setResult(i, 'measured', e.target.value)} />
            <select
              value={r.verdict}
              onChange={e => setResult(i, 'verdict', e.target.value)}
              style={{ ...inp, fontWeight: 700, color: r.verdict === 'FAIL' ? T.fail : T.pass }}
            >
              <option value="PASS">PASS</option>
              <option value="FAIL">FAIL</option>
            </select>
            <button onClick={() => delResult(i)} title="Удалить строку"
              style={{ ...btn('transparent', T.textSec, T.border), padding: '8px 0' }}>
              ×
            </button>
          </div>
        ))}
        <button onClick={addResult} style={btn('transparent', T.text, T.border)}>
          + Добавить строку
        </button>
      </div>

      <div style={card}>
        <div style={grid2}>
          <div>
            <label style={lbl}>Испытания провёл (ФИО)</label>
            <input style={inp} value={p.engineer} onChange={set('engineer')} />
          </div>
          <div>
            <label style={lbl}>Руководитель лаборатории (ФИО)</label>
            <input style={inp} value={p.chief} onChange={set('chief')} />
          </div>
        </div>
        <div>
          <label style={lbl}>Примечания (раздел 5, необязательно)</label>
          <textarea style={{ ...inp, resize: 'vertical' }} rows={3}
            value={p.notes} onChange={set('notes')} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
        <button onClick={doPreview} style={btn('transparent', T.text, T.border)}>
          Предпросмотр
        </button>
        <button onClick={doExport} disabled={busy} style={{ ...btn(T.accent), opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Открываю печать…' : 'Сохранить в PDF (печать)'}
        </button>
      </div>

      {msg && (
        <div style={{
          ...card,
          borderColor: msg.ok ? T.pass : T.fail,
          color: msg.ok ? T.pass : T.fail,
          fontSize: 13.5,
        }}>
          {msg.text}
        </div>
      )}

      {/* ─── Модальный предпросмотр: iframe внутри приложения, без window.open ─── */}
      {previewHtml && (
        <div
          onMouseDown={(e) => { if (e.target === e.currentTarget) setPreviewHtml(null); }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(2,6,20,0.7)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
        >
          <div style={{
            width: 'min(860px, 96vw)', height: 'min(92vh, 1100px)',
            background: '#fff', borderRadius: 12, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 14px', background: '#0B1224', color: T.text,
              borderBottom: `1px solid ${T.border}`, flexShrink: 0,
            }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>
                Предпросмотр — Протокол № {p.number || '____'}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={doExport} style={{ ...btn(T.accent), padding: '7px 14px', fontSize: 13 }}>
                  Сохранить в PDF
                </button>
                <button onClick={() => setPreviewHtml(null)}
                  style={{ ...btn('transparent', T.text, T.border), padding: '7px 14px', fontSize: 13 }}>
                  Закрыть (Esc)
                </button>
              </div>
            </div>
            <iframe
              title="Предпросмотр протокола"
              srcDoc={previewHtml}
              style={{ flex: 1, border: 'none', width: '100%', background: '#fff' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function btn(bg, color = '#fff', border = 'transparent') {
  return {
    padding: '10px 18px', borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', background: bg, color, border: `1px solid ${border}`,
    fontFamily: 'inherit',
  };
}
