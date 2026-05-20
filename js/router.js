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
    'adm-auth':  renderAdmAuth,
    'reg-board': renderRegBoard,
    'reg-check': renderRegCheck,
  };
  if (renderMap[screen]) renderMap[screen]();
}

// 역할 전환 (청년회 ↔ 지역 담당자)
function setRole(role) {
  STATE.role = role;

  document.getElementById('rb-adm').classList.toggle('on', role === 'adm');
  document.getElementById('rb-reg').classList.toggle('on', role === 'reg');
  document.getElementById('logo-mark').className = 'role-logo-mark ' + role;
  document.getElementById('sidebar').className = 'sidebar ' + role;

  const admIcons = ['si-adm-dash', 'si-adm-board', 'si-adm-db', 'si-adm-meet', 'si-adm-check', 'si-adm-goal', 'si-adm-field', 'si-adm-auth'];
  const regIcons = ['si-reg-board', 'si-reg-meet', 'si-reg-check'];

  admIcons.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = role === 'adm' ? '' : 'none';
  });
  regIcons.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = role === 'reg' ? '' : 'none';
  });

  nav(role === 'adm' ? 'adm-dash' : 'reg-board');
}
