# EMC Pro — upgrade package v2 (localStorage-only)

Версия для безопасной интеграции: **никаких изменений Electron-архитектуры не требуется и не допускается.**

## Гарантии этой версии / Guarantees

- НЕТ SQLite, НЕТ better-sqlite3, НЕТ нативных модулей
- НЕТ изменений `electron.js` — текущий main-процесс остаётся как есть
- НЕТ изменений `package.json` — ни одной новой зависимости (только React, который уже есть)
- НЕТ `window.open` — печать и предпросмотр работают через iframe, поэтому
  существующий `setWindowOpenHandler({action:'deny'})` ничему не мешает
- НЕТ Electron IPC, НЕТ preload — модули не знают, что они в Electron
- Данные пишутся в localStorage под префиксом `emcdb:` — существующие ключи
  приложения не читаются и не перезаписываются

## Состав / Contents

```
src/
  services/storage.js                     — localStorage-хранилище + печать через iframe
  components/CommandPalette.jsx           — Ctrl+K палитра (без зависимостей)
  features/protocol/ProtocolGenerator.jsx — генератор протокола, предпросмотр в модальном iframe
  features/protocol/protocolTemplate.js   — печатный HTML-шаблон протокола (A4)
  features/spectrum/SpectrumAnalyzer.jsx  — анализатор спектра: CSV, график, PASS/FAIL
  features/spectrum/limits.js             — лимит-линии (демо-значения!) и парсер CSV
```

---

## Инструкция по интеграции (for Codex)

### Constraints (hard)

1. Do NOT modify `electron.js`, `package.json`, `vite.config.js`, `index.html`.
2. Do NOT add npm dependencies.
3. Do NOT touch existing localStorage keys of the app. New modules use their own
   `emcdb:`-prefixed keys via `src/services/storage.js`.
4. Keep all existing application behavior unchanged.

### Step 1 — copy files

Copy the `src/` directory of this package into the project root. It only ADDS
files (`services/`, `components/`, `features/`); nothing existing is overwritten.

### Step 2 — wire pages into App.jsx

Add imports:

```jsx
import SpectrumAnalyzer from './features/spectrum/SpectrumAnalyzer';
import ProtocolGenerator from './features/protocol/ProtocolGenerator';
import CommandPalette, { useCommandPalette } from './components/CommandPalette';
```

Locate the existing page-switching mechanism in App.jsx (state variable that
selects the active sidebar section) and add two pages:

```jsx
{page === 'spectrum' && <SpectrumAnalyzer />}
{page === 'protocol' && <ProtocolGenerator />}
```

Add two sidebar items next to «Журнал»: «Анализатор спектра» and «Протоколы»,
using the same nav-item component/style the sidebar already uses.

### Step 3 — wire Command Palette

Inside the root component:

```jsx
const palette = useCommandPalette();
const commands = [
  // one command per existing sidebar section, using the project's real setter:
  { id:'home',     title:'Главная',            section:'Разделы',     keywords:'home',      action:() => setPage('home') },
  { id:'calc',     title:'Калькуляторы',       section:'Разделы',     keywords:'db dbm',    action:() => setPage('calc') },
  { id:'spectrum', title:'Анализатор спектра', section:'Инструменты', keywords:'csv pass fail', action:() => setPage('spectrum') },
  { id:'protocol', title:'Протокол испытаний → PDF', section:'Инструменты', keywords:'отчёт pdf', action:() => setPage('protocol') },
  // RECOMMENDED: add one command per calculator / test / reference section
];
```

At the end of the root JSX:

```jsx
<CommandPalette {...palette} commands={commands} />
```

Replace `page` / `setPage` with the project's actual state variable and setter.

### Step 4 (optional, recommended) — feed real equipment into protocols

`ProtocolGenerator` calls `store.calibrationSummary()` to fill the
"Средства измерений" table. By default it reads its own (empty) `emcdb:` tables.
To pull the project's real equipment list instead, replace ONLY the body of
`calibrationSummary` in `src/services/storage.js` with code that reads the
project's existing equipment/verification localStorage structures and returns:

```js
[{ name, kind, serial, inventory_no, cert_no, valid_until, calib_status }]
```

This is the single intended adaptation point. Do not modify the components.

### Verification checklist

- `npm run build && npm run electron` — app starts, all old pages work
- Ctrl+K opens the palette, arrows + Enter navigate
- «Протоколы»: fill the form → «Предпросмотр» opens a modal INSIDE the app
  (no new window) → «Сохранить в PDF» opens the system print dialog
- «Анализатор спектра»: button «Демо-данные» renders a chart with a FAIL
  verdict at 142 MHz; drag-and-drop of a two-column CSV works
- Existing journal/equipment data is untouched (different localStorage keys)

---

## Важно для пользователя

- **Лимит-линии в `limits.js` — демонстрационные.** Перед официальными
  измерениями внесите точные уровни из ваших рабочих стандартов. Пользовательская
  линия задаётся прямо в интерфейсе.
- Экспорт PDF идёт через системный диалог печати: выберите принтер
  «Сохранить как PDF» / «Microsoft Print to PDF».
- Кнопка «Записать в журнал» в анализаторе спектра пишет в собственные
  `emcdb:`-таблицы пакета. Привязка к существующему журналу приложения —
  отдельная задача после стабилизации (или этап SQLite позже).
