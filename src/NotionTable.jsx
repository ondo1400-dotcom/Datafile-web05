import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { cn, Badge, Button, Checkbox, Input, ScrollArea, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui';
import Popover, { PopoverTrigger, PopoverContent } from './Popover';
import { SearchIcon, FilterIcon, Columns3Icon, ChevronLeftIcon, ChevronRightIcon, PinIcon, ArrowUpIcon, ArrowDownIcon, HelpCircleIcon, RefreshCwIcon, DocIcon } from './Icons';
import InlineEditCell from './InlineEditCell';
import StageBadge from './StageBadge';
import { getColumnLabel, getColumnWidth, getCustomSortIndex, getStorageKey, formatDateShort } from './columnConfig';
import { getSelectOptions } from './selectOptions';

function matchesFilterPattern(value, pattern) {
  if (!pattern) return true;
  const lv = value.toLowerCase();
  const orGroups = pattern.split('|').map(s => s.trim()).filter(Boolean);
  if (orGroups.length === 0) return true;
  return orGroups.some(group => {
    const andTerms = group.split('&').map(s => s.trim()).filter(Boolean);
    return andTerms.every(term => lv.includes(term.toLowerCase()));
  });
}

function getPageNumbers(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = [1];
  if (current > 3) pages.push('dots');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('dots');
  pages.push(total);
  return pages;
}

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
  const allKeys = columns.map(c => c.key);
  const storageKey = getStorageKey(tableType);

  const loadPrefs = () => {
    try { const r = localStorage.getItem(storageKey); return r ? JSON.parse(r) : null; } catch { return null; }
  };
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const p = loadPrefs();
    return p?.visibleColumns?.filter(k => allKeys.includes(k)) || [...allKeys];
  });
  const [columnOrder, setColumnOrder] = useState(() => {
    const p = loadPrefs();
    const saved = p?.columnOrder?.filter(k => allKeys.includes(k)) || [];
    const miss = allKeys.filter(k => !saved.includes(k));
    return saved.length > 0 ? [...saved, ...miss] : [...allKeys];
  });
  const [frozenCount, setFrozenCount] = useState(() => loadPrefs()?.frozenCount || 0);
  const [colWidths, setColWidths] = useState(() => loadPrefs()?.colWidths || {});
  const [sortKeys, setSortKeys] = useState([]);
  const [filters, setFilters] = useState({});
  const [activeFilterCol, setActiveFilterCol] = useState(null);
  const [headerMenuCol, setHeaderMenuCol] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const searchTimerRef = useRef(null);
  const [dragCol, setDragCol] = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);
  const tableRef = useRef(null);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => { setDebouncedSearch(value); setCurrentPage(1); }, 300);
  }, []);

  const getEffectiveWidth = useCallback((key) => colWidths[key] || (columns.find(c => c.key === key)?.width) || 100, [colWidths, columns]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ visibleColumns, columnOrder, frozenCount, colWidths }));
  }, [visibleColumns, columnOrder, frozenCount, colWidths, storageKey]);

  const toggleColumn = useCallback(col => setVisibleColumns(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]), []);
  const showAllColumns = useCallback(() => setVisibleColumns([...allKeys]), [allKeys]);
  const resetColumns = useCallback(() => { setVisibleColumns([...allKeys]); setColumnOrder([...allKeys]); }, [allKeys]);

  const clearSort = useCallback(() => setSortKeys([]), []);
  const handleSortDirection = useCallback((col, dir) => {
    setSortKeys(prev => { const filtered = prev.filter(s => s.key !== col); return [...filtered, { key: col, dir }]; });
  }, []);
  const clearSortForCol = useCallback(col => setSortKeys(prev => prev.filter(s => s.key !== col)), []);

  const addFilter = useCallback((col) => {
    const colDef = columns.find(c => c.key === col);
    const opts = getSelectOptions(col, dynamicSelectOptions);
    let type = 'text';
    if (opts.length > 0 || colDef?.type === 'select') type = 'select';
    else if (colDef?.type === 'date') type = 'date';
    else if (colDef?.type === 'number') type = 'number';
    setFilters(prev => ({ ...prev, [col]: { type, textValue: '', selectedValues: [], dateFrom: '', dateTo: '' } }));
    setActiveFilterCol(col);
  }, [columns, dynamicSelectOptions]);
  const removeFilter = useCallback((col) => {
    setFilters(prev => { const n = { ...prev }; delete n[col]; return n; });
    if (activeFilterCol === col) setActiveFilterCol(null);
  }, [activeFilterCol]);
  const updateFilter = useCallback((col, u) => setFilters(prev => ({ ...prev, [col]: { ...prev[col], ...u } })), []);

  const handleDragStart = useCallback(col => setDragCol(col), []);
  const handleDragOver = useCallback((e, col) => { e.preventDefault(); setDragOverCol(col); }, []);
  const handleDrop = useCallback((tc) => {
    if (!dragCol || dragCol === tc) { setDragCol(null); setDragOverCol(null); return; }
    setColumnOrder(prev => {
      const a = [...prev]; const fi = a.indexOf(dragCol); const ti = a.indexOf(tc);
      if (fi === -1 || ti === -1) return prev;
      a.splice(fi, 1); a.splice(ti, 0, dragCol); return a;
    });
    setDragCol(null); setDragOverCol(null);
  }, [dragCol]);

  const displayColumns = useMemo(() => columnOrder.filter(c => visibleColumns.includes(c)), [columnOrder, visibleColumns]);
  const safeFrozen = Math.min(frozenCount, displayColumns.length);
  const totalTableWidth = useMemo(() => displayColumns.reduce((s, col) => s + getEffectiveWidth(col), 0), [displayColumns, getEffectiveWidth]);
  const frozenOffsets = useMemo(() => {
    const offsets = []; let acc = 0;
    for (const col of displayColumns) { offsets.push(acc); acc += getEffectiveWidth(col); }
    return offsets;
  }, [displayColumns, getEffectiveWidth]);

  const filteredData = useMemo(() => {
    let r = [...data];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      r = r.filter(row => searchFields.some(f => { const v = row[f]; return v && String(v).toLowerCase().includes(q); }));
    }
    Object.entries(filters).forEach(([col, f]) => {
      r = r.filter(row => {
        const raw = row[col];
        const v = raw == null ? '' : String(raw);
        switch (f.type) {
          case 'text': if (f.emptyOnly) return v === ''; return matchesFilterPattern(v, f.textValue || '');
          case 'select': return !f.selectedValues?.length || f.selectedValues.includes(v);
          case 'date': { const d = v.split('T')[0]; if (f.dateFrom && d < f.dateFrom) return false; if (f.dateTo && d > f.dateTo) return false; return true; }
          case 'number': { const n = parseFloat(v); if (isNaN(n)) return !f.numberMin && !f.numberMax; if (f.numberMin != null && n < f.numberMin) return false; if (f.numberMax != null && n > f.numberMax) return false; return true; }
          default: return true;
        }
      });
    });
    return r;
  }, [data, debouncedSearch, filters, searchFields]);

  const sortedData = useMemo(() => {
    if (sortKeys.length === 0) return filteredData;
    return [...filteredData].sort((a, b) => {
      for (const { key, dir } of sortKeys) {
        const av = a[key], bv = b[key];
        if (av == null) { if (bv != null) return 1; continue; }
        if (bv == null) return -1;
        if (['단계', '구분', '실적지역'].includes(key)) {
          const ai = getCustomSortIndex(columns, key, String(av));
          const bi = getCustomSortIndex(columns, key, String(bv));
          if (ai !== bi) return dir === 'asc' ? ai - bi : bi - ai;
          continue;
        }
        const colDef = columns.find(c => c.key === key);
        if (colDef?.type === 'number') {
          const an = parseFloat(av) || 0, bn = parseFloat(bv) || 0;
          if (an !== bn) return dir === 'asc' ? an - bn : bn - an;
          continue;
        }
        const c = String(av).localeCompare(String(bv), 'ko');
        if (c !== 0) return dir === 'asc' ? c : -c;
      }
      return 0;
    });
  }, [filteredData, sortKeys, columns]);

  const activeFilterCount = Object.keys(filters).length;
  const hasQuickFilter = debouncedSearch !== '' || activeFilterCount > 0;
  const filteredCount = filteredData.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedData = sortedData.slice((safePage - 1) * pageSize, safePage * pageSize);
  const fromIdx = filteredCount > 0 ? (safePage - 1) * pageSize + 1 : 0;
  const toIdx = Math.min(safePage * pageSize, filteredCount);

  const empty = <span className="text-warm-300">—</span>;

  function renderCell(col, value, row) {
    if (col.type === 'review') return renderReviewCell ? renderReviewCell(row) : empty;
    if (col.badgeType && col.readonly) return value ? <StageBadge value={String(value)} type={col.badgeType} /> : empty;
    if (col.badgeType && !col.readonly) {
      return (
        <InlineEditCell rowId={row.id || row.__rowIndex} field={col.key} value={value} columnDef={col}
          selectOptions={getSelectOptions(col.key, dynamicSelectOptions)} tmStatusGroups={tmStatusGroups}
          onSaved={onFieldSaved} badgeType={col.badgeType} />
      );
    }
    if (col.readonly) {
      if (!value && value !== 0) return empty;
      if (col.type === 'date') return <span className="text-[11px] text-slate-500 whitespace-nowrap">{formatDateShort(value)}</span>;
      return <span className="text-[12px] text-slate-700">{String(value)}</span>;
    }
    if (col.type === 'checklist') {
      return Array.isArray(value) && value.length > 0 ? <span className="text-[12px]">{value.length}개</span> : empty;
    }
    return (
      <InlineEditCell rowId={row.id || row.__rowIndex} field={col.key} value={value} columnDef={col}
        selectOptions={getSelectOptions(col.key, dynamicSelectOptions)} tmStatusGroups={tmStatusGroups}
        onSaved={onFieldSaved} />
    );
  }

  function getUniqueValues(col) {
    const s = new Set();
    data.forEach(r => { const v = r[col]; if (v != null && v !== '') s.add(String(v)); });
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'ko'));
  }

  return (
    <div className="space-y-1.5">
      {statsCards && <div style={{ marginBottom: '12px' }}>{statsCards}</div>}

      {/* Search bar */}
      <div className="relative">
        <SearchIcon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400 pointer-events-none" />
        <input type="text" value={searchQuery} onChange={e => handleSearchChange(e.target.value)}
          placeholder="이름, 전화번호로 검색..." className="db-search-input" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-t-xl bg-[#FAFAF9] border border-[#DDD8D3] border-b-0 px-3 py-2 -mb-2.5">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 text-warm-600 hover:text-warm-800 hover:bg-warm-100">
              <FilterIcon size={14} />
              <span className="font-medium">필터</span>
              {activeFilterCount > 0 && <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#BB2720] text-[10px] font-bold text-white">{activeFilterCount}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 p-1.5" style={{ maxHeight: 280 }}>
            <div className="mb-1 px-2 py-1 text-[11px] font-semibold text-slate-400">필터 추가</div>
            <ScrollArea style={{ height: Math.min(220, allKeys.length * 30) }}>
              <div className="space-y-0.5">
                {columnOrder.map(col => (
                  <button key={col} onClick={() => addFilter(col)} disabled={!!filters[col]}
                    className="w-full rounded-md px-2.5 py-1.5 text-left text-[12px] text-slate-600 hover:bg-blue-50 hover:text-blue-700 disabled:text-slate-300 transition-colors">
                    {getColumnLabel(columns, col)}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {sortKeys.map((s, i) => (
          <Badge key={s.key} variant="secondary" className="gap-1 py-1 text-[11px] font-normal bg-warm-100 text-warm-700">
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warm-300 text-[8px] font-bold text-white">{i + 1}</span>
            {getColumnLabel(columns, s.key)} <span className="font-semibold text-[#BB2720]">{s.dir === 'asc' ? '↑' : '↓'}</span>
            <button onClick={() => setSortKeys(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 rounded-full hover:bg-warm-200 h-3.5 w-3.5 flex items-center justify-center text-warm-400 hover:text-warm-600 text-[10px]">×</button>
          </Badge>
        ))}
        {sortKeys.length > 1 && <button onClick={clearSort} className="text-[10px] text-warm-400 hover:text-warm-600">정렬 초기화</button>}

        {Object.keys(filters).map(col => (
          <Badge key={col} className="gap-1.5 py-1 border-[#FDDCDA] bg-[#FEF2F1] text-[#BB2720] text-[11px] font-normal">
            <button onClick={() => setActiveFilterCol(activeFilterCol === col ? null : col)} className="hover:underline font-medium">{getColumnLabel(columns, col)}</button>
            <button onClick={() => removeFilter(col)} className="rounded-full h-3.5 w-3.5 flex items-center justify-center text-[#BB2720]/60 hover:text-[#BB2720] text-[10px]">×</button>
          </Badge>
        ))}

        <div className="flex-1" />

        <div className="flex items-center gap-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-warm-600 hover:text-warm-800 hover:bg-warm-100">
                <PinIcon size={14} />
                <span className="font-medium">고정</span>
                {safeFrozen > 0 && <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-[#BB2720] text-[10px] font-bold text-white">{safeFrozen}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-48 p-1.5" style={{ maxHeight: 280 }}>
              <div className="mb-1 flex items-center justify-between px-2 py-1">
                <span className="text-[11px] font-semibold text-warm-500">틀고정</span>
                {safeFrozen > 0 && <button onClick={() => setFrozenCount(0)} className="text-[11px] text-[#BB2720] hover:text-[#9B201A] font-medium">해제</button>}
              </div>
              <ScrollArea style={{ height: Math.min(220, displayColumns.length * 28) }}>
                <div className="space-y-0.5">
                  {displayColumns.slice(0, 10).map((col, i) => (
                    <button key={col} onClick={() => setFrozenCount(frozenCount === i + 1 ? 0 : i + 1)}
                      className={cn('w-full rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors',
                        i < safeFrozen ? 'bg-[#FEF2F1] text-[#BB2720] font-medium' : 'text-warm-600 hover:bg-warm-50')}>
                      {getColumnLabel(columns, col)}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5 text-warm-600 hover:text-warm-800 hover:bg-warm-100">
                <Columns3Icon size={14} />
                <span className="font-medium">열 설정</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 p-1.5" style={{ maxHeight: 280 }}>
              <div className="mb-1 flex items-center justify-between px-2 py-1">
                <span className="text-[11px] font-semibold text-warm-500">표시 컬럼 ({visibleColumns.length}/{allKeys.length})</span>
                <div className="flex gap-2">
                  <button onClick={showAllColumns} className="text-[11px] text-[#BB2720] hover:text-[#9B201A] font-medium">전체</button>
                  <button onClick={resetColumns} className="text-[11px] text-[#BB2720] hover:text-[#9B201A] font-medium">초기화</button>
                </div>
              </div>
              <ScrollArea style={{ height: Math.min(220, allKeys.length * 28) }}>
                <div className="space-y-0.5">
                  {columnOrder.map(col => (
                    <label key={col} className="flex items-center gap-2.5 rounded-md px-2.5 py-1 text-[12px] text-warm-600 hover:bg-warm-50 cursor-pointer">
                      <Checkbox checked={visibleColumns.includes(col)} onCheckedChange={() => toggleColumn(col)} className="h-3.5 w-3.5" />
                      {getColumnLabel(columns, col)}
                    </label>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <div className="h-4 w-px bg-warm-300" />
          <Button variant="ghost" size="sm" className="gap-1.5 text-warm-600 hover:text-warm-800 hover:bg-warm-100"
            onClick={onRefresh} title="새로고침">
            <RefreshCwIcon size={14} />
          </Button>
          <div className="h-4 w-px bg-warm-300" />
          <span className="text-[12px] font-medium text-warm-500 tabular-nums">
            {hasQuickFilter ? (
              <><span className="text-[#BB2720] font-semibold">{filteredCount.toLocaleString()}</span><span className="font-normal"> / </span>{data.length.toLocaleString()}<span className="font-normal">건</span></>
            ) : (
              <>{data.length.toLocaleString()}<span className="font-normal">건</span></>
            )}
          </span>
        </div>
      </div>

      {/* Filter editor */}
      {activeFilterCol && filters[activeFilterCol] && (
        <div className="rounded-xl border border-[#DDD8D3] bg-white px-4 py-3">
          <FilterEditor col={activeFilterCol} filter={filters[activeFilterCol]} data={data} columns={columns}
            dynamicSelectOptions={dynamicSelectOptions}
            getUniqueValues={getUniqueValues} onUpdate={u => updateFilter(activeFilterCol, u)}
            onClose={() => setActiveFilterCol(null)} onRemove={() => removeFilter(activeFilterCol)} />
        </div>
      )}

      {/* Table */}
      <div className="rounded-b-xl border border-[#DDD8D3] bg-white shadow-sm overflow-hidden">
        <Table ref={tableRef} style={{ width: Math.max(totalTableWidth, 0), minWidth: '100%' }}>
          <colgroup>
            {displayColumns.map(col => <col key={col} style={{ width: getEffectiveWidth(col) }} />)}
          </colgroup>
          <TableHeader>
            <TableRow>
              {displayColumns.map((col, colIdx) => {
                const si = sortKeys.findIndex(s => s.key === col);
                const isSorted = si !== -1;
                const isColFrozen = colIdx < safeFrozen;
                return (
                  <TableHead key={col} draggable
                    onDragStart={() => handleDragStart(col)} onDragOver={e => handleDragOver(e, col)}
                    onDrop={() => handleDrop(col)} onDragEnd={() => { setDragCol(null); setDragOverCol(null); }}
                    style={colIdx < safeFrozen ? { left: frozenOffsets[colIdx], zIndex: 30 } : undefined}
                    className={cn('relative select-none transition-colors',
                      dragOverCol === col && '!border-l-2 !border-[#BB2720]',
                      dragCol === col && 'opacity-30',
                      isSorted && '!text-warm-800',
                      colIdx < safeFrozen && 'frozen-col',
                      colIdx === safeFrozen - 1 && 'frozen-col-last')}>
                    <Popover open={headerMenuCol === col} onOpenChange={open => setHeaderMenuCol(open ? col : null)}>
                      <PopoverTrigger asChild>
                        <button type="button" className="flex items-center gap-1 truncate w-full text-left outline-none cursor-pointer hover:text-warm-800">
                          <span>{getColumnLabel(columns, col)}</span>
                          {isSorted && (
                            <span className="flex items-center gap-0.5 shrink-0">
                              {sortKeys.length > 1 && <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-warm-400 text-[7px] font-bold text-white">{si + 1}</span>}
                              <span className="flex h-4 w-4 items-center justify-center rounded bg-[#FEF2F1] text-[#BB2720] text-[9px] font-bold">{sortKeys[si].dir === 'asc' ? '↑' : '↓'}</span>
                            </span>
                          )}
                          {!!filters[col] && <span className="h-1.5 w-1.5 rounded-full bg-[#BB2720] shrink-0" />}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-44 p-1">
                        <button onClick={() => { handleSortDirection(col, 'asc'); setHeaderMenuCol(null); }}
                          className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors',
                            isSorted && sortKeys[si].dir === 'asc' ? 'bg-warm-100 text-warm-800 font-medium' : 'text-warm-600 hover:bg-warm-50')}>
                          <ArrowUpIcon size={13} /> 오름차순 정렬
                        </button>
                        <button onClick={() => { handleSortDirection(col, 'desc'); setHeaderMenuCol(null); }}
                          className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors',
                            isSorted && sortKeys[si].dir === 'desc' ? 'bg-warm-100 text-warm-800 font-medium' : 'text-warm-600 hover:bg-warm-50')}>
                          <ArrowDownIcon size={13} /> 내림차순 정렬
                        </button>
                        {isSorted && (
                          <button onClick={() => { clearSortForCol(col); setHeaderMenuCol(null); }}
                            className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] text-[#BB2720] hover:bg-red-50 transition-colors">
                            정렬 해제
                          </button>
                        )}
                        <div className="my-1 h-px bg-warm-200" />
                        <button onClick={() => { if (!filters[col]) addFilter(col); else setActiveFilterCol(col); setHeaderMenuCol(null); }}
                          className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors',
                            filters[col] ? 'bg-red-50 text-[#BB2720] font-medium' : 'text-warm-600 hover:bg-warm-50')}>
                          <FilterIcon size={13} /> {filters[col] ? '필터 편집' : '필터 추가'}
                        </button>
                        <div className="my-1 h-px bg-warm-200" />
                        <button onClick={() => { setFrozenCount(isColFrozen ? 0 : colIdx + 1); setHeaderMenuCol(null); }}
                          className={cn('flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[12px] transition-colors',
                            isColFrozen ? 'bg-warm-100 text-warm-800 font-medium' : 'text-warm-600 hover:bg-warm-50')}>
                          <PinIcon size={13} /> {isColFrozen ? '고정 해제' : '여기까지 고정'}
                        </button>
                      </PopoverContent>
                    </Popover>
                    <div className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize hover:bg-[#BB2720]/30 z-10"
                      onPointerDown={e => {
                        e.preventDefault(); e.stopPropagation();
                        const startX = e.clientX; const startWidth = getEffectiveWidth(col);
                        const onMove = ev => setColWidths(prev => ({ ...prev, [col]: Math.max(40, startWidth + ev.clientX - startX) }));
                        const onUp = () => { document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp); };
                        document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp);
                      }} />
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIdx) => (
              <TableRow key={row.id || row.__rowIndex || rowIdx} className="group cursor-pointer"
                onClick={() => onRowClick && onRowClick(row)}>
                {displayColumns.map((col, colIdx) => {
                  const colDef = columns.find(c => c.key === col);
                  const wrapCols = ['TM현황', '비고'];
                  const cellCls = wrapCols.includes(col) ? 'cell-wrap' : '';
                  const frozen = colIdx < safeFrozen;
                  return (
                    <TableCell key={col}
                      style={frozen ? { position: 'sticky', left: frozenOffsets[colIdx], zIndex: 10 } : undefined}
                      className={cn(cellCls, frozen && 'frozen-col', colIdx === safeFrozen - 1 && 'frozen-col-last')}>
                      {colDef ? renderCell(colDef, row[col], row) : empty}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
            {paginatedData.length < 5 && Array.from({ length: 5 - paginatedData.length }).map((_, i) => (
              <TableRow key={`empty-${i}`} className="pointer-events-none">
                <TableCell colSpan={displayColumns.length} className="h-[41px]">
                  {paginatedData.length === 0 && i === 2 && (
                    <div className="flex items-center justify-center gap-2 text-warm-400">
                      <DocIcon size={20} className="text-warm-300" />
                      <span className="text-sm">표시할 데이터가 없습니다</span>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between rounded-xl bg-white border border-[#DDD8D3] px-4 py-2.5 shadow-sm">
          <span className="text-[12.5px] text-warm-500 tabular-nums">
            <strong className="text-warm-700 font-semibold">{fromIdx}–{toIdx}</strong> / {filteredCount.toLocaleString()}건
          </span>
          <div className="flex items-center gap-1">
            <button disabled={safePage <= 1} onClick={() => setCurrentPage(safePage - 1)}
              className="page-num-btn gap-1 px-3 font-medium">
              <ChevronLeftIcon size={14} /> 이전
            </button>
            {getPageNumbers(safePage, totalPages).map((p, i) =>
              p === 'dots' ? (
                <span key={`dots-${i}`} className="px-0.5 text-warm-400 text-xs">···</span>
              ) : (
                <button key={p} onClick={() => setCurrentPage(p)}
                  className={cn('page-num-btn', safePage === p && 'page-num-active')}>
                  {p}
                </button>
              )
            )}
            <button disabled={safePage >= totalPages} onClick={() => setCurrentPage(safePage + 1)}
              className="page-num-btn gap-1 px-3 font-medium">
              다음 <ChevronRightIcon size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Filter Editor ──
function FilterEditor({ col, filter, data, columns, dynamicSelectOptions, getUniqueValues, onUpdate, onClose, onRemove }) {
  const label = getColumnLabel(columns, col);

  if (filter.type === 'text') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <label className={cn('flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] cursor-pointer border transition-colors',
          filter.emptyOnly ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500 hover:bg-slate-50')}>
          <Checkbox checked={!!filter.emptyOnly} onCheckedChange={v => onUpdate({ emptyOnly: !!v, textValue: '' })} className="h-3 w-3 shrink-0" />
          미입력만
        </label>
        {!filter.emptyOnly && (
          <>
            <span className="text-[10px] text-slate-300">포함</span>
            <Input value={filter.textValue || ''} onChange={e => onUpdate({ textValue: e.target.value })} placeholder="홍길동|김알곡" className="flex-1 h-7 text-xs" autoFocus />
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="shrink-0 rounded-full p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                  <HelpCircleIcon size={14} />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-56 p-3 text-[11px] text-slate-600 space-y-1.5">
                <p className="font-semibold text-slate-800 text-[12px]">복합 필터 사용법</p>
                <div className="space-y-1">
                  <p><code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono text-[#BB2720]">|</code> OR — 하나라도 포함</p>
                  <p className="pl-3 text-slate-400">예: <span className="text-slate-600">홍길동|김알곡</span></p>
                  <p><code className="rounded bg-slate-100 px-1 py-0.5 text-[10px] font-mono text-[#BB2720]">&amp;</code> AND — 모두 포함</p>
                  <p className="pl-3 text-slate-400">예: <span className="text-slate-600">서울&amp;대학생</span></p>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 px-2 text-[11px] text-slate-400 hover:text-red-500">삭제</Button>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 px-2 text-[11px] text-slate-400">닫기</Button>
      </div>
    );
  }

  if (filter.type === 'select') {
    const opts = getSelectOptions(col, dynamicSelectOptions);
    const baseOptions = opts.length > 0 ? opts : getUniqueValues(col);
    const allOptions = ['', ...baseOptions];
    const selected = filter.selectedValues || [];
    const toggle = v => onUpdate({ selectedValues: selected.includes(v) ? selected.filter(s => s !== v) : [...selected, v] });
    return (
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600">{label} <span className="text-slate-300 font-normal">({selected.length}/{allOptions.length})</span></span>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={() => onUpdate({ selectedValues: [...allOptions] })} className="h-6 px-2 text-[11px] text-blue-500">전체선택</Button>
            <Button variant="ghost" size="sm" onClick={() => onUpdate({ selectedValues: [] })} className="h-6 px-2 text-[11px] text-slate-400">해제</Button>
            <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 px-2 text-[11px] text-slate-400 hover:text-red-500">삭제</Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 px-2 text-[11px] text-slate-400">닫기</Button>
          </div>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1 max-h-32 overflow-y-auto">
          {allOptions.map(opt => (
            <label key={opt || '__empty__'} className={cn('flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] cursor-pointer border transition-colors truncate',
              selected.includes(opt) ? 'border-blue-300 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-500 hover:bg-slate-50')}>
              <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} className="h-3 w-3 shrink-0" />
              <span className="truncate">{opt || '(미입력)'}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (filter.type === 'date') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <Input type="date" value={filter.dateFrom || ''} onChange={e => onUpdate({ dateFrom: e.target.value })} className="h-7 text-xs w-auto" />
        <span className="text-[10px] text-slate-300">~</span>
        <Input type="date" value={filter.dateTo || ''} onChange={e => onUpdate({ dateTo: e.target.value })} className="h-7 text-xs w-auto" />
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 px-2 text-[11px] text-slate-400 hover:text-red-500">삭제</Button>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 px-2 text-[11px] text-slate-400">닫기</Button>
      </div>
    );
  }

  if (filter.type === 'number') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-600">{label}</span>
        <Input type="number" value={filter.numberMin ?? ''} onChange={e => onUpdate({ numberMin: e.target.value ? Number(e.target.value) : undefined })} placeholder="최소" className="h-7 text-xs w-20" />
        <span className="text-[10px] text-slate-300">~</span>
        <Input type="number" value={filter.numberMax ?? ''} onChange={e => onUpdate({ numberMax: e.target.value ? Number(e.target.value) : undefined })} placeholder="최대" className="h-7 text-xs w-20" />
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 px-2 text-[11px] text-slate-400 hover:text-red-500">삭제</Button>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 px-2 text-[11px] text-slate-400">닫기</Button>
      </div>
    );
  }

  return null;
}
