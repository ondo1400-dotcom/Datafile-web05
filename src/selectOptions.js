/**
 * Select field options and grouping configuration
 * Handles dropdown options, TM status states, colors, and utility functions
 */

// TM 현재상태 - Status categories
export const TM_STATUS_BLOCKED = [
  '번호다름',
  '착신전환',
  '나이비합',
  '환경비합',
  '거리비합',
  '인성비합',
  '책자거절',
  '컨설팅거절',
  '중복',
  '차단',
];

export const TM_STATUS_TRYING = [
  '부재',
  '첫인사(안읽씹)',
  '첫인사(읽씹)',
  '고민파악(멈춤)',
  '카톡중',
  '책자전달',
  '전화예약',
];

export const TM_STATUS_DONE = [
  '만남잡힘',
  '준비합',
  '중장기',
];

// TM Status grouped options with labels and colors
export const TM_STATUS_GROUPS = [
  { label: '진행불가', labelColor: '#ef4444', options: TM_STATUS_BLOCKED },
  { label: '시도가능', labelColor: '#ca8a04', options: TM_STATUS_TRYING },
  { label: '섭외완료', labelColor: '#7c3aed', options: TM_STATUS_DONE },
];

// Dot colors for TM status values (indicator color)
export const TM_DOT_COLORS = {
  '번호다름': '#9ca3af',
  '착신전환': '#9ca3af',
  '나이비합': '#f87171',
  '환경비합': '#f87171',
  '거리비합': '#f87171',
  '인성비합': '#f87171',
  '책자거절': '#fb7185',
  '컨설팅거절': '#fb7185',
  '중복': '#9ca3af',
  '차단': '#9ca3af',
  '부재': '#facc15',
  '첫인사(안읽씹)': '#facc15',
  '첫인사(읽씹)': '#f59e0b',
  '고민파악(멈춤)': '#84cc16',
  '카톡중': '#22c55e',
  '책자전달': '#10b981',
  '전화예약': '#14b8a6',
  '만남잡힘': '#3b82f6',
  '준비합': '#8b5cf6',
  '중장기': '#a855f7',
};

// Text colors for TM status values (text color)
export const TM_TEXT_COLORS = {
  '번호다름': '#9ca3af',
  '착신전환': '#9ca3af',
  '나이비합': '#ef4444',
  '환경비합': '#ef4444',
  '거리비합': '#ef4444',
  '인성비합': '#ef4444',
  '책자거절': '#f43f5e',
  '컨설팅거절': '#f43f5e',
  '중복': '#9ca3af',
  '차단': '#9ca3af',
  '부재': '#ca8a04',
  '첫인사(안읽씹)': '#ca8a04',
  '첫인사(읽씹)': '#d97706',
  '고민파악(멈춤)': '#65a30d',
  '카톡중': '#16a34a',
  '책자전달': '#059669',
  '전화예약': '#0d9488',
  '만남잡힘': '#2563eb',
  '준비합': '#7c3aed',
  '중장기': '#9333ea',
};

// Gender options
export const GENDER_OPTIONS = ['남', '여'];

// Days of week for 고정요일
export const DAYS_OF_WEEK = ['월', '화', '수', '목', '금', '토', '일'];

// Default select options for various columns
export const DEFAULT_SELECT_OPTIONS = {
  '실적지역': ['화정', '대학', '상암', '명동', '새소망', '새신자', '완성'],
  '목표센터': ['서울센터', '부산센터', '대구센터', '광주센터', '대전센터'],
  '섭외유형': ['지인', '전도', '소개', '기타'],
  '종교': ['무교', '기독교', '불교', '천주교', '기타'],
  '최근만남결과': ['좋음', '보통', '부정적'],
  '다음만남확티현황': ['확정', '잠정', '미정'],
  '성별': ['남', '여'],
  '따기주간횟수': ['1회', '2회', '3회', '4회', '5회'],
  '따기유형': [],
  '따기단계': [],
  '구분': ['DB', '찾기'],
  '단계': ['찾기', '합자', '육따기', '영따기', '복음방', '센확', '수신'],
};

/**
 * Get select options for a column
 * Checks dynamic options first, then falls back to defaults
 * @param {string} key - Column key
 * @param {Object} dynamicOptions - Dynamic options from admin settings
 * @returns {Array} Array of option strings
 */
export function getSelectOptions(key, dynamicOptions) {
  if (dynamicOptions && dynamicOptions[key]) {
    return dynamicOptions[key];
  }
  return DEFAULT_SELECT_OPTIONS[key] || [];
}

/**
 * Get TM status dot color by value
 * @param {string} value - TM status value
 * @returns {string} Hex color code
 */
export function getTMDotColor(value) {
  return TM_DOT_COLORS[value] || '#d1d5db';
}

/**
 * Get TM status text color by value
 * @param {string} value - TM status value
 * @returns {string} Hex color code
 */
export function getTMTextColor(value) {
  return TM_TEXT_COLORS[value] || '#6b7280';
}

/**
 * Get TM status group for a value
 * @param {string} value - TM status value
 * @returns {Object|null} Group object with label and labelColor, or null
 */
export function getTMStatusGroup(value) {
  for (const group of TM_STATUS_GROUPS) {
    if (group.options.includes(value)) {
      return group;
    }
  }
  return null;
}

/**
 * Check if TM status is in blocked category
 */
export function isTMStatusBlocked(value) {
  return TM_STATUS_BLOCKED.includes(value);
}

/**
 * Check if TM status is in trying category
 */
export function isTMStatusTrying(value) {
  return TM_STATUS_TRYING.includes(value);
}

/**
 * Check if TM status is in done category
 */
export function isTMStatusDone(value) {
  return TM_STATUS_DONE.includes(value);
}

/**
 * Get all TM status values as a flat array
 */
export function getAllTMStatusValues() {
  return [...TM_STATUS_BLOCKED, ...TM_STATUS_TRYING, ...TM_STATUS_DONE];
}
