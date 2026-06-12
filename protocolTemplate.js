/**
 * EMC Pro — Command Palette (Ctrl+K / Cmd+K).
 *
 * Глобальный поиск-навигация в стиле VS Code / Linear: открывается поверх
 * приложения, фильтрует команды по подстрокам, управляется с клавиатуры.
 *
 * Подключение в App.jsx (внутри AppInner):
 *
 *   import CommandPalette, { useCommandPalette } from './components/CommandPalette';
 *
 *   const palette = useCommandPalette();
 *   const commands = [
 *     { id:'home',  title:'Главная',           section:'Разделы', keywords:'home main', action:() => setPage('home') },
 *     { id:'calc',  title:'Калькуляторы',      section:'Разделы', keywords:'расчёт db dbm', action:() => setPage('calc') },
 *     { id:'spec',  title:'Анализатор спектра',section:'Инструменты', keywords:'csv график лимит', action:() => setPage('spectrum') },
 *     { id:'prot',  title:'Протокол испытаний → PDF', section:'Инструменты', keywords:'отчёт pdf', action:() => setPage('protocol') },
 *     // + по команде на каждый калькулятор, испытание, раздел справочника
 *   ];
 *   ...
 *   <CommandPalette {...palette} commands={commands} />
 *
 * Зависимостей нет.
 */
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(v => !v);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return { open, setOpen };
}

const T = {
  overlay: 'rgba(2,6,20,0.62)',
  panel: 'rgba(10,16,32,0.97)',
  border: 'rgba(148,163,184,0.16)',
  text: '#E6EDF7',
  textSec: '#8A9BB8',
  accent: '#4A9FFF',
  hl: 'rgba(74,159,255,0.14)',
  mono: "'JetBrains Mono','SF Mono',Consolas,monospace",
};

/** Простой скоринг: все слова запроса должны входить в title+keywords. */
function match(cmd, query) {
  if (!query) return 1;
  const hay = (cmd.title + ' ' + (cmd.keywords || '') + ' ' + (cmd.section || '')).toLowerCase();
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  let score = 0;
  for (const w of words) {
    const i = hay.indexOf(w);
    if (i === -1) return 0;
    score += i === 0 ? 3 : hay[i - 1] === ' ' ? 2 : 1; // совпадение с начала слова ценнее
  }
  return score;
}

export default function CommandPalette({ open, setOpen, commands = [] }) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = useMemo(() => {
    const scored = commands
      .map(c => ({ c, s: match(c, query) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s);
    return scored.map(x => x.c).slice(0, 14);
  }, [commands, query]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // фокус после рендера
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => { setActive(0); }, [query]);

  const run = useCallback((cmd) => {
    setOpen(false);
    // дать оверлею закрыться до тяжёлой навигации
    setTimeout(() => cmd.action?.(), 0);
  }, [setOpen]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive(a => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(a => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && filtered[active]) {
      e.preventDefault();
      run(filtered[active]);
    }
  };

  // прокрутка к активному элементу
  useEffect(() => {
    const el = listRef.current?.children?.[active];
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  // группировка по секциям с сохранением порядка скоринга
  let lastSection = null;

  return (
    <div
      onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, background: T.overlay,
        display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
        paddingTop: '12vh', backdropFilter: 'blur(3px)',
      }}
    >
      <div
        role="dialog" aria-modal="true" aria-label="Поиск по приложению"
        style={{
          width: 'min(620px, 92vw)', background: T.panel,
          border: `1px solid ${T.border}`, borderRadius: 14,
          boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
          overflow: 'hidden', fontFamily: "'Inter',sans-serif",
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 14px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ color: T.textSec, fontSize: 15 }}>⌕</span>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Команда, калькулятор, раздел…"
            style={{
              flex: 1, padding: '13px 0', fontSize: 15, background: 'transparent',
              border: 'none', outline: 'none', color: T.text, fontFamily: 'inherit',
            }}
          />
          <kbd style={{
            fontFamily: T.mono, fontSize: 10.5, color: T.textSec,
            border: `1px solid ${T.border}`, borderRadius: 5, padding: '2px 6px',
          }}>Esc</kbd>
        </div>

        <div ref={listRef} style={{ maxHeight: '52vh', overflowY: 'auto', padding: '6px 0 8px' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '22px 16px', color: T.textSec, fontSize: 13.5 }}>
              Ничего не найдено по запросу «{query}».
            </div>
          )}
          {filtered.map((cmd, i) => {
            const showSection = cmd.section !== lastSection;
            lastSection = cmd.section;
            return (
              <React.Fragment key={cmd.id}>
                {showSection && cmd.section && (
                  <div style={{
                    padding: '8px 16px 4px', fontSize: 10.5, fontWeight: 700,
                    letterSpacing: 1, textTransform: 'uppercase', color: T.textSec,
                  }}>
                    {cmd.section}
                  </div>
                )}
                <div
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); run(cmd); }}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 16px', cursor: 'pointer', fontSize: 14, color: T.text,
                    background: i === active ? T.hl : 'transparent',
                    borderLeft: i === active ? `2px solid ${T.accent}` : '2px solid transparent',
                  }}
                >
                  <span>{cmd.title}</span>
                  {cmd.hint && (
                    <span style={{ fontFamily: T.mono, fontSize: 11, color: T.textSec }}>
                      {cmd.hint}
                    </span>
                  )}
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div style={{
          padding: '8px 16px', borderTop: `1px solid ${T.border}`,
          fontSize: 11, color: T.textSec, display: 'flex', gap: 14,
        }}>
          <span>↑↓ — выбор</span>
          <span>Enter — открыть</span>
          <span>Ctrl+K — закрыть</span>
        </div>
      </div>
    </div>
  );
}
