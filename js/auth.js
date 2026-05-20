// ══════════════════════════════════════════════════════
//  auth.js — 구글 로그인 + 권한 관리
// ══════════════════════════════════════════════════════

// 현재 로그인된 사용자
let CURRENT_USER = null;
// 권한 정보 { email, name, role, regions[] }
let USER_AUTH = null;

// ─── 구글 로그인 초기화 ───
function initGoogleAuth() {
  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback:  handleGoogleLogin,
    auto_select: true, // 이전에 로그인한 계정 자동 선택
  });

  // 저장된 세션 확인
  const saved = sessionStorage.getItem('userAuth');
  if (saved) {
    try {
      USER_AUTH = JSON.parse(saved);
      CURRENT_USER = USER_AUTH;
      onLoginSuccess();
      return;
    } catch(e) {}
  }

  // 로그인 화면 표시
  showLoginScreen();
}

// ─── 구글 로그인 콜백 ───
async function handleGoogleLogin(response) {
  const payload = parseJwt(response.credential);
  CURRENT_USER = {
    email: payload.email,
    name:  payload.name,
    picture: payload.picture,
  };

  // GAS에서 권한 확인
  showAuthLoading('권한 확인 중...');
  try {
    const res = await fetch(GAS_URL + '?action=checkAuth&email='
      + encodeURIComponent(payload.email) + '&t=' + Date.now());
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    if (data.approved) {
      USER_AUTH = {
        email:   payload.email,
        name:    payload.name,
        picture: payload.picture,
        role:    data.role,    // 'admin' | 'region'
        regions: data.regions, // ['요한2조', '서울'] or ['전체']
      };
      sessionStorage.setItem('userAuth', JSON.stringify(USER_AUTH));
      onLoginSuccess();
    } else if (data.pending) {
      // 요청 대기 중
      showPendingScreen();
    } else {
      // 미등록 → 요청 화면
      showRequestScreen();
    }
  } catch(e) {
    if (USE_SAMPLE) {
      // 샘플 모드: 관리자로 로그인
      USER_AUTH = {
        email:   payload.email,
        name:    payload.name,
        picture: payload.picture,
        role:    'admin',
        regions: ['전체'],
      };
      sessionStorage.setItem('userAuth', JSON.stringify(USER_AUTH));
      onLoginSuccess();
    } else {
      showAuthError('권한 확인 실패: ' + e.message);
    }
  }
}

// ─── 로그인 성공 ───
function onLoginSuccess() {
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-shell').style.display   = 'block';

  // 사용자 정보 표시
  const nameEl = document.getElementById('user-name');
  const picEl  = document.getElementById('user-pic');
  if (nameEl) nameEl.textContent = USER_AUTH.name;
  if (picEl && USER_AUTH.picture) picEl.src = USER_AUTH.picture;

  // 역할에 따라 기본 화면 설정
  if (USER_AUTH.role === 'admin') {
    setRole('adm');
  } else {
    setRole('reg');
    // 지역 권한이면 역할 전환 버튼 숨기기
    const admBtn = document.getElementById('rb-adm');
    const regBtn = document.getElementById('rb-reg');
    if (admBtn) admBtn.style.display = 'none';
    if (regBtn) regBtn.style.display = 'none';
  }

  // 데이터 로드
  loadData();
}

// ─── 로그아웃 ───
function logout() {
  sessionStorage.removeItem('userAuth');
  USER_AUTH = null;
  CURRENT_USER = null;
  google.accounts.id.disableAutoSelect();
  document.getElementById('auth-screen').style.display = 'flex';
  document.getElementById('app-shell').style.display   = 'none';
  showLoginScreen();
}

// ─── 권한 체크 (데이터 필터링용) ───
function canSeeRegion(region) {
  if (!USER_AUTH) return false;
  if (USER_AUTH.role === 'admin') return true;
  if (USER_AUTH.regions.includes('전체')) return true;
  return USER_AUTH.regions.includes(region);
}

// 허용된 지역 목록
function getAllowedRegions() {
  if (!USER_AUTH) return [];
  if (USER_AUTH.role === 'admin') return null; // null = 전체
  if (USER_AUTH.regions.includes('전체')) return null;
  return USER_AUTH.regions;
}

// ─── 로그인 화면 표시 ───
function showLoginScreen() {
  document.getElementById('auth-content').innerHTML = `
    <div style="text-align:center;">
      <div style="width:64px;height:64px;background:var(--adm);border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
      </div>
      <div style="font-size:22px;font-weight:700;margin-bottom:6px;">지역관리 시스템</div>
      <div style="font-size:14px;color:var(--text3);margin-bottom:32px;">청년회 · 지역 담당자 전용</div>
      <div id="google-btn" style="display:flex;justify-content:center;"></div>
      <div style="font-size:12px;color:var(--text3);margin-top:16px;">승인된 계정만 접속 가능합니다</div>
    </div>
  `;

  // 구글 로그인 버튼 렌더
  google.accounts.id.renderButton(
    document.getElementById('google-btn'),
    { theme: 'outline', size: 'large', text: 'signin_with', locale: 'ko' }
  );
}

// ─── 요청 화면 ───
function showRequestScreen() {
  document.getElementById('auth-content').innerHTML = `
    <div style="max-width:400px;width:100%;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:20px;font-weight:700;margin-bottom:6px;">접근 요청</div>
        <div style="font-size:13px;color:var(--text3);">${CURRENT_USER?.email || ''}</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px;">등록되지 않은 계정입니다. 관리자에게 요청해주세요.</div>
      </div>

      <div style="display:flex;flex-direction:column;gap:10px;">
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:4px;">이름 <span style="color:var(--red);">*</span></div>
          <input id="req-name" type="text" placeholder="실명 입력"
            style="width:100%;padding:10px 12px;border:1px solid var(--border2);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;outline:none;"
            value="${CURRENT_USER?.name || ''}">
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:4px;">사명 <span style="color:var(--red);">*</span></div>
          <input id="req-mission" type="text" placeholder="예: 김인도"
            style="width:100%;padding:10px 12px;border:1px solid var(--border2);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;outline:none;">
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:4px;">소속 지역 <span style="color:var(--red);">*</span></div>
          <input id="req-region" type="text" placeholder="예: 요한2조, 서울 (여러 지역 콤마로 구분)"
            style="width:100%;padding:10px 12px;border:1px solid var(--border2);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;outline:none;">
        </div>
        <div>
          <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:4px;">요청 사유</div>
          <textarea id="req-reason" placeholder="접근이 필요한 이유를 간단히 작성해주세요"
            style="width:100%;padding:10px 12px;border:1px solid var(--border2);border-radius:var(--radius-sm);font-size:14px;font-family:inherit;outline:none;resize:vertical;min-height:80px;"></textarea>
        </div>
        <button onclick="submitRequest()"
          style="padding:12px;background:var(--adm2);color:#fff;border:none;border-radius:var(--radius-sm);font-size:14px;font-weight:700;cursor:pointer;margin-top:4px;">
          접근 요청 보내기
        </button>
        <button onclick="showLoginScreen()"
          style="padding:10px;background:transparent;color:var(--text3);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;cursor:pointer;">
          다른 계정으로 로그인
        </button>
      </div>
    </div>
  `;
}

// ─── 요청 대기 화면 ───
function showPendingScreen() {
  document.getElementById('auth-content').innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:40px;margin-bottom:16px;">⏳</div>
      <div style="font-size:18px;font-weight:700;margin-bottom:8px;">승인 대기 중</div>
      <div style="font-size:13px;color:var(--text3);margin-bottom:24px;">
        ${CURRENT_USER?.email || ''}<br>
        관리자가 요청을 검토 중입니다. 승인 후 접속 가능합니다.
      </div>
      <button onclick="showLoginScreen()"
        style="padding:10px 20px;background:transparent;color:var(--text3);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:13px;cursor:pointer;">
        다른 계정으로 로그인
      </button>
    </div>
  `;
}

// ─── 로딩 ───
function showAuthLoading(msg) {
  document.getElementById('auth-content').innerHTML = `
    <div style="text-align:center;">
      <div style="width:32px;height:32px;border:3px solid var(--border);border-top-color:var(--adm2);border-radius:50%;animation:spin .7s linear infinite;margin:0 auto 16px;"></div>
      <div style="font-size:14px;color:var(--text2);">${msg}</div>
    </div>
  `;
}

function showAuthError(msg) {
  document.getElementById('auth-content').innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:40px;margin-bottom:16px;">⚠️</div>
      <div style="font-size:14px;color:var(--red);margin-bottom:16px;">${msg}</div>
      <button onclick="showLoginScreen()"
        style="padding:10px 20px;background:var(--adm2);color:#fff;border:none;border-radius:var(--radius-sm);font-size:13px;cursor:pointer;">
        다시 시도
      </button>
    </div>
  `;
}

// ─── 접근 요청 제출 ───
async function submitRequest() {
  const name    = document.getElementById('req-name')?.value?.trim();
  const mission = document.getElementById('req-mission')?.value?.trim();
  const region  = document.getElementById('req-region')?.value?.trim();
  const reason  = document.getElementById('req-reason')?.value?.trim();

  if (!name || !mission || !region) {
    alert('이름, 사명, 소속 지역은 필수입니다.');
    return;
  }

  const btn = document.querySelector('[onclick="submitRequest()"]');
  if (btn) { btn.textContent = '전송 중...'; btn.disabled = true; }

  try {
    if (USE_SAMPLE) {
      await new Promise(r => setTimeout(r, 800));
    } else {
      await gasPost({
        action:  'requestAccess',
        email:   CURRENT_USER.email,
        name, mission, region, reason,
      });
    }

    document.getElementById('auth-content').innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:40px;margin-bottom:16px;">✅</div>
        <div style="font-size:18px;font-weight:700;margin-bottom:8px;">요청 완료!</div>
        <div style="font-size:13px;color:var(--text3);">
          관리자 검토 후 승인되면 접속 가능합니다.<br>
          승인 전까지 이 화면이 표시됩니다.
        </div>
      </div>
    `;
  } catch(e) {
    if (btn) { btn.textContent = '접근 요청 보내기'; btn.disabled = false; }
    alert('요청 실패: ' + e.message);
  }
}

// ─── JWT 파싱 ───
function parseJwt(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(atob(base64).split('').map(c =>
    '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  ).join('')));
}
