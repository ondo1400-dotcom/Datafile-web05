// ══════════════════════════════════════════════════════
//  utils.js — 공통 유틸 함수
// ══════════════════════════════════════════════════════

// 지역 고정 순서 정렬 (REGION_ORDER 기준, 미포함 지역은 뒤에 가나다순)
function sortRegions(arr) {
  return [...arr].sort((a, b) => {
    const ia = REGION_ORDER.indexOf(a);
    const ib = REGION_ORDER.indexOf(b);
    if (ia !== -1 && ib !== -1) return ia - ib;
    if (ia !== -1) return -1;
    if (ib !== -1) return 1;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

// 개강 정규화 (43/6 → 43/06, 43년/6월 → 43/06, "43/06 홍대 개강" → "43/06 홍대")
function normalizeKaigang(val) {
  if (!val) return '';
  let s = String(val).replace(/년/g, '/').replace(/월/g, '').replace(/\s*개강\s*/g, '').trim();
  // 한 자리 월 → 두 자리 (문자열 중간에 있어도 처리)
  s = s.replace(/^(\d+)\/(\d)(\s|$)/, (_, y, m, after) => `${y}/0${m}${after}`).trim();
  s = s.replace(/^(\d+)\/(\d)$/, '$1/0$2');
  return s;
}

// 센터명 정규화 (goals 테이블 canonical 기준, prefix 매칭)
// "홍대" → "홍대센터" (canonical에 "홍대"로 시작하는 항목이 하나만 있을 때)
function normalizeCenter(val, canonicalCenters) {
  if (!val) return val;
  if (!canonicalCenters || canonicalCenters.size === 0) return val;
  if (canonicalCenters.has(val)) return val;
  const matches = [];
  for (const c of canonicalCenters) {
    if (c.startsWith(val)) matches.push(c);
  }
  return matches.length === 1 ? matches[0] : val;
}

// 복합키 생성
function makeKey(row) {
  return [
    row['실적지역']          || '',
    row['인도자']            || '',
    row['섭외자']            || '',
    row['목표개강(연도/월)'] || '',
    row['목표센터']          || '',
  ].join('|');
}

// 탈락 여부 확인
function isTallag(row) {
  return STATE.tallagKeys.has(makeKey(row));
}

// 단계 배지 HTML
function stageBadge(stage) {
  const s = STAGE_COLORS[stage] || { bg: '#f0f0f0', c: '#555' };
  return `<span style="background:${s.bg};color:${s.c};padding:2px 7px;border-radius:10px;font-size:11px;font-weight:700;">${stage || '—'}</span>`;
}

// 보고일 배지 HTML
function reportBadge(date) {
  return date
    ? `<span class="badge b-green">${date}</span>`
    : `<span class="badge b-gray">미보고</span>`;
}

// 달성률 칩 HTML
function pctChip(done, total) {
  if (!total) return '—';
  const pct = Math.round(done / total * 100);
  const cls = pct >= 100 ? 'pct-100' : pct >= 70 ? 'pct-70' : pct >= 40 ? 'pct-40' : 'pct-0';
  return `<span class="${cls}" style="border-radius:4px;padding:1px 5px;font-weight:700;font-size:12px;">${pct}%</span>`;
}

// 체크 맵 생성 (복합키||항목명 → {checked, 체크자, 체크일시})
function buildCheckMap() {
  const map = {};
  STATE.checks.forEach(c => {
    const k = c['복합키'] + '||' + c['항목명'];
    map[k] = {
      checked:  c['체크여부'] === 'Y',
      체크자:   c['체크자']   || '',
      체크일시: c['체크일시'] || '',
    };
  });
  return map;
}

// ─── UI 헬퍼 ───

function showSyncBar(msg) {
  const bar = document.getElementById('sync-bar');
  bar.style.display = 'flex';
  document.getElementById('sync-bar-msg').textContent = msg;
}
function hideSyncBar() {
  document.getElementById('sync-bar').style.display = 'none';
}
function setSyncStatus(msg) {
  document.getElementById('sync-status').textContent = msg;
}

let _toastTimer;
function showToast(msg, type = 'ok') {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = [
      'position:fixed;bottom:20px;right:20px;',
      'padding:10px 16px;border-radius:10px;',
      'font-size:13px;font-weight:600;z-index:999;',
      'box-shadow:0 4px 16px rgba(0,0,0,.2);transition:opacity .3s;',
    ].join('');
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.background = type === 'error' ? 'var(--red)' : '#1a3a8f';
  t.style.color = '#fff';
  t.style.opacity = '1';
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 2800);
}

// 필터 셀렉트 채우기
function populateFilters() {
  const regions       = sortRegions([...new Set(STATE.nujeok.map(r => r['실적지역']).filter(Boolean))]);
  // 개강 목록: 목표개강 + 이전개강 모두 포함
  const kaigangSet = new Set();
  STATE.nujeok.forEach(r => {
    if (r['목표개강(연도/월)']) kaigangSet.add(r['목표개강(연도/월)']);
    if (r['이전개강'])          kaigangSet.add(r['이전개강']);
  });
  const kaigangMonths = [...kaigangSet].filter(Boolean).sort();

  // 지역 셀렉트 (여러 곳)
  ['board-region-sel', 'adm-check-region-sel', 'reg-region-sel', 'reg-check-region-sel', 'meet-region-sel', 'db-region-sel'].forEach(id => {
    const sel = document.getElementById(id);
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">전체</option>'
      + regions.map(r => `<option ${r === cur ? 'selected' : ''}>${r}</option>`).join('');
  });

  // 개강월 셀렉트
  const kaigangSel = document.getElementById('board-kaigang-sel');
  if (kaigangSel) {
    kaigangSel.innerHTML = '<option value="">전체</option>'
      + kaigangMonths.map(m => `<option>${m}</option>`).join('');
  }

  // 체크항목 셀렉트
  const itemSel = document.getElementById('adm-check-item-sel');
  if (itemSel) {
    itemSel.innerHTML = '<option value="">전체</option>'
      + STATE.checkItems.map(i => `<option>${i}</option>`).join('');
  }

  // 관리자 지역 보기 드롭다운 갱신 (데이터 로드 후)
  if (typeof _fillAdmRegViewSel === 'function') _fillAdmRegViewSel();
}

// GAS에서 온 날짜 파싱 (api.js에서 사용)
function parseMeetDateGas(raw) {
  return typeof parseMeetDate === 'function' ? parseMeetDate(raw) : null;
}

// 모달 배경 클릭 시 닫기
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('modal-bg') && e.target.classList.contains('show')) {
    e.target.classList.remove('show');
  }
});
