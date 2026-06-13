/**
 * EMC Pro — хранилище и печать (localStorage-only версия).
 *
 * НИКАКИХ зависимостей от Electron: нет IPC, нет window.emc, нет SQLite.
 * Работает одинаково в браузере (npm run dev) и внутри текущего electron.js
 * без каких-либо его изменений.
 *
 * Данные лежат в localStorage под префиксом 'emcdb:' — отдельное пространство
 * имён, существующие ключи приложения не затрагиваются и не перезаписываются.
 * При интеграции можно заменить вызовы store.* на собственные функции проекта —
 * API намеренно маленький: list / get / insert / update / remove / settings.
 */

const LS_PREFIX = 'emcdb:';

function read(table) {
  try { return JSON.parse(localStorage.getItem(LS_PREFIX + table)) || []; }
  catch { return []; }
}
function write(table, rows) {
  localStorage.setItem(LS_PREFIX + table, JSON.stringify(rows));
}
function nextId(rows) {
  return rows.reduce((m, r) => Math.max(m, r.id || 0), 0) + 1;
}

export const store = {
  async list(table) {
    return read(table).sort((a, b) => (b.id || 0) - (a.id || 0));
  },

  async get(table, id) {
    return read(table).find(r => r.id === id) || null;
  },

  async insert(table, row) {
    const rows = read(table);
    const rec = { ...row, id: nextId(rows), created_at: new Date().toISOString() };
    rows.push(rec);
    write(table, rows);
    return rec;
  },

  async update(table, id, patch) {
    const rows = read(table);
    const i = rows.findIndex(r => r.id === id);
    if (i === -1) return null;
    rows[i] = { ...rows[i], ...patch, updated_at: new Date().toISOString() };
    write(table, rows);
    return rows[i];
  },

  async remove(table, id) {
    write(table, read(table).filter(r => r.id !== id));
    return true;
  },

  async getSetting(key) {
    return localStorage.getItem(LS_PREFIX + 'set:' + key);
  },

  async setSetting(key, value) {
    localStorage.setItem(LS_PREFIX + 'set:' + key, String(value));
    return true;
  },

  /**
   * Сводка по поверкам для генератора протоколов.
   * Читает таблицы 'equipment' и 'calibrations' из того же localStorage.
   * При интеграции Codex может заменить тело этой функции чтением
   * существующих структур проекта (раздел «Оборудование» / «Поверка») —
   * формат возврата: [{ name, kind, serial, inventory_no, cert_no, valid_until, calib_status }]
   */
  async calibrationSummary(daysWarn = 30) {
    const eq = read('equipment');
    const cal = read('calibrations');
    const today = new Date();
    const warnDate = new Date(Date.now() + daysWarn * 864e5);
    return eq.map(e => {
      const c = cal
        .filter(c => c.equipment_id === e.id)
        .sort((a, b) => String(b.valid_until || '').localeCompare(String(a.valid_until || '')))[0];
      let calib_status = 'missing';
      if (c?.valid_until) {
        const d = new Date(c.valid_until);
        calib_status = d < today ? 'overdue' : d < warnDate ? 'expiring' : 'actual';
      }
      return { ...e, ...(c || {}), id: e.id, calib_status };
    });
  },
};

// ─── Печать HTML через скрытый iframe (без window.open) ─────────────────────
/**
 * Открывает системный диалог печати для переданного HTML-документа.
 * Пользователь выбирает «Сохранить как PDF» — это и есть экспорт протокола.
 *
 * Работает в текущем electron.js без изменений: window.open не используется,
 * setWindowOpenHandler с action:'deny' печати не мешает.
 */
export function printHtml(html) {
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    // visibility:hidden, а не display:none — иначе часть движков не печатает
    frame.style.cssText =
      'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
    frame.setAttribute('aria-hidden', 'true');
    document.body.appendChild(frame);

    const cleanup = () => {
      // удаляем с запасом: диалог печати модальный, afterprint не везде стреляет
      setTimeout(() => frame.remove(), 60_000);
    };

    frame.onload = () => {
      try {
        const w = frame.contentWindow;
        w.focus();
        w.print();
        resolve({ ok: true });
      } catch (e) {
        resolve({ ok: false, error: 'Не удалось открыть диалог печати: ' + e.message });
      } finally {
        cleanup();
      }
    };

    frame.srcdoc = html;
  });
}

export const exportProtocolPdf = (html) => printHtml(html);
