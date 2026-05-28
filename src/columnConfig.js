/**
 * Column configuration for board (보유데이터) and db (DB코너) tables
 * Defines column structure, display properties, and stage/region styling
 */

// Board (보유데이터) columns
export const BOARD_COLUMNS = [
  { key: '단계', label: '단계', type: 'select', width: 72, readonly: true },
  { key: '실적지역', label: '지역', type: 'select', width: 72 },
  { key: '목표개강(연도/월)', label: '목표개강', type: 'text', width: 90, readonly: true },
  { key: '목표센터', label: '목표센터', type: 'select', width: 90 },
  { key: '섭외유형', label: '섭외유형', type: 'select', width: 80 },
  { key: '섭외자', label: '섭외자', type: 'text', width: 80, readonly: true },
  { key: '인도자', label: '인도자', type: 'text', width: 80, readonly: true },
  { key: '교사', label: '교사', type: 'text', width: 80 },
  { key: '섬김이', label: '섬김이', type: 'text', width: 80 },
  { key: '최근만남일', label: '최근만남일', type: 'date', width: 100 },
  { key: '최근만남결과', label: '최근만남결과', type: 'select', width: 100 },
  { key: '다음만남일', label: '다음만남일', type: 'date', width: 100 },
  { key: '다음만남시간', label: '다음만남시간', type: 'time', width: 90 },
  { key: '다음만남확티현황', label: '확티현황', type: 'select', width: 90 },
  { key: '__review', label: '심의', type: 'review', width: 90 },
  { key: '2차연결유형', label: '2차연결유형', type: 'text', width: 90 },
  { key: '합자체크리스트', label: '합자체크리스트', type: 'checklist', width: 120 },
  { key: '출생연도', label: '출생년도', type: 'number', width: 76 },
  { key: '사는곳', label: '사는곳', type: 'text', width: 90 },
  { key: '하는일', label: '하는일', type: 'text', width: 90 },
  { key: '종교', label: '종교', type: 'select', width: 72 },
  { key: '신앙년수', label: '신앙년수', type: 'text', width: 72 },
  { key: '따기체크리스트', label: '따기체크리스트', type: 'checklist', width: 120 },
  { key: '따기주간횟수', label: '따기주간횟수', type: 'select', width: 90 },
  { key: '고정요일', label: '고정요일', type: 'dayselect', width: 100 },
  { key: '따기기간', label: '따기기간', type: 'text', width: 80 },
  { key: '따기유형', label: '따기유형', type: 'select', width: 80 },
  { key: '따기단계', label: '따기단계', type: 'select', width: 80 },
  { key: '마팔수강번호', label: '마팔수강번호', type: 'text', width: 90 },
  { key: '센터체크리스트', label: '센터체크리스트', type: 'checklist', width: 120 },
];

// DB (DB코너) columns
export const DB_COLUMNS = [
  { key: '구분', label: '단계', type: 'select', width: 72, readonly: true },
  { key: '실적지역', label: '지역', type: 'select', width: 72 },
  { key: '목표개강(연도/월)', label: '목표개강', type: 'text', width: 90, readonly: true },
  { key: '목표센터', label: '목표센터', type: 'select', width: 90 },
  { key: '섭외유형', label: '섭외유형', type: 'select', width: 80 },
  { key: '섭외자', label: '섭외자', type: 'text', width: 80, readonly: true },
  { key: '인도자', label: '인도자', type: 'text', width: 80, readonly: true },
  { key: 'TM현재상태', label: 'TM현재상태', type: 'select', width: 130 },
  { key: 'TM현황', label: 'TM현황', type: 'textarea', width: 180 },
  { key: '성별', label: '성별', type: 'select', width: 56 },
  { key: '전화번호', label: '전화번호', type: 'text', width: 120 },
  { key: '출생연도', label: '출생년도', type: 'number', width: 76 },
  { key: '사는곳', label: '사는곳', type: 'text', width: 90 },
  { key: '하는일', label: '하는일', type: 'text', width: 90 },
  { key: '종교', label: '종교', type: 'text', width: 72 },
  { key: '신앙년수', label: '신앙년수', type: 'text', width: 72 },
];

/**
 * Get column label by key
 */
export function getColumnLabel(columns, key) {
  const col = columns.find(c => c.key === key);
  return col ? col.label : key;
}

/**
 * Get column width by key
 */
export function getColumnWidth(columns, key) {
  const col = columns.find(c => c.key === key);
  return col ? col.width : 100;
}

/**
 * Get full column definition by key
 */
export function getColumnDef(columns, key) {
  return columns.find(c => c.key === key);
}

/**
 * Check if column is readonly
 */
export function isReadonly(columns, key) {
  const col = columns.find(c => c.key === key);
  return col ? col.readonly === true : false;
}

// Stage order and styling
export const STAGE_ORDER = ['찾기', '합자', '육따기', '영따기', '복음방', '센확', '수신'];

export const STAGE_COLORS = {
  '찾기': { bg: '#e0f2fe', c: '#0369a1' },
  '합자': { bg: '#ede9fe', c: '#6d28d9' },
  '육따기': { bg: '#fffbeb', c: '#92400e' },
  '영따기': { bg: '#fff7ed', c: '#c2410c' },
  '복음방': { bg: '#ecfdf5', c: '#065f46' },
  '센확': { bg: '#eef2ff', c: '#3730a3' },
  '수신': { bg: '#FDE8FF', c: '#7B00A0' },
  'DB': { bg: '#f1f5f9', c: '#475569' },
};

// Region order and styling
export const REGION_ORDER = ['화정', '대학', '상암', '명동', '새소망', '새신자', '완성'];

export const REGION_COLORS = {
  '상암': { bg: '#D9D9D9', c: '#000' },
  '명동': { bg: '#EB7000', c: '#000' },
  '대학': { bg: '#00E823', c: '#000' },
  '화정': { bg: '#00E6F6', c: '#000' },
  '새소망': { bg: '#F8E33F', c: '#000' },
  '새신자': { bg: '#C0E8FF', c: '#000' },
  '완성': { bg: '#EF00D2', c: '#000' },
};

/**
 * Format date as short Korean format: "5월 25일"
 */
export function formatDateShort(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일`;
}

/**
 * Format date and time as Korean format: "2026년 5월 25일 14:00"
 */
export function formatDateTime(d) {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}`;
}

/**
 * Get custom sort index for stages and regions
 * Returns numeric index for natural sorting, or Infinity for unknown values
 */
export function getCustomSortIndex(columns, key, value) {
  if (!value) return Infinity;

  // Check if this is a stage column
  if (['단계', '구분'].includes(key)) {
    const idx = STAGE_ORDER.indexOf(value);
    return idx !== -1 ? idx : Infinity;
  }

  // Check if this is a region column
  if (key === '실적지역') {
    const idx = REGION_ORDER.indexOf(value);
    return idx !== -1 ? idx : Infinity;
  }

  return Infinity;
}

/**
 * Get storage key for user preferences (different per table type)
 */
export function getStorageKey(tableType) {
  return `nt_prefs_${tableType}_v1`;
}
