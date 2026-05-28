import React, { useState, useEffect, useRef } from 'react';
import { getTMDotColor, getTMStatusGroup, DAYS_OF_WEEK } from './selectOptions';
import { TM_STATUS_GROUPS } from './selectOptions';

/**
 * Inline editable cell component
 * Handles different field types: text, number, date, time, textarea, select, dayselect
 *
 * @param {string} rowId - Supabase row ID
 * @param {string} field - Field key (Korean field names)
 * @param {*} value - Current value
 * @param {Object} columnDef - Column definition { key, label, type, width, readonly, options }
 * @param {Array} selectOptions - Options for select type
 * @param {Array} tmStatusGroups - Grouped select options for TM status
 * @param {Function} onSaved - Callback(rowId, field, newValue) after successful save
 */
export default function InlineEditCell({
  rowId,
  field,
  value,
  columnDef = {},
  selectOptions = [],
  tmStatusGroups = [],
  onSaved,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);

  const { type = 'text', readonly = false } = columnDef;

  if (readonly) {
    return <div className="nt-edit-trigger">{formatDisplay(value, type)}</div>;
  }

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

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleCancel();
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave(editValue);
    }
  };

  if (!isEditing) {
    return (
      <div
        className="nt-edit-trigger"
        onClick={() => {
          setEditValue(value);
          setIsEditing(true);
        }}
      >
        {field === 'TM현재상태' && value && (
          <span
            style={{
              display: 'inline-block',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: getTMDotColor(value),
              marginRight: '6px',
            }}
          />
        )}
        {formatDisplay(value, type)}
        {!readonly && <span className="nt-edit-pencil">✏️</span>}
      </div>
    );
  }

  // Editing mode
  switch (type) {
    case 'select':
      if (field === 'TM현재상태' && tmStatusGroups.length > 0) {
        return (
          <select
            className="nt-edit-select"
            value={editValue || ''}
            onChange={(e) => handleSave(e.target.value || null)}
            onBlur={handleCancel}
            onKeyDown={handleKeyDown}
            autoFocus
          >
            <option value="">— 선택 —</option>
            {tmStatusGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        );
      }
      return (
        <select
          className="nt-edit-select"
          value={editValue || ''}
          onChange={(e) => handleSave(e.target.value || null)}
          onBlur={handleCancel}
          onKeyDown={handleKeyDown}
          autoFocus
        >
          <option value="">— 선택 —</option>
          {selectOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case 'date':
      return (
        <input
          type="date"
          className="nt-edit-input"
          value={editValue ? new Date(editValue).toISOString().split('T')[0] : ''}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleSave(editValue ? new Date(editValue).toISOString() : null)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      );

    case 'time':
      return (
        <input
          type="time"
          className="nt-edit-input"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleSave(editValue || null)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      );

    case 'number':
      return (
        <input
          type="number"
          className="nt-edit-input"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value ? parseInt(e.target.value) : null)}
          onBlur={() => handleSave(editValue !== null ? editValue : null)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      );

    case 'textarea':
      return (
        <div>
          <textarea
            className="nt-edit-textarea"
            value={editValue || ''}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <div className="nt-edit-actions">
            <button
              onClick={() => handleSave(editValue || null)}
              disabled={isSaving}
            >
              {isSaving ? '저장중...' : '저장'}
            </button>
            <button onClick={handleCancel} disabled={isSaving}>
              취소
            </button>
          </div>
        </div>
      );

    case 'dayselect':
      const daysArray = Array.isArray(editValue) ? editValue : [];
      return (
        <div>
          {DAYS_OF_WEEK.map((day) => (
            <label key={day} className="nt-filter-checkbox">
              <input
                type="checkbox"
                checked={daysArray.includes(day)}
                onChange={(e) => {
                  const newDays = e.target.checked
                    ? [...daysArray, day]
                    : daysArray.filter((d) => d !== day);
                  setEditValue(newDays);
                }}
              />
              {day}
            </label>
          ))}
          <div className="nt-edit-actions">
            <button onClick={() => handleSave(editValue)}>저장</button>
            <button onClick={handleCancel}>취소</button>
          </div>
        </div>
      );

    case 'checklist':
      // Checklist editing handled elsewhere
      return <div className="nt-edit-trigger">{formatDisplay(value, type)}</div>;

    case 'review':
      // Review handled elsewhere
      return <div className="nt-edit-trigger">{formatDisplay(value, type)}</div>;

    default:
      return (
        <input
          type="text"
          className="nt-edit-input"
          value={editValue || ''}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => handleSave(editValue || null)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
      );
  }
}

/**
 * Format value for display
 */
function formatDisplay(value, type) {
  if (value === null || value === undefined || value === '') {
    return <span style={{ color: '#9ca3af' }}>—</span>;
  }

  if (type === 'date') {
    return new Date(value).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).replace(/\./g, '/').replace(/\/\s*$/, '');
  }

  if (type === 'dayselect' && Array.isArray(value)) {
    return value.join('');
  }

  if (type === 'checklist' && Array.isArray(value)) {
    return value.length > 0 ? `${value.length}개` : '—';
  }

  return String(value);
}

/**
 * Save field value to Supabase or sample state
 */
async function saveField(rowId, field, value) {
  if (typeof window.USE_SAMPLE !== 'undefined' && window.USE_SAMPLE) {
    // Sample mode: update STATE directly
    const row = (window.STATE?.dbFindings || []).find(
      (r) => r.id === rowId || r.__rowIndex === rowId
    );
    if (row) row[field] = value;
    return;
  }

  const updateObj = {};
  updateObj[field] = value || null;
  const { error } = await window.SUPA.from('db_findings')
    .update(updateObj)
    .eq('id', rowId);

  if (error) throw new Error(error.message);
}
