import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Popover from './Popover';
import InlineEditCell from './InlineEditCell';
import {
  STAGE_COLORS,
  REGION_COLORS,
  STAGE_ORDER,
  REGION_ORDER,
  getStorageKey,
  getCustomSortIndex,
  formatDateShort,
} from './columnConfig';
import { getSelectOptions } from './selectOptions';

/**
 * NotionTable - Advanced data table with filtering, sorting, freezing, resizing, reordering
 *
 * @param {Array} data - Row objects (Korean keys)
 * @param {Array} columns - Column definitions
 * @param {string} tableType - 'board' | 'db' for localStorage key
 * @param {number} pageSize - Rows per page
 * @param {Function} onFieldSaved - Callback(rowId, field, value) after save
 * @param {Function} onRowClick - Callback(row) when row clicked
 * @param {Function} onRefresh - Callback() refresh button
 * @param {Object} selectOptions - Dynamic select options from admin
 * @param {Array} tmStatusGroups - TM status groups
 * @param {ReactNode} statsCards - Optional stats above table
 * @param {Function} renderReviewCell - Optional function(row) => React element
 * @param {Array} searchFields - Fields to search across
 */
export default function NotionTable({
  data = [],
  columns = [],
  tableType = 'board',
  pageSize = 50,
  onFieldSaved,
  onRowClick,
  onRefresh,
  selectOptions: dynamicSelectOptions = {},
  tmStatusGroups = [],
  statsCards,
  renderReviewCell,
  searchFields = [],
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [sorts, setSorts] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(getStorageKey(tableType));
    if (saved) {
      const prefs = JSON.parse(saved);
      return prefs.visibleColumns || columns.map((c) => c.key);
    }
    return columns.map((c) => c.key);
  });
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem(getStorageKey(tableType));
    if (saved) {
      const prefs = JSON.parse(saved);
      return prefs.columnOrder || columns.map((c) => c.key);
    }
    return columns.map((c) => c.key);
  });
  const [frozenCount, setFrozenCount] = useState(() => {
    const saved = localStorage.getItem(getStorageKey(tableType));
    if (saved) {
      const prefs = JSON.parse(saved);
      return prefs.frozenCount || 0;
    }
    return 0;
  });
  const [colWidths, setColWidths] = useState(() => {
    const saved = localStorage.getItem(getStorageKey(tableType));
    if (saved) {
      const prefs = JSON.parse(saved);
      return prefs.colWidths || {};
    }
    return {};
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [dragSourceKey, setDragSourceKey] = useState(null);
  const [dragResizeCol, setDragResizeCol] = useState(null);
  const [dragStartX, setDragStartX] = useState(0);

  // Save preferences to localStorage
  const savePrefs = () => {
    const prefs = {
      visibleColumns,
      columnOrder,
      frozenCount,
      colWidths,
    };
    localStorage.setItem(getStorageKey(tableType), JSON.stringify(prefs));
  };

  useEffect(() => {
    savePrefs();
  }, [visibleColumns, columnOrder, frozenCount, colWidths]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) => {
        return searchFields.some((field) => {
          const val = row[field];
          return val && String(val).toLowerCase().includes(term);
        });
      });
    }

    // Apply filters
    Object.entries(filters).forEach(([field, filterObj]) => {
      if (!filterObj) return;
      result = applyFieldFilter(result, field, filterObj);
    });

    // Apply sorts
    if (sorts.length > 0) {
      result = result.sort((a, b) => {
        for (const sort of sorts) {
          const colDef = columns.find((c) => c.key === sort.field);
          let aVal = a[sort.field];
          let bVal = b[sort.field];

          // Custom sort for stages and regions
          if (['단계', '구분', '실적지역'].includes(sort.field)) {
            const aIdx = getCustomSortIndex(columns, sort.field, aVal);
            const bIdx = getCustomSortIndex(columns, sort.field, bVal);
            if (aIdx !== bIdx) {
              return sort.dir === 'asc' ? aIdx - bIdx : bIdx - aIdx;
            }
            continue;
          }

          // Null handling
          if (aVal == null && bVal == null) continue;
          if (aVal == null) return sort.dir === 'asc' ? 1 : -1;
          if (bVal == null) return sort.dir === 'asc' ? -1 : 1;

          // Type-based comparison
          if (colDef?.type === 'number') {
            aVal = parseFloat(aVal) || 0;
            bVal = parseFloat(bVal) || 0;
          } else if (colDef?.type === 'date') {
            aVal = new Date(aVal).getTime();
            bVal = new Date(bVal).getTime();
          } else {
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
          }

          if (aVal !== bVal) {
            return sort.dir === 'asc' ? (aVal < bVal ? -1 : 1) : aVal > bVal ? -1 : 1;
          }
        }
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, filters, sorts, searchFields, columns]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const visibleCols = columnOrder
    .filter((key) => visibleColumns.includes(key))
    .map((key) => columns.find((c) => c.key === key))
    .filter(Boolean);

  const handleSort = (field, direction) => {
    if (!direction) {
      setSorts((prev) => prev.filter((s) => s.field !== field));
    } else {
      setSorts((prev) => {
        const existing = prev.find((s) => s.field === field);
        if (existing) {
          return prev.map((s) =>
            s.field === field ? { ...s, dir: direction } : s
          );
        }
        return [...prev, { field, dir: direction }];
      });
    }
  };

  const handleDragStart = (e, colKey) => {
    setDragSourceKey(colKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetKey) => {
    e.preventDefault();
    if (!dragSourceKey || dragSourceKey === targetKey) {
      setDragSourceKey(null);
      return;
    }

    const newOrder = [...columnOrder];
    const sourceIdx = newOrder.indexOf(dragSourceKey);
    const targetIdx = newOrder.indexOf(targetKey);
    [newOrder[sourceIdx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[sourceIdx]];
    setColumnOrder(newOrder);
    setDragSourceKey(null);
  };

  const handleResizeStart = (e, colKey) => {
    setDragResizeCol(colKey);
    setDragStartX(e.clientX);
    e.preventDefault();
  };

  useEffect(() => {
    if (!dragResizeCol) return;

    const handleMouseMove = (e) => {
      const delta = e.clientX - dragStartX;
      setColWidths((prev) => {
        const col = columns.find((c) => c.key === dragResizeCol);
        const currentWidth = prev[dragResizeCol] || col?.width || 100;
        return {
          ...prev,
          [dragResizeCol]: Math.max(50, currentWidth + delta),
        };
      });
      setDragStartX(e.clientX);
    };

    const handleMouseUp = () => {
      setDragResizeCol(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragResizeCol, dragStartX, columns]);

  return (
    <div className="nt-wrapper">
      {statsCards && <div style={{ marginBottom: '20px' }}>{statsCards}</div>}

      {/* Search */}
      <div className="nt-search-wrap">
        <svg className="nt-search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
          <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="2" />
          <path d="M10 10l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          className="nt-search-input"
          type="text"
          placeholder="이름, 전화번호로 검색..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Toolbar */}
      <div className="nt-toolbar">
        <button className="nt-toolbar-btn">
          <span>필터</span>
          {Object.keys(filters).some((k) => filters[k]) && (
            <span className="nt-badge-filter-count">{Object.keys(filters).filter((k) => filters[k]).length}</span>
          )}
        </button>

        {sorts.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', marginLeft: '8px' }}>
            {sorts.map((sort) => (
              <span key={sort.field} className="nt-badge-sort">
                {columns.find((c) => c.key === sort.field)?.label}
                {sort.dir === 'asc' ? ' ↑' : ' ↓'}
                <button
                  onClick={() => handleSort(sort.field, null)}
                  style={{
                    marginLeft: '4px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        <button className="nt-toolbar-btn">
          <span>고정</span>
          {frozenCount > 0 && <span className="nt-badge-filter-count">{frozenCount}</span>}
        </button>

        <Popover
          trigger={<button className="nt-toolbar-btn">열 설정</button>}
          align="end"
        >
          <div style={{ padding: '8px', minWidth: '200px' }}>
            <button
              onClick={() => setVisibleColumns(columns.map((c) => c.key))}
              style={{ width: '100%', marginBottom: '4px' }}
              className="nt-popover-item"
            >
              전체
            </button>
            <button
              onClick={() => setVisibleColumns(columns.slice(0, 5).map((c) => c.key))}
              style={{ width: '100%', marginBottom: '8px' }}
              className="nt-popover-item"
            >
              초기화
            </button>
            <div style={{ borderTop: '1px solid #e5e7eb', marginBottom: '8px' }} />
            {columns.map((col) => (
              <label key={col.key} className="nt-filter-checkbox">
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col.key)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setVisibleColumns((prev) => [...prev, col.key]);
                    } else {
                      setVisibleColumns((prev) => prev.filter((k) => k !== col.key));
                    }
                  }}
                />
                {col.label}
              </label>
            ))}
          </div>
        </Popover>

        <div className="nt-toolbar-sep" />

        <button className="nt-toolbar-btn" onClick={onRefresh}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 8a6 6 0 0 1 10.2-4.2M14 8a6 6 0 0 1-10.2 4.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <span className="nt-toolbar-count">
          {filteredData.length} / {data.length}
        </span>
      </div>

      {/* Filter Editor */}
      {Object.keys(filters).some((k) => filters[k]) && (
        <div className="nt-filter-bar">
          <span className="nt-filter-label">필터:</span>
          <div style={{ flex: 1, display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {Object.entries(filters)
              .filter(([_, f]) => f)
              .map(([field, filterObj]) => (
                <span key={field} className="nt-filter-chip">
                  {columns.find((c) => c.key === field)?.label}
                  <button
                    onClick={() => {
                      const newFilters = { ...filters };
                      delete newFilters[field];
                      setFilters(newFilters);
                    }}
                    style={{
                      marginLeft: '4px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="nt-table-wrap">
        <table className="nt-table">
          <thead>
            <tr>
              {visibleCols.map((col, idx) => {
                const width = colWidths[col.key] || col.width || 100;
                const isFrozen = idx < frozenCount;

                return (
                  <th
                    key={col.key}
                    draggable
                    onDragStart={(e) => handleDragStart(e, col.key)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.key)}
                    className={isFrozen ? 'nt-frozen' : ''}
                    style={{
                      width: `${width}px`,
                      minWidth: `${width}px`,
                      position: isFrozen ? 'sticky' : undefined,
                      left: isFrozen ? getLeftOffset(idx, colWidths, visibleCols) : undefined,
                      backgroundColor: isFrozen ? '#f9fafb' : undefined,
                      zIndex: isFrozen ? 10 : undefined,
                      borderRight: isFrozen && idx === frozenCount - 1 ? '1px solid #e5e7eb' : undefined,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'grab',
                      }}
                    >
                      <Popover
                        trigger={
                          <div style={{ flex: 1, cursor: 'pointer' }}>
                            {col.label}
                            {sorts.some((s) => s.field === col.key) && (
                              <span style={{ marginLeft: '4px' }}>
                                {sorts.find((s) => s.field === col.key)?.dir === 'asc' ? '↑' : '↓'}
                              </span>
                            )}
                          </div>
                        }
                        align="start"
                      >
                        <div style={{ padding: '4px' }}>
                          <button
                            className="nt-popover-item"
                            onClick={() => handleSort(col.key, 'asc')}
                          >
                            오름차순 정렬
                          </button>
                          <button
                            className="nt-popover-item"
                            onClick={() => handleSort(col.key, 'desc')}
                          >
                            내림차순 정렬
                          </button>
                          <button
                            className="nt-popover-item"
                            onClick={() => handleSort(col.key, null)}
                          >
                            정렬 해제
                          </button>
                          <div className="nt-popover-divider" />
                          <button
                            className="nt-popover-item"
                            onClick={() => {
                              const newFilters = { ...filters };
                              newFilters[col.key] = newFilters[col.key] || {};
                              setFilters(newFilters);
                            }}
                          >
                            필터 추가/편집
                          </button>
                          <div className="nt-popover-divider" />
                          <button
                            className="nt-popover-item"
                            onClick={() => {
                              const newFrozen = Math.min(frozenCount + 1, visibleCols.length);
                              if (idx < newFrozen) {
                                setFrozenCount(newFrozen);
                              }
                            }}
                          >
                            여기까지 고정
                          </button>
                          <button
                            className="nt-popover-item"
                            onClick={() => {
                              if (idx < frozenCount) {
                                setFrozenCount(Math.max(0, frozenCount - 1));
                              }
                            }}
                          >
                            고정 해제
                          </button>
                        </div>
                      </Popover>

                      <div
                        className="nt-col-resize"
                        onMouseDown={(e) => handleResizeStart(e, col.key)}
                        style={{
                          width: '4px',
                          height: '20px',
                          cursor: 'col-resize',
                          marginLeft: '4px',
                        }}
                      />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length} className="nt-empty">
                  표시할 데이터가 없습니다
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={row.id || rowIdx} onClick={() => onRowClick && onRowClick(row)}>
                  {visibleCols.map((col, colIdx) => {
                    const isFrozen = colIdx < frozenCount;
                    const cellValue = row[col.key];
                    const selectOpts = getSelectOptions(col.key, dynamicSelectOptions);

                    return (
                      <td
                        key={col.key}
                        className={isFrozen ? 'nt-frozen' : ''}
                        style={{
                          width: `${colWidths[col.key] || col.width || 100}px`,
                          minWidth: `${colWidths[col.key] || col.width || 100}px`,
                          position: isFrozen ? 'sticky' : undefined,
                          left: isFrozen ? getLeftOffset(colIdx, colWidths, visibleCols) : undefined,
                          backgroundColor: isFrozen ? '#f9fafb' : undefined,
                          zIndex: isFrozen ? 9 : undefined,
                        }}
                      >
                        {renderCell(col, cellValue, row, {
                          rowId: row.id,
                          onSaved: onFieldSaved,
                          selectOptions: selectOpts,
                          tmStatusGroups,
                          renderReviewCell,
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="nt-pagination">
          <button
            className="nt-page-btn"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            이전
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            return (
              <button
                key={pageNum}
                className={`nt-page-btn ${currentPage === pageNum ? 'active' : ''}`}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            className="nt-page-btn"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            다음
          </button>

          <span className="nt-page-info">
            {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filteredData.length)} / {filteredData.length}
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Render cell content based on column type
 */
function renderCell(col, value, row, { rowId, onSaved, selectOptions, tmStatusGroups, renderReviewCell }) {
  if (col.type === 'review') {
    return renderReviewCell ? renderReviewCell(row) : '—';
  }

  if (col.type === 'select' && (col.key === '단계' || col.key === '구분' || col.key === '실적지역')) {
    const colors =
      col.key === '실적지역' ? REGION_COLORS[value] : STAGE_COLORS[value];
    if (!value || !colors) {
      return <span style={{ color: '#9ca3af' }}>—</span>;
    }
    return (
      <span className="nt-stage-badge" style={{ backgroundColor: colors.bg, color: colors.c }}>
        {value}
      </span>
    );
  }

  if (col.readonly) {
    return value ? (
      col.type === 'date' ? (
        formatDateShort(value)
      ) : (
        String(value)
      )
    ) : (
      <span style={{ color: '#9ca3af' }}>—</span>
    );
  }

  return (
    <InlineEditCell
      rowId={rowId}
      field={col.key}
      value={value}
      columnDef={col}
      selectOptions={selectOptions}
      tmStatusGroups={tmStatusGroups}
      onSaved={onSaved}
    />
  );
}

/**
 * Get left offset for frozen columns
 */
function getLeftOffset(colIdx, colWidths, visibleCols) {
  let offset = 0;
  for (let i = 0; i < colIdx; i++) {
    offset += colWidths[visibleCols[i].key] || visibleCols[i].width || 100;
  }
  return offset;
}

/**
 * Apply field filter
 */
function applyFieldFilter(data, field, filterObj) {
  if (!filterObj) return data;

  // Implement filter logic based on type
  // For now, simple substring match
  return data.filter((row) => {
    const val = row[field];
    if (val === null || val === undefined) return !filterObj.emptyOnly;
    return String(val).toLowerCase().includes(String(filterObj.value || '').toLowerCase());
  });
}
