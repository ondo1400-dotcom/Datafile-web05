// ══════════════════════════════════════════════════════
//  config.js — 설정값 (여기서만 수정)
// ══════════════════════════════════════════════════════

// ⚠️ Apps Script 배포 URL
const GAS_URL = 'https://script.google.com/macros/s/AKfycbx94rAb6olhwRaHds6EZsTzFS56dUq1xbeFpxv5ZOO7EhoS0ckavlKUYmkNM-p8AY7Y/exec';

// ⚠️ Google OAuth 클라이언트 ID
const GOOGLE_CLIENT_ID = '930451155946-8ov88buetjcsql33qtl0v17aenfmkeru.apps.googleusercontent.com';

// 샘플 모드 여부
const USE_SAMPLE = GAS_URL.includes('YOUR_DEPLOYMENT_ID');

// 단계 정의
const STAGE_ORDER = ['찾기', '합자', '육따기', '영따기', '복음방', '센확', '수신'];

// 지역 표시 순서 고정
const REGION_ORDER = ['화정', '대학', '상암', '명동', '새소망', '새신자', '완성'];

const STAGE_COLORS = {
  '찾기':   { bg: '#e0f2fe', c: '#0369a1' },
  '합자':   { bg: '#ede9fe', c: '#6d28d9' },
  '육따기': { bg: '#fffbeb', c: '#92400e' },
  '영따기': { bg: '#fff7ed', c: '#c2410c' },
  '복음방': { bg: '#ecfdf5', c: '#065f46' },
  '센확':   { bg: '#eef2ff', c: '#3730a3' },
  '수신':   { bg: '#FDE8FF', c: '#7B00A0' },
};

// 자동 갱신 주기 (ms) — 5분
const AUTO_REFRESH_MS = 5 * 60 * 1000;
