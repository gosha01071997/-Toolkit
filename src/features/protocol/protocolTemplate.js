/**
 * EMC Pro — печатный шаблон протокола испытаний (A4).
 *
 * Генерирует автономный HTML-документ: типографика под печать, чёрный по белому,
 * таблицы с тонкими линейками — как принято в протоколах испытательных
 * лабораторий. Поля страницы задаются при печати (main.js → printToPDF).
 *
 * Структура соответствует типовой форме протокола: шапка организации,
 * сведения об объекте, методике и условиях, перечень СИ с поверками,
 * результаты, заключение, подписи.
 */

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const fmtDate = (iso) => {
  if (!iso) return '«___» __________ 20__ г.';
  const [y, m, d] = iso.split('-');
  const months = ['января','февраля','марта','апреля','мая','июня',
    'июля','августа','сентября','октября','ноября','декабря'];
  return `«${d}» ${months[+m - 1]} ${y} г.`;
};

export function renderProtocolHtml(p) {
  const rows = (p.results || []).map((r, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td>${esc(r.parameter)}</td>
      <td class="mono">${esc(r.requirement)}</td>
      <td class="mono">${esc(r.measured)}</td>
      <td class="verdict ${r.verdict === 'FAIL' ? 'fail' : 'pass'}">${esc(r.verdict || '—')}</td>
    </tr>`).join('');

  const equip = (p.equipment || []).map((e, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td>${esc(e.name)}</td>
      <td class="mono">${esc(e.serial)}</td>
      <td class="mono">${esc(e.cert)}</td>
      <td class="mono">${esc(e.validUntil)}</td>
    </tr>`).join('');

  const overallFail = (p.results || []).some(r => r.verdict === 'FAIL');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>Протокол испытаний № ${esc(p.number)}</title>
<style>
  @page { size: A4; }
  * { box-sizing: border-box; }
  body {
    font-family: 'Times New Roman', 'PT Serif', serif;
    font-size: 12pt; line-height: 1.45; color: #000;
    margin: 0; padding: 0 4mm;
  }
  .org { text-align: center; font-size: 11pt; }
  .org .name { font-weight: bold; font-size: 12pt; }
  .org .accred { font-size: 10pt; margin-top: 2mm; }
  hr.head { border: none; border-top: 1.6pt solid #000; margin: 3mm 0 5mm; }
  h1 {
    text-align: center; font-size: 14pt; margin: 6mm 0 1mm;
    text-transform: uppercase; letter-spacing: 0.4pt;
  }
  .docno { text-align: center; font-size: 12pt; margin-bottom: 6mm; }
  h2 {
    font-size: 12pt; margin: 6mm 0 2mm;
  }
  table { width: 100%; border-collapse: collapse; margin: 2mm 0 4mm; }
  th, td { border: 0.6pt solid #000; padding: 1.6mm 2.2mm; font-size: 10.5pt; vertical-align: top; }
  th { font-weight: bold; text-align: center; background: #f2f2f2; }
  td.num { width: 8mm; text-align: center; }
  td.mono { font-family: 'Courier New', monospace; font-size: 10pt; }
  td.verdict { width: 22mm; text-align: center; font-weight: bold; }
  td.verdict.fail { color: #000; }
  .kv { margin: 1mm 0; }
  .kv b { display: inline-block; min-width: 52mm; font-weight: normal; }
  .kv span { font-weight: bold; }
  .conclusion {
    border: 1pt solid #000; padding: 3mm 4mm; margin: 5mm 0;
    font-weight: bold; text-align: justify;
  }
  .sig { margin-top: 12mm; width: 100%; }
  .sig td { border: none; padding: 2mm 0; font-size: 11pt; }
  .sig .line { border-bottom: 0.6pt solid #000; width: 50mm; display: inline-block; }
  .sig .hint { font-size: 8.5pt; color: #444; text-align: center; }
  .foot { margin-top: 8mm; font-size: 9pt; color: #444; }
  .nobreak { page-break-inside: avoid; }
</style>
</head>
<body>

<div class="org">
  <div class="name">${esc(p.orgName || 'Наименование организации / испытательной лаборатории')}</div>
  <div>${esc(p.orgAddress || 'Адрес, телефон, e-mail')}</div>
  ${p.accreditation ? `<div class="accred">Аттестат аккредитации: ${esc(p.accreditation)}</div>` : ''}
</div>
<hr class="head">

<h1>Протокол испытаний</h1>
<div class="docno">№ ${esc(p.number || '____')} от ${fmtDate(p.date)}</div>

<h2>1. Сведения об объекте испытаний</h2>
<div class="kv"><b>Наименование изделия:</b> <span>${esc(p.objectName)}</span></div>
<div class="kv"><b>Обозначение / зав. №:</b> <span>${esc(p.objectId || '—')}</span></div>
<div class="kv"><b>Заказчик:</b> <span>${esc(p.customer || '—')}</span></div>

<h2>2. Вид испытаний и нормативная база</h2>
<div class="kv"><b>Вид испытаний:</b> <span>${esc(p.testType)}</span></div>
<div class="kv"><b>Методика / стандарт:</b> <span>${esc(p.standard)}</span></div>
<div class="kv"><b>Диапазон / режимы:</b> <span>${esc(p.range || '—')}</span></div>
<div class="kv"><b>Условия испытаний:</b> <span>${esc(p.conditions || 'нормальные климатические условия')}</span></div>

<div class="nobreak">
<h2>3. Применённые средства измерений и испытательное оборудование</h2>
<table>
  <tr><th style="width:8mm">№</th><th>Наименование, тип</th><th style="width:28mm">Зав. №</th>
      <th style="width:32mm">Свид. о поверке</th><th style="width:26mm">Действ. до</th></tr>
  ${equip || '<tr><td class="num">—</td><td colspan="4">не заполнено</td></tr>'}
</table>
</div>

<div class="nobreak">
<h2>4. Результаты испытаний</h2>
<table>
  <tr><th style="width:8mm">№</th><th>Проверяемый параметр</th><th style="width:36mm">Требование (норма)</th>
      <th style="width:36mm">Измерено</th><th style="width:22mm">Вердикт</th></tr>
  ${rows || '<tr><td class="num">—</td><td colspan="4">не заполнено</td></tr>'}
</table>
</div>

${p.notes ? `<h2>5. Примечания</h2><div>${esc(p.notes)}</div>` : ''}

<div class="conclusion nobreak">
  ЗАКЛЮЧЕНИЕ: объект испытаний «${esc(p.objectName)}»
  ${overallFail
    ? 'НЕ СООТВЕТСТВУЕТ требованиям ' + esc(p.standard) + ' по позициям, отмеченным «FAIL».'
    : 'СООТВЕТСТВУЕТ требованиям ' + esc(p.standard) + '.'}
</div>

<table class="sig nobreak">
  <tr>
    <td style="width:45%">Испытания провёл:<br><br>
      <span class="line"></span>&nbsp;&nbsp;/ ${esc(p.engineer || '_______________')} /
      <div class="hint" style="width:50mm">(подпись)</div>
    </td>
    <td>Руководитель лаборатории:<br><br>
      <span class="line"></span>&nbsp;&nbsp;/ ${esc(p.chief || '_______________')} /
      <div class="hint" style="width:50mm">(подпись)</div>
    </td>
  </tr>
</table>

<div class="foot">
  Протокол распространяется только на объект, подвергнутый испытаниям.
  Частичная перепечатка протокола без разрешения лаборатории не допускается.
  Сформировано в EMC Pro.
</div>

</body>
</html>`;
}
