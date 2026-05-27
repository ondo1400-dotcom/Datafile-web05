// ══════════════════════════════════════════════════════
//  config.js — 설정값 (여기서만 수정)
// ══════════════════════════════════════════════════════

// ⚠️ Supabase
const SUPABASE_URL      = 'https://chxixthkinagqfjwhoar.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNoeGl4dGhraW5hZ3Fmandob2FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyMzIxNDAsImV4cCI6MjA5MzgwODE0MH0.UcTa83Mi_KuUkezCj09GCqkLjL82A66X_EHp4sZScik';

// Supabase 클라이언트 (index.html에서 CDN 로드 후 초기화)
let SUPA = null;
function initSupabase() {
  SUPA = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// ⚠️ Apps Script 배포 URL (GAS sync용으로 유지)
const GAS_URL = 'https://script.google.com/macros/s/AKfycbx94rAb6olhwRaHds6EZsTzFS56dUq1xbeFpxv5ZOO7EhoS0ckavlKUYmkNM-p8AY7Y/exec';

// ⚠️ 텔레그램 봇 설정 (심의 승인 전송용 — JD_BOT_TOKEN 값 입력)
const TELEGRAM_BOT_TOKEN    = ''; // config.local.js 에서 덮어씀
const REVIEW_TELEGRAM_CHAT  = -1003943121521; // 행정보고창

// ⚠️ Google OAuth 클라이언트 ID
const GOOGLE_CLIENT_ID = '930451155946-8ov88buetjcsql33qtl0v17aenfmkeru.apps.googleusercontent.com';

// 샘플 모드 여부
const USE_SAMPLE = false;

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
