import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { cn } from './ui';

export default function ColoredSelect({ value, onChange, onBlur, groups, options, placeholder = '— 선택 —', className, autoFocus = false }) {
  const [open, setOpen] = useState(autoFocus);
  const containerRef = useRef(null);
  const listRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target) &&
          listRef.current && !listRef.current.contains(e.target)) {
        setOpen(false);
        onBlur && onBlur();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onBlur]);

  useEffect(() => {
    if (open && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropUp = spaceBelow < 220 && rect.top > 220;
      setDropdownStyle({
        left: rect.left,
        width: Math.max(rect.width, 180),
        ...(dropUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
      });
    }
    if (open && listRef.current) {
      const active = listRef.current.querySelector("[data-active='true']");
      if (active) active.scrollIntoView({ block: 'nearest' });
    }
  }, [open]);

  function handleSelect(val) {
    onChange(val);
    setOpen(false);
    onBlur && onBlur();
  }

  const selectedOption = findOption(value, groups, options);

  const listContent = (
    <div
      ref={listRef}
      className="fixed z-[9999] max-h-52 min-w-[180px] overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
      style={dropdownStyle}
    >
      <button type="button" onClick={() => handleSelect('')}
        className="flex w-full items-center px-2.5 py-1.5 text-[12px] text-slate-400 hover:bg-slate-50 transition-colors">
        {placeholder}
      </button>
      {groups ? groups.map(group => (
        <div key={group.label}>
          <div className="sticky top-0 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: group.labelColor || '#94a3b8' }}>
            {group.label}
          </div>
          {group.options.map(opt => {
            const o = typeof opt === 'string' ? { value: opt } : opt;
            return (
              <button key={o.value} type="button" data-active={o.value === value}
                onClick={() => handleSelect(o.value)}
                className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 text-[12px] transition-colors',
                  o.value === value ? 'bg-blue-50 font-medium' : 'hover:bg-slate-50')}>
                {o.dotColor && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: o.dotColor }} />}
                <span style={{ color: o.textColor }}>{o.label || o.value}</span>
              </button>
            );
          })}
        </div>
      )) : options ? options.map(opt => {
        const o = typeof opt === 'string' ? { value: opt } : opt;
        return (
          <button key={o.value} type="button" data-active={o.value === value}
            onClick={() => handleSelect(o.value)}
            className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 text-[12px] transition-colors',
              o.value === value ? 'bg-blue-50 font-medium' : 'hover:bg-slate-50')}>
            {o.dotColor && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: o.dotColor }} />}
            <span style={{ color: o.textColor }}>{o.label || o.value}</span>
          </button>
        );
      }) : null}
    </div>
  );

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-1.5 rounded-md border border-blue-300 bg-white px-2 py-1 text-left text-[12px] outline-none focus:ring-2 focus:ring-blue-200 transition-shadow">
        {selectedOption ? (
          <span className="flex items-center gap-1.5 truncate">
            {selectedOption.dotColor && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: selectedOption.dotColor }} />}
            <span style={{ color: selectedOption.textColor }}>{selectedOption.label || selectedOption.value}</span>
          </span>
        ) : (
          <span className="text-slate-400">{placeholder}</span>
        )}
        <svg className="ml-auto h-3 w-3 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && ReactDOM.createPortal(listContent, document.body)}
    </div>
  );
}

function findOption(value, groups, options) {
  if (!value) return null;
  if (groups) {
    for (const g of groups) {
      for (const opt of g.options) {
        const o = typeof opt === 'string' ? { value: opt } : opt;
        if (o.value === value) return o;
      }
    }
  }
  if (options) {
    for (const opt of options) {
      const o = typeof opt === 'string' ? { value: opt } : opt;
      if (o.value === value) return o;
    }
  }
  return null;
}
