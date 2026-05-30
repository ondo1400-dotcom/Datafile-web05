import React from 'react';
import { createRoot } from 'react-dom/client';
import NotionTable from './NotionTable';
import { BOARD_COLUMNS, DB_COLUMNS, STAGE_COLORS } from './columnConfig';
import { getSelectOptions, TM_STATUS_GROUPS } from './selectOptions';

const roots = {};

function getOrCreateRoot(containerId) {
  if (!roots[containerId]) {
    const el = document.getElementById(containerId);
    if (!el) return null;
    roots[containerId] = createRoot(el);
  }
  return roots[containerId];
}

function renderReviewCell(row) {
  const ri = row.__rowIndex ?? row.id;
  if (row['전송완료여부'] === 'Y') {
    return React.createElement('span', { className: 'nt-review-badge', style: { background: '#dcfce7', color: '#166534' } }, '전송완료');
  }
  if (row['심의승인여부'] === 'Y') {
    return React.createElement('span', { className: 'nt-review-badge', style: { background: '#e0e7ff', color: '#3730a3' } }, '승인완료');
  }
  if (row['심의요청여부'] === 'Y') {
    return React.createElement('span', { className: 'nt-review-badge', style: { background: '#fef3c7', color: '#92400e' } }, '심의대기');
  }
  return React.createElement('button', {
    className: 'nt-review-btn',
    onClick: (e) => {
      e.stopPropagation();
      if (typeof window.openRequestReviewModal === 'function') {
        // _isDbFinding 행이면 db_findings 기준으로, nujeok 행이면 nujeok 기준으로 탐색
        window.openRequestReviewModal(ri, row._isDbFinding ? 'db' : 'nujeok');
      }
    }
  }, '심의요청');
}

function handleFieldSaved(rowId, field, value) {
  const rows = window.STATE?.dbFindings || [];
  const row = rows.find(r => (r.id || r.__rowIndex) === rowId);
  if (row) row[field] = value;
}

function renderStatsCards(data) {
  const dbCount = data.filter(r => r['구분'] === 'DB').length;
  const findCount = data.filter(r => r['구분'] === '찾기').length;
  const sentCount = data.filter(r => r['전송완료여부'] === 'Y').length;
  return React.createElement('div', { className: 'nt-stats' },
    React.createElement('div', { className: 'nt-stat-card' },
      React.createElement('div', { className: 'nt-stat-label' }, 'DB'),
      React.createElement('div', { className: 'nt-stat-value' }, dbCount)
    ),
    React.createElement('div', { className: 'nt-stat-card' },
      React.createElement('div', { className: 'nt-stat-label' }, '찾기'),
      React.createElement('div', { className: 'nt-stat-value' }, findCount)
    ),
    React.createElement('div', { className: 'nt-stat-card' },
      React.createElement('div', { className: 'nt-stat-label' }, '전송완료'),
      React.createElement('div', { className: 'nt-stat-value' }, sentCount)
    )
  );
}

function mountDbTable(containerId, data, options = {}) {
  const root = getOrCreateRoot(containerId);
  if (!root) return;
  const dynamicOptions = window.STATE?.dropdownOptions || {};
  root.render(
    React.createElement(NotionTable, {
      data: data || [],
      columns: DB_COLUMNS,
      tableType: 'db',
      pageSize: 50,
      selectOptions: dynamicOptions,
      tmStatusGroups: TM_STATUS_GROUPS,
      searchFields: ['섭외자', '전화번호', '인도자', 'TM현황'],
      renderReviewCell: null,
      statsCards: renderStatsCards(data || []),
      onFieldSaved: handleFieldSaved,
      onRowClick: (row) => {
        if (typeof window.openDbDetail === 'function') {
          window.openDbDetail(row.__rowIndex ?? row.id);
        }
      },
      onRefresh: options.onRefresh || null,
      ...options,
    })
  );
}

function mountBoardTable(containerId, data, options = {}) {
  const root = getOrCreateRoot(containerId);
  if (!root) return;
  const dynamicOptions = window.STATE?.dropdownOptions || {};
  root.render(
    React.createElement(NotionTable, {
      data: data || [],
      columns: BOARD_COLUMNS,
      tableType: 'board',
      pageSize: 50,
      selectOptions: dynamicOptions,
      tmStatusGroups: null,
      searchFields: ['섭외자', '인도자', '교사', '섬김이'],
      renderReviewCell: renderReviewCell,
      onFieldSaved: handleFieldSaved,
      onRowClick: (row) => {
        if (row._isDbFinding) {
          if (typeof window.openDbFindingDetail === 'function') {
            window.openDbFindingDetail(row.__rowIndex ?? row.id, options.source || 'adm-board');
          }
        } else {
          if (typeof window.openPersonDetail === 'function') {
            window.openPersonDetail(row.__rowIndex ?? row.id, options.source || 'adm-board');
          }
        }
      },
      onRefresh: options.onRefresh || null,
      ...options,
    })
  );
}

function unmount(containerId) {
  if (roots[containerId]) {
    roots[containerId].unmount();
    delete roots[containerId];
  }
}

window.NotionTableApp = {
  mountDbTable,
  mountBoardTable,
  unmount,
  BOARD_COLUMNS,
  DB_COLUMNS,
  STAGE_COLORS,
};
