// ══════════════════════════════════════════════════════
//  api.js — 데이터 로드 & GAS 통신
// ══════════════════════════════════════════════════════

async function loadData(manual = false) {
  showSyncBar('시트에서 데이터 불러오는 중...');
  setSyncStatus('로딩 중...');

  try {
    let data;

    if (USE_SAMPLE) {
      await new Promise(r => setTimeout(r, 700));
      data = SAMPLE_DATA;
      const notice = document.getElementById('gas-notice');
      if (notice) notice.style.display = 'block';
    } else {
      const res = await fetch(GAS_URL + '?action=getData&t=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      data = await res.json();
      if (data.error) throw new Error(data.error);
      const notice = document.getElementById('gas-notice');
      if (notice) notice.style.display = 'none';
    }

    STATE.nujeok     = data.nujeok     || [];
    STATE.tallag     = data.tallag     || [];
    STATE.checks     = data.checks     || [];
    STATE.checkItems = data.checkItems || [];
    STATE.goals      = data.goals      || {};
    STATE.tallagKeys = new Set(data.tallagKeys || []);
    STATE.dbFindings = data.dbFindings || [];
    STATE.meets      = (data.meets || []).map(r => ({
      ...r,
      _date: parseMeetDate(r['다음만남일'] || '')
    }));
    STATE.syncedAt   = data.syncedAt;

    populateFilters();

    const firstScreen = STATE.role === 'adm' ? 'adm-dash' : 'reg-board';
    nav(firstScreen);

    hideSyncBar();
    const time = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    setSyncStatus('동기화 ' + time);

    if (manual) showToast('✅ 동기화 완료!');

  } catch (e) {
    hideSyncBar();
    setSyncStatus('오류');
    showToast('⚠️ 로드 실패: ' + e.message, 'error');

    if (!STATE.nujeok.length) {
      Object.assign(STATE, SAMPLE_DATA);
      STATE.tallagKeys  = new Set(SAMPLE_DATA.tallagKeys || []);
      STATE.dbFindings = SAMPLE_DATA.dbFindings || [];
      STATE.meets = (SAMPLE_DATA.meets || []).map(r => ({
        ...r,
        _date: parseMeetDate(r['다음만남일'] || '')
      }));
      populateFilters();
      nav(STATE.role === 'adm' ? 'adm-dash' : 'reg-board');
    }
  }
}

async function gasPost(payload) {
  const res = await fetch(GAS_URL + '?t=' + Date.now(), {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data;
}

async function syncTallag() {
  if (!confirm('탈락 동기화를 실행할까요?\n청년탈락 시트에 있는 데이터를 개강체크_탈락으로 이동합니다.')) return;
  showSyncBar('탈락 동기화 중...');
  try {
    if (USE_SAMPLE) {
      await new Promise(r => setTimeout(r, 1000));
      hideSyncBar();
      showToast('✅ 탈락 동기화 완료 (샘플 모드)');
      return;
    }
    const res = await gasPost({ action: 'syncTallag' });
    hideSyncBar();
    showToast(`✅ 탈락 동기화 완료 — ${res.moved}건 이동`);
    await loadData();
  } catch (e) {
    hideSyncBar();
    showToast('⚠️ 동기화 실패: ' + e.message, 'error');
  }
}
