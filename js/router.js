// ══════════════════════════════════════════════════════
//  router.js — 화면 전환 & 역할 전환
// ══════════════════════════════════════════════════════

// 화면 전환
function nav(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.sico').forEach(s => s.classList.remove('on', 'adm', 'reg'));

  const el = document.getElementById('sc-' + screen);
  if (el) el.classList.add('on');

  const si = document.getElementById('si-' + screen);
  if (si) si.classList.add('on', STATE.role);

  STATE.currentScreen = screen;

  // 화면별 렌더 함수 호출
  const renderMap = {
    'adm-db':    renderAdmDb,
    'adm-dash':  renderAdmDash,
    'adm-meet':  renderAdmMeet,
    'adm-board': renderBoardTable,
    'adm-check': renderAdmCheckTable,
    'adm-goal':  renderAdmGoal,
    'adm-field': renderItemManage,
    'adm-review': renderAdmReview,
    'adm-auth':  renderAdmAuth,
    'reg-detail':renderRegDetail,
    'reg-db':    renderRegDb,
    'reg-dash':  renderRegDash,
    'reg-board': renderRegBoard,
    'reg-meet':  renderRegMeet,
    'reg-check': renderRegCheck,
  };
  if (renderMap[screen]) renderMap[screen]();
}

// 관리자 지역 보기 선택
function setAdmViewRegion(val) {
  ADM_VIEW_REGION = val;

  // reg-check 드롭다운 동기화
  const checkSel = document.getElementById('reg-check-region-sel');
  if (checkSel) checkSel.value = val;

  // 현재 화면 재렌더
  const renderMap = {
    'reg-detail': renderRegDetail,
    'reg-db':     renderRegDb,
    'reg-dash':   renderRegDash,
    'reg-board':  renderRegBoard,
    'reg-meet':   renderRegMeet,
    'reg-check':  renderRegCheck,
  };
  if (renderMap[STATE.currentScreen]) renderMap[STATE.currentScreen]();
}

// 관리자 지역 보기 드롭다운 채우기
function _fillAdmRegViewSel() {
  const sel = document.getElementById('adm-reg-region-sel');
  if (!sel) return;
  const regions = [...new Set([
    ...STATE.nujeok.map(r => r['실적지역']),
    ...(STATE.tallag || []).map(r => r['실적지역']),
    ...(STATE.meets || []).map(r => r['실적지역']),
    ...(STATE.dbFindings || []).map(r => r['실적지역']),
  ].filter(Boolean))].sort();
  const cur = ADM_VIEW_REGION;
  sel.innerHTML = '<option value="">전체</option>' +
    regions.map(r => `<option${r === cur ? ' selected' : ''}>${r}</option>`).join('');
}

// 역할 전환 (청년회 ↔ 지역 담당자)
function setRole(role) {
  STATE.role = role;

  document.getElementById('rb-adm').classList.toggle('on', role === 'adm');
  document.getElementById('rb-reg').classList.toggle('on', role === 'reg');
  document.getElementById('logo-mark').className = 'role-logo-mark ' + role;
  document.getElementById('sidebar').className = 'sidebar ' + role;

  const isAdmin = USER_AUTH && USER_AUTH.role === 'admin';

  // 관리자: 모든 ADM 탭 보임
  // 지역 권한: ADM 탭 중 종합(dash)만 보임
  const admIcons = ['si-adm-dash', 'si-adm-board', 'si-adm-db', 'si-adm-meet', 'si-adm-check', 'si-adm-goal', 'si-adm-field', 'si-adm-auth', 'si-adm-review'];
  const admOnlyForAdmin = ['si-adm-board', 'si-adm-db', 'si-adm-meet', 'si-adm-check', 'si-adm-goal', 'si-adm-field', 'si-adm-auth', 'si-adm-review'];
  const regIcons = ['si-reg-dash', 'si-reg-board', 'si-reg-db', 'si-reg-meet', 'si-reg-check'];

  admIcons.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (role === 'adm') {
      // 지역 권한이면 종합만 보임
      if (!isAdmin && admOnlyForAdmin.includes(id)) {
        el.style.display = 'none';
      } else {
        el.style.display = '';
      }
    } else {
      el.style.display = 'none';
    }
  });

  regIcons.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = role === 'reg' ? '' : 'none';
  });

  // 관리자 지역 보기 바: 관리자가 지역 탭일 때만 표시
  const regViewWrap = document.getElementById('adm-reg-view-wrap');
  if (regViewWrap) {
    const show = isAdmin && role === 'reg';
    regViewWrap.style.display = show ? 'flex' : 'none';
    if (show) _fillAdmRegViewSel();
    if (role === 'adm') ADM_VIEW_REGION = '';
  }

  nav(role === 'adm' ? 'adm-dash' : 'reg-dash');
}
