// ══════════════════════════════════════════════════════
//  pages/adm-auth.js — 권한 관리 (관리자 전용, Supabase)
// ══════════════════════════════════════════════════════

function renderAdmAuth() {
  loadAuthData().then(() => {
    renderAuthUsers();
    renderAuthRequests();
  });
}

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
        <tr><th>이름</th><th>이메일</th><th>권한</th><th>지역</th><th>관리</th></tr>
      </thead>
      <tbody>
        ${users.map(u => `
          <tr>
            <td><strong>${u.name||'—'}</strong></td>
            <td style="font-size:11px;color:var(--text3);">${u.email||'—'}</td>
            <td><span class="badge ${u.role==='admin'?'b-adm':'b-reg'}">${u.role==='admin'?'청년회':'지역'}</span></td>
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

function renderAuthRequests() {
  const requests = (STATE.authRequests || []).filter(r => r.status === 'pending');
  const el = document.getElementById('auth-requests-list');
  if (!el) return;

  if (!requests.length) {
    el.innerHTML = '<div style="color:var(--text3);padding:10px;">대기 중인 요청 없음</div>';
    return;
  }

  el.innerHTML = requests.map(r => `
    <div style="border:1px solid var(--border);border-radius:var(--radius);padding:14px;margin-bottom:8px;background:#fff;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px;">
        <div>
          <div style="font-size:14px;font-weight:700;">${r.name||'—'} <span style="font-size:12px;color:var(--text3);font-weight:400;">(사명: ${r.mission||'—'})</span></div>
          <div style="font-size:12px;color:var(--text3);">${r.email||'—'}</div>
        </div>
        <div style="font-size:11px;color:var(--text3);">${String(r.created_at||'').substring(0,10)}</div>
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

async function approveRequest(email, name) {
  const safeKey   = email.replace('@','_');
  const role      = document.getElementById('approve-role-' + safeKey)?.value || 'region';
  const regionStr = document.getElementById('approve-region-' + safeKey)?.value || '';
  const regions   = regionStr.split(',').map(r => r.trim()).filter(Boolean);

  if (!regions.length && role !== 'admin') {
    alert('허용 지역을 입력해주세요');
    return;
  }

  try {
    // auth_users upsert
    const { error: uErr } = await SUPA.from('auth_users').upsert(
      { email, name, role, regions, approved: true },
      { onConflict: 'email' }
    );
    if (uErr) throw new Error(uErr.message);

    // auth_requests 상태 업데이트
    const { error: rErr } = await SUPA
      .from('auth_requests')
      .update({ status: 'approved' })
      .eq('email', email)
      .eq('status', 'pending');
    if (rErr) throw new Error(rErr.message);

    showToast('✅ ' + name + ' 승인 완료');
    await loadAuthData();
    renderAdmAuth();
  } catch(e) {
    showToast('⚠️ 승인 실패: ' + e.message, 'error');
  }
}

async function rejectRequest(email) {
  if (!confirm(email + ' 요청을 거부할까요?')) return;
  try {
    const { error } = await SUPA
      .from('auth_requests')
      .update({ status: 'rejected' })
      .eq('email', email)
      .eq('status', 'pending');
    if (error) throw new Error(error.message);
    showToast('거부 완료');
    await loadAuthData();
    renderAdmAuth();
  } catch(e) {
    showToast('⚠️ 실패: ' + e.message, 'error');
  }
}

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
    const { error } = await SUPA
      .from('auth_users')
      .update({ role: user.role, regions: user.regions })
      .eq('email', user.email);
    if (error) throw new Error(error.message);
    showToast('✅ 수정 완료');
    await loadAuthData();
    renderAuthUsers();
  } catch(e) {
    showToast('⚠️ 수정 실패: ' + e.message, 'error');
  }
}

async function deleteAuthUser(email) {
  if (!confirm(email + ' 사용자를 삭제할까요?')) return;
  try {
    const { error } = await SUPA.from('auth_users').delete().eq('email', email);
    if (error) throw new Error(error.message);
    showToast('🗑 삭제 완료');
    await loadAuthData();
    renderAuthUsers();
  } catch(e) {
    showToast('⚠️ 삭제 실패: ' + e.message, 'error');
  }
}

async function loadAuthData() {
  try {
    const [{ data: users }, { data: requests }] = await Promise.all([
      SUPA.from('auth_users').select('*').order('created_at', { ascending: false }),
      SUPA.from('auth_requests').select('*').order('created_at', { ascending: false }),
    ]);
    STATE.authUsers    = users    || [];
    STATE.authRequests = requests || [];
  } catch(e) {
    console.error('권한 데이터 로드 실패:', e);
  }
}
