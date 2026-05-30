// ══════════════════════════════════════════════════════
//  api.js — 데이터 로드 & Supabase 통신
// ══════════════════════════════════════════════════════

async function loadData(manual = false) {
  showSyncBar('데이터 불러오는 중...');
  setSyncStatus('로딩 중...');

  try {
    if (USE_SAMPLE) {
      await new Promise(r => setTimeout(r, 700));
      _applyData(SAMPLE_DATA);
      const notice = document.getElementById('gas-notice');
      if (notice) notice.style.display = 'block';
    } else {
      // 현재 주의 월요일 계산
      const _now = new Date();
      const _dow = _now.getDay();
      const _mon = new Date(_now);
      _mon.setDate(_now.getDate() - (_dow === 0 ? 6 : _dow - 1));
      const _weekStart = _mon.toISOString().slice(0, 10);

      const [
        { data: nujeok,        error: e1 },
        { data: tallag,        error: e2 },
        { data: dbFindings,    error: e3 },
        { data: meets,         error: e4 },
        { data: checks,        error: e5 },
        { data: checkItems,    error: e6 },
        { data: goalsRows,     error: e7 },
        { data: dbMeetings,    error: e8 },
        { data: dailyGoalRows, error: e9 },
        { data: dailyRepRows,  error: e10 },
        { data: weeklyGoalRows,error: e11 },
        { data: configRows,    error: e12 },
      ] = await Promise.all([
        SUPA.from('nujeok').select('*'),
        SUPA.from('tallag').select('*'),
        SUPA.from('db_findings').select('*'),
        SUPA.from('meets').select('*'),
        SUPA.from('checks').select('*'),
        SUPA.from('check_items').select('항목명').order('sort_order'),
        SUPA.from('goals').select('*'),
        SUPA.from('db_meetings').select('*').order('보고일시', { ascending: false }),
        SUPA.from('daily_goals').select('*'),
        SUPA.from('daily_reports').select('*'),
        SUPA.from('weekly_goals').select('*').gte('week_start', _weekStart),
        SUPA.from('config').select('*'),
      ]);

      const firstErr = e1 || e2 || e3 || e4 || e5 || e6 || e7;
      if (firstErr) throw new Error(firstErr.message);

      const configMap = {};
      (configRows || []).forEach(r => { configMap[r.key] = r.value; });

      // goals: 배열 → { 'kaigang|center|stage|region': count } 형태로 변환
      const goalsMap = {};
      (goalsRows || []).forEach(r => {
        const key = `${normalizeKaigang(r.kaigang)}|${r.center}|${r.stage}|${r.region}`;
        goalsMap[key] = r.target;
      });

      // daily/weekly goals 맵 변환
      const dailyGoalsMap = {};
      (dailyGoalRows || []).forEach(r => {
        dailyGoalsMap[`${r.date}|${r.region}|${r.stage}`] = r.target;
      });
      const dailyReportsMap = {};
      (dailyRepRows || []).forEach(r => {
        dailyReportsMap[`${r.date}|${r.region}|${r.stage}`] = r.count;
      });
      const weeklyGoalsMap = {};
      (weeklyGoalRows || []).forEach(r => {
        weeklyGoalsMap[`${r.week_start}|${r.region}|${r.stage}`] = r.target;
      });

      _applyData({
        nujeok:       nujeok       || [],
        tallag:       tallag       || [],
        dbFindings:   dbFindings   || [],
        meets:        meets        || [],
        dbMeetings:   dbMeetings   || [],
        checks:       checks       || [],
        checkItems:   (checkItems || []).map(r => r['항목명']),
        goals:        goalsMap,
        dailyGoals:   dailyGoalsMap,
        dailyReports: dailyReportsMap,
        weeklyGoals:  weeklyGoalsMap,
        focusKaigang: configMap['focus_kaigang'] || '',
        syncedAt:     new Date().toISOString(),
      });

      const notice = document.getElementById('gas-notice');
      if (notice) notice.style.display = 'none';
    }

    await loadDropdownOptions();
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
      _applyData(SAMPLE_DATA);
      populateFilters();
      nav(STATE.role === 'adm' ? 'adm-dash' : 'reg-board');
    }
  }
}

function _applyData(data) {
  // goals 테이블에서 표준 센터명 추출
  const canonicalCenters = new Set(
    Object.keys(data.goals || {}).map(k => k.split('|')[1]).filter(Boolean)
  );
  STATE.canonicalCenters = canonicalCenters;

  STATE.nujeok = (data.nujeok || []).map((r, i) => ({
    ...r,
    '목표개강(연도/월)': normalizeKaigang(r['목표개강(연도/월)']),
    '이전개강':          normalizeKaigang(r['이전개강']),
    '목표센터':          normalizeCenter(r['목표센터'], canonicalCenters),
    __rowIndex: parseInt(r.id) || i,
  }));
  STATE.tallag = (data.tallag || []).map((r, i) => ({
    ...r,
    '목표개강(연도/월)': normalizeKaigang(r['목표개강(연도/월)']),
    '목표센터':          normalizeCenter(r['목표센터'], canonicalCenters),
    __rowIndex: parseInt(r.id) || i,
  }));
  STATE.checks        = data.checks        || [];
  STATE.checkItems    = data.checkItems    || [];
  STATE.goals         = data.goals         || {};
  STATE.dailyGoals    = data.dailyGoals    || {};
  STATE.dailyReports  = data.dailyReports  || {};
  STATE.weeklyGoals   = data.weeklyGoals   || {};
  if (data.focusKaigang !== undefined) STATE.focusKaigang = data.focusKaigang;
  STATE.dbFindings = (data.dbFindings || []).map((r, i) => ({
    ...r,
    '목표개강(연도/월)': normalizeKaigang(r['목표개강(연도/월)']),
    '목표센터':          normalizeCenter(r['목표센터'], canonicalCenters),
    __rowIndex: parseInt(r.id) || i,
  }));
  STATE.meets = (data.meets || []).map((r, i) => ({
    ...r,
    _date: parseMeetDate(r['다음만남일'] || ''),
    __rowIndex: parseInt(r.id) || i,
  }));
  STATE.dbMeetings = (data.dbMeetings || []);
  STATE.syncedAt = data.syncedAt;

  // tallagKeys: 실적지역|섭외자|인도자
  STATE.tallagKeys = new Set(
    STATE.tallag.map(r => `${r['실적지역']}|${r['섭외자']}|${r['인도자']}`)
  );

  // 지역 권한 필터링
  if (USER_AUTH && USER_AUTH.role !== 'admin') {
    const allowed = USER_AUTH.regions || [];
    STATE.tallag     = STATE.tallag.filter(r => allowed.includes(r['실적지역']));
    STATE.meets      = STATE.meets.filter(r => allowed.includes(r['실적지역']));
    STATE.dbFindings = STATE.dbFindings.filter(r => allowed.includes(r['실적지역']));
  }
}

// ── Supabase upsert 헬퍼 ────────────────────────────────

async function supaUpsert(table, data, onConflict) {
  const { error } = await SUPA.from(table).upsert(data, { onConflict });
  if (error) throw new Error(error.message);
}

async function supaUpdate(table, match, data) {
  let q = SUPA.from(table).update(data);
  Object.entries(match).forEach(([k, v]) => { q = q.eq(k, v); });
  const { error } = await q;
  if (error) throw new Error(error.message);
}

async function supaInsert(table, data) {
  const { data: row, error } = await SUPA.from(table).insert(data).select().single();
  if (error) throw new Error(error.message);
  return row;
}

// ── 집중개강 저장 ──
async function saveFocusKaigang(val) {
  STATE.focusKaigang = val || '';
  if (USE_SAMPLE) return;
  try {
    if (val) {
      await SUPA.from('config').upsert({ key: 'focus_kaigang', value: val }, { onConflict: 'key' });
    } else {
      await SUPA.from('config').delete().eq('key', 'focus_kaigang');
    }
  } catch(e) { showToast('⚠️ 저장 실패: ' + e.message, 'error'); }
}

// ── 탈락 동기화 (GAS → Supabase로 마이그레이션 예정, 임시 유지) ──
async function syncTallag() {
  showToast('ℹ️ 탈락 동기화는 GAS sync로 자동 처리됩니다.', 'info');
}
