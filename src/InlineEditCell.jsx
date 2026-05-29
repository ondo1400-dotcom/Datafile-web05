import React, { useState, useEffect, useRef } from 'react';
import StageBadge from './StageBadge';
import ColoredSelect from './ColoredSelect';
import { getTmStatusGroups, getTMDotColor, getSelectOptions, DAYS_OF_WEEK, TM_STATUS_GROUPS } from './selectOptions';
import { formatDateShort } from './columnConfig';

export default function InlineEditCell({
  rowId, field, value, columnDef = {}, selectOptions = [], tmStatusGroups = [], onSaved, badgeType,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => { setEditValue(value); }, [value]);

  const { type = 'text', readonly = false } = columnDef;

  if (readonly) return <DisplayValue value={value} type={type} badgeType={badgeType} />;

  const handleSave = async (newValue) => {
    setIsSaving(true);
    try {
      await saveField(rowId, field, newValue);
      setIsEditing(false);
      if (onSaved) onSaved(rowId, field, newValue);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => { setEditValue(value); setIsEditing(false); };
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleCancel();
    if (e.key === 'Enter' && type !== 'textarea') handleSave(editValue);
  };

  if (!isEditing) {
    return (
      <div onClick={e => e.stopPropagation()}>
        <button onClick={() => { setEditValue(value); setIsEditing(true); }} title="클릭하여 수정"
          className="group/cell flex w-full cursor-pointer items-center rounded px-1 py-0.5 text-left hover:bg-blue-50/30 transition-colors">
          <DisplayValue value={value} type={type} badgeType={badgeType} />
          <span className="shrink-0 ml-1 w-3 text-center text-[10px] text-blue-400 opacity-0 group-hover/cell:opacity-100 transition-opacity">✎</span>
        </button>
        {isSaving && <div className="mt-0.5 text-[10px] text-slate-400">저장중...</div>}
      </div>
    );
  }

  const inputCls = 'rounded-md border border-blue-300 bg-white px-2 py-1 text-[12px] outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 w-full transition-shadow';

  if (field === 'TM현재상태') {
    return (
      <div className="min-w-[100px]" onClick={e => e.stopPropagation()}>
        <ColoredSelect value={editValue || ''} onChange={v => { setEditValue(v); handleSave(v || null); }}
          onBlur={handleCancel} groups={getTmStatusGroups()} autoFocus />
        {isSaving && <div className="mt-0.5 text-[10px] text-slate-400">저장중...</div>}
      </div>
    );
  }

  if (type === 'select') {
    return (
      <div onClick={e => e.stopPropagation()}>
        <select className={inputCls} value={editValue || ''} onChange={e => handleSave(e.target.value || null)}
          onBlur={handleCancel} onKeyDown={handleKeyDown} autoFocus>
          <option value="">— 선택 —</option>
          {selectOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </div>
    );
  }

  if (type === 'date') {
    return (
      <div onClick={e => e.stopPropagation()}>
        <input type="date" className={inputCls}
          value={editValue ? new Date(editValue).toISOString().split('T')[0] : ''}
          onChange={e => setEditValue(e.target.value)}
          onBlur={() => handleSave(editValue ? new Date(editValue).toISOString() : null)}
          onKeyDown={handleKeyDown} autoFocus />
      </div>
    );
  }

  if (type === 'time') {
    return (
      <div onClick={e => e.stopPropagation()}>
        <input type="time" className={inputCls} value={editValue || ''}
          onChange={e => setEditValue(e.target.value)} onBlur={() => handleSave(editValue || null)}
          onKeyDown={handleKeyDown} autoFocus />
      </div>
    );
  }

  if (type === 'number') {
    return (
      <div onClick={e => e.stopPropagation()}>
        <input type="number" className={inputCls} value={editValue || ''}
          onChange={e => setEditValue(e.target.value ? parseInt(e.target.value) : null)}
          onBlur={() => handleSave(editValue != null ? editValue : null)}
          onKeyDown={handleKeyDown} autoFocus />
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="min-w-[100px]" onClick={e => e.stopPropagation()}>
        <textarea className={inputCls + ' resize-none'} value={editValue || ''} rows={2}
          onChange={e => setEditValue(e.target.value)} onKeyDown={handleKeyDown} autoFocus />
        <div className="flex gap-1 mt-1">
          <button onClick={() => handleSave(editValue || null)} disabled={isSaving}
            className="rounded-md bg-blue-500 px-2 py-0.5 text-xs text-white hover:bg-blue-600 disabled:opacity-50 transition-colors">
            {isSaving ? '저장중' : '저장'}
          </button>
          <button onClick={handleCancel}
            className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100 transition-colors">
            취소
          </button>
        </div>
      </div>
    );
  }

  if (type === 'dayselect') {
    const daysArray = Array.isArray(editValue) ? editValue : [];
    return (
      <div onClick={e => e.stopPropagation()}>
        <div className="flex gap-1 flex-wrap">
          {DAYS_OF_WEEK.map(day => (
            <label key={day} className="flex items-center gap-1 text-[11px] cursor-pointer">
              <input type="checkbox" checked={daysArray.includes(day)}
                onChange={e => setEditValue(e.target.checked ? [...daysArray, day] : daysArray.filter(d => d !== day))} />
              {day}
            </label>
          ))}
        </div>
        <div className="flex gap-1 mt-1">
          <button onClick={() => handleSave(editValue)} className="rounded-md bg-blue-500 px-2 py-0.5 text-xs text-white hover:bg-blue-600">저장</button>
          <button onClick={handleCancel} className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-100">취소</button>
        </div>
      </div>
    );
  }

  return (
    <div onClick={e => e.stopPropagation()}>
      <input type="text" className={inputCls} value={editValue || ''}
        onChange={e => setEditValue(e.target.value)} onBlur={() => handleSave(editValue || null)}
        onKeyDown={handleKeyDown} autoFocus />
      {isSaving && <div className="mt-0.5 text-[10px] text-slate-400">저장중...</div>}
    </div>
  );
}

function DisplayValue({ value, type, badgeType }) {
  if (value == null || value === '') return <span className="text-slate-200 text-[12px]">—</span>;
  if (badgeType) return <StageBadge value={String(value)} type={badgeType} />;
  if (type === 'date') return <span className="text-[11px] text-slate-500 whitespace-nowrap">{formatDateShort(value)}</span>;
  if (type === 'time') {
    const s = String(value);
    const tIdx = s.indexOf('T');
    const hhmm = tIdx !== -1 ? s.slice(tIdx + 1, tIdx + 6) : s.match(/\d{1,2}:\d{2}/)?.[0] || s.slice(0, 5);
    return <span className="text-[11px] text-slate-500 whitespace-nowrap">{hhmm}</span>;
  }
  if (type === 'number') return <span className="text-[12px] tabular-nums">{value}</span>;
  if (type === 'dayselect' && Array.isArray(value)) return <span className="text-[12px]">{value.join('')}</span>;
  if (type === 'checklist' && Array.isArray(value)) return <span className="text-[12px]">{value.length > 0 ? `${value.length}개` : '—'}</span>;
  return <span className="text-[12px] text-slate-800 whitespace-nowrap overflow-hidden text-ellipsis">{String(value)}</span>;
}

async function saveField(rowId, field, value) {
  if (typeof window.USE_SAMPLE !== 'undefined' && window.USE_SAMPLE) {
    const row = (window.STATE?.dbFindings || []).find(r => r.id === rowId || r.__rowIndex === rowId);
    if (row) row[field] = value;
    return;
  }
  const updateObj = {};
  updateObj[field] = value || null;
  const { error } = await window.SUPA.from('db_findings').update(updateObj).eq('id', rowId);
  if (error) throw new Error(error.message);
}
