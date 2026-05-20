// ══════════════════════════════════════════════════════
//  pages/adm-auth.js — 권한 관리 (관리자 전용)
// ══════════════════════════════════════════════════════

function renderAdmAuth() {
  loadAuthData().then(() => {
    renderAuthUsers();
    renderAuthRequests();
  });
}

// ─── 승인된 사용자 목록 ───
function renderAuthUsers() {
  const users = STATE.authUsers || [];
  const el    = document.getElementById('auth-users-list');
  if (!el) return;

  if (!users.length) {
    el.innerHTML = '<div style="color:var(--text3);padding:10px;">등록된 사용자 없음</div>';
    return;
  }

  el.innerHTML = `
    <table class="bt" style="width:100%;">
      <thead>
        <tr>
          <th>이름</th><th>이메일</th><th>권한</th><th>지역</th><th>관리</th>
        </tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td><strong>${u.name||'—'}</strong></td>
            <td style="font-size:11px;color:var(--text3);">${u.email||'—'}</td>
            <td>
              <span class="badge ${u.role==='admin'?'b-adm':'b-reg'}">
                ${u.role==='admin'?'청년회':'지역'}
              </span>
            </td>
            <td style="font-size:12px;">${(u.regions||[]).join(', ')||'전체'}</td>
            <td>
              <button class="btn" onclick="editAuthUser('${u.email}')" style="font-size:11px;padding:4px 8px;">수정</button>
              <button class="btn" onclick="deleteAuthUser('${u.email}')" style="font-size:11px;padding:4px 8px;color:var(--red);">삭제</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

// ─── 접근 요청 목록 ───
function renderAuthRequests() {
  const requests = STATE.authRequests || [];
  const el = document.getElementById('auth-requests-list');
  if (!el) return;

  const pending = requests.filter(r => !r.processed);

  if (!pending.length) {
    el.innerHTML = '<div style="color:var(--text3);padding:10px;">대기 중인 요청 없음</div>';
    return;
  }

  el.innerHTML = pending.map(r => `
    <div style="border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:8px;background:#fff;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
        <div>
          <div style="font-size:14px;font-weight:700;">${r.name||'—'} <span style="font-size:12px;color:var(--text3);font-weight:400;">(사명: ${r.mission||'—'})</span></div>
          <div style="font-size:12px;color:var(--text3);">${r.email||'—'}</div>
        </div>
        <div style="font-size:11px;color:var(--text3);">${r.requestedAt||''}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:12px;margin-bottom:10px;">
        <div><span style="color:var(--text3);">요청 지역:</span> <strong>${r.region||'—'}</strong></div>
        <div><span style="color:var(--text3);">사유:</span> ${r.reason||'—'}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center;">
        <select id="approve-role-${r.email?.replace('@','_')}" class="top-sel" style="font-size:12px;">
          <option value="region">지역 권한</option>
          <option value="admin">청년회 권한</option>
        </select>
        <input type="text" id="approve-region-${r.email?.replace('@','_')}"
          value="${r.region||''}" placeholder="허용 지역 (콤마 구분)"
          style="flex:1;padding:6px 10px;border:1px solid var(--border2);border-radius:var(--radius-sm);font-size:12px;font-family:inherit;">
        <button class="btn reg-pri" onclick="approveRequest('${r.email}','${r.name}')" style="font-size:12px;">승인</button>
        <button class="btn" onclick="rejectRequest('${r.email}')" style="font-size:12px;color:var(--red);">거부</button>
      </div>
    </div>
  `).join('');
}

// ─── 사용자 승인 ───
async function approveRequest(email, name) {
  const safeKey  = email.replace('@','_');
  const role     = document.getElementById('approve-role-' + safeKey)?.value || 'region';
  const regionStr= document.getElementById('approve-region-' + safeKey)?.value || '';
  const regions  = regionStr.split(',').map(r => r.trim()).filter(Boolean);

  if (!regions.length && role !== 'admin') {
    alert('허용 지역을 입력해주세요');
    return;
  }

  try {
    if (!USE_SAMPLE) {
      await gasPost({ action: 'approveUser', email, name, role, regions });
    } else {
      if (!STATE.authUsers) STATE.authUsers = [];
      STATE.authUsers.push({ email, name, role, regions });
      if (STATE.authRequests) {
        const req = STATE.authRequests.find(r => r.email === email);
        if (req) req.processed = true;
      }
    }
    showToast('✅ ' + name + ' 승인 완료');
    await loadAuthData();
    renderAdmAuth();
  } catch(e) {
    showToast('⚠️ 승인 실패: ' + e.message, 'error');
  }
}

// ─── 요청 거부 ───
async function rejectRequest(email) {
  if (!confirm(email + ' 요청을 거부할까요?')) return;
  try {
    if (!USE_SAMPLE) await gasPost({ action: 'rejectRequest', email });
    else if (STATE.authRequests) {
      const req = STATE.authRequests.find(r => r.email === email);
      if (req) req.processed = true;
    }
    showToast('거부 완료');
    renderAdmAuth();
  } catch(e) {
    showToast('⚠️ 실패: ' + e.message, 'error');
  }
}

// ─── 사용자 수정 ───
function editAuthUser(email) {
  const user = (STATE.authUsers || []).find(u => u.email === email);
  if (!user) return;

  const newRegion = prompt('허용 지역 수정 (콤마 구분):\n현재: ' + (user.regions||[]).join(', '), (user.regions||[]).join(', '));
  if (newRegion === null) return;

  const regions = newRegion.split(',').map(r => r.trim()).filter(Boolean);
  saveAuthUser({ ...user, regions });
}

async function saveAuthUser(user) {
  try {
    if (!USE_SAMPLE) {
      await gasPost({ action: 'approveUser', ...user });
    } else {
      const idx = (STATE.authUsers||[]).findIndex(u => u.email === user.email);
      if (idx >= 0) STATE.authUsers[idx] = user;
    }
    showToast('✅ 수정 완료');
    renderAuthUsers();
  } catch(e) {
    showToast('⚠️ 수정 실패: ' + e.message, 'error');
  }
}

// ─── 사용자 삭제 ───
async function deleteAuthUser(email) {
  if (!confirm(email + ' 사용자를 삭제할까요?')) return;
  try {
    if (!USE_SAMPLE) await gasPost({ action: 'deleteUser', email });
    else STATE.authUsers = (STATE.authUsers||[]).filter(u => u.email !== email);
    showToast('🗑 삭제 완료');
    renderAuthUsers();
  } catch(e) {
    showToast('⚠️ 삭제 실패: ' + e.message, 'error');
  }
}

// ─── 권한 데이터 로드 ───
async function loadAuthData() {
  if (USE_SAMPLE) return;
  try {
    const res = await fetch(GAS_URL + '?action=getAuthData&t=' + Date.now());
    const data = await res.json();
    STATE.authUsers    = data.users    || [];
    STATE.authRequests = data.requests || [];
  } catch(e) {
    console.error('권한 데이터 로드 실패:', e);
  }
}
