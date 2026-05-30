// ══════════════════════════════════════════════════════
//  pages/adm-goal.js — 청년회 목표 설정
// ══════════════════════════════════════════════════════

// 현재 선택된 개강 필터
let goalFilter = { kaigang: '', center: '' };

function renderAdmGoal() {
  // 개강 목록 추출 (목표개강 + 이전개강 모두 포함)
  const kaigangSet = new Set();
  STATE.nujeok.forEach(r => {
    if (r['목표개강(연도/월)']) kaigangSet.add(r['목표개강(연도/월)']);
    if (r['이전개강'])          kaigangSet.add(r['이전개강']);
  });
  const kaigangList = [...kaigangSet].filter(Boolean).sort();
  const centerList = [...new Set(
    STATE.nujeok.map(r => r['목표센터']).filter(Boolean)
  )].sort();
  renderGoalStandards();
  const nujeokRegions = [...new Set(STATE.nujeok.map(r => r['실적지역']).filter(Boolean))];
  const allRegions = [...new Set([...REGION_ORDER, ...nujeokRegions])];
  const regionList = sortRegions(allRegions);

  // datalist 옵션 채우기 (자동완성용)
  const kaigangDl = document.getElementById('goal-kaigang-list');
  const centerDl  = document.getElementById('goal-center-list');
  if (kaigangDl) kaigangDl.innerHTML = kaigangList.map(k => `<option value="${k}">`).join('');
  if (centerDl)  centerDl.innerHTML  = centerList.map(c => `<option value="${c}">`).join('');

  // 인풋 초기값 설정 (처음 로드 시에만)
  const kaigangInp = document.getElementById('goal-kaigang-sel');
  const centerInp  = document.getElementById('goal-center-sel');
  if (kaigangInp && !kaigangInp.value && kaigangList.length) {
    kaigangInp.value   = kaigangList[0];
    goalFilter.kaigang = kaigangList[0];
  }
  if (centerInp && !centerInp.value && centerList.length) {
    centerInp.value   = centerList[0];
    goalFilter.center = centerList[0];
  }

  renderGoalTable(regionList);
}

function renderGoalTable(regionListArg) {
  const regionList = regionListArg || sortRegions([...new Set(
    [...REGION_ORDER, ...STATE.nujeok.map(r => r['실적지역']).filter(Boolean)]
  )]);

  const tbody = document.getElementById('goal-body');
  if (!tbody) return;

  const { kaigang, center } = goalFilter;

  // 현재 필터에 해당하는 실적 집계 (이전개강 포함)
  const actual = {};
  STATE.nujeok
    .filter(r => {
      const inKaigang  = r['목표개강(연도/월)'] === kaigang;
      const inPrevKaigang = r['이전개강'] === kaigang;
      return (inKaigang || inPrevKaigang) && r['목표센터'] === center && !isTallag(r);
    })
    .forEach(r => {
      const region = r['실적지역'] || '미입력';
      const stage  = r['단계']     || '미입력';
      if (!actual[region]) actual[region] = {};
      actual[region][stage] = (actual[region][stage] || 0) + 1;
    });

  tbody.innerHTML = regionList.map(region => {
    const cells = STAGE_ORDER.map(stage => {
      const goalKey = makeGoalKey(kaigang, center, stage, region);
      const goal    = STATE.goals[goalKey] || 0;
      const act     = (actual[region] || {})[stage] || 0;
      const pct     = goal ? Math.round(act / goal * 100) : null;
      const pctHtml = pct !== null
        ? `<span style="font-size:10px;${pct>=100?'color:var(--green);font-weight:700;':pct>=70?'color:var(--amber);':'color:var(--red);'}">${pct}%</span>`
        : '<span style="font-size:10px;color:var(--text3);">—</span>';

      return `<td style="padding:6px 4px;border:1px solid var(--border);text-align:center;">
        <input
          type="number" min="0" max="999"
          value="${goal || ''}"
          placeholder="0"
          style="width:48px;text-align:center;border:1px solid var(--border2);border-radius:4px;padding:3px;font-size:13px;font-weight:700;"
          onchange="updateGoal('${kaigang}','${center}','${stage}','${region}',this.value)"
          onfocus="this.select()"
        />
        <div style="margin-top:2px;">${pctHtml}</div>
        <div style="font-size:9px;color:var(--text3);">실적 ${act}</div>
      </td>`;
    }).join('');

    const senKey  = makeGoalKey(kaigang, center, '센등', region);
    const senGoal = STATE.goals[senKey] || 0;
    const senCell = `<td style="padding:6px 4px;border:1px solid var(--border);text-align:center;border-left:2px solid #d97706;">
      <input
        type="number" min="0" max="999"
        value="${senGoal || ''}"
        placeholder="0"
        style="width:48px;text-align:center;border:1px solid #d97706;border-radius:4px;padding:3px;font-size:13px;font-weight:700;background:#fef3c7;"
        onchange="updateGoal('${kaigang}','${center}','센등','${region}',this.value)"
        onfocus="this.select()"
      />
    </td>`;

    return `<tr>
      <td style="padding:8px 12px;border:1px solid var(--border);font-weight:700;background:#f0f9ff;text-align:center;white-space:nowrap;">${region}</td>
      ${cells}
      ${senCell}
    </tr>`;
  }).join('');

  // 저장 상태 표시
  const status = document.getElementById('goal-save-status');
  if (status) status.textContent = `${kaigang} / ${center} 목표 편집 중`;
}

function setGoalFilter(key, val) {
  goalFilter[key] = key === 'kaigang' ? normalizeKaigang(val) : val.trim();
  if (!goalFilter.kaigang || !goalFilter.center) {
    const status = document.getElementById('goal-save-status');
    if (status) status.textContent = '개강과 센터를 모두 입력해주세요';
    return;
  }
  renderGoalTable();
  const status = document.getElementById('goal-save-status');
  if (status) status.textContent = `${goalFilter.kaigang} / ${goalFilter.center} 목표 편집 중`;
}

async function updateGoal(kaigang, center, stage, region, value) {
  const count = parseInt(value) || 0;
  const key   = makeGoalKey(kaigang, center, stage, region);

  // STATE 즉시 반영
  if (count > 0) STATE.goals[key] = count;
  else delete STATE.goals[key];

  if (USE_SAMPLE) {
    showToast('💾 목표 저장됨 (샘플 모드)');
    return;
  }

  try {
    const { error } = await SUPA.from('goals').upsert(
      { kaigang, center, stage, region, target: count },
      { onConflict: 'kaigang,center,stage,region' }
    );
    if (error) throw new Error(error.message);
    showToast('✅ 목표 저장됨');
  } catch (e) {
    showToast('⚠️ 저장 실패: ' + e.message, 'error');
  }
}

// 목표키 생성 (utils.js와 동일, 프론트용)
function makeGoalKey(kaigang, center, stage, region) {
  return [kaigang, center, stage, region].join('|');
}

// ── 기준 현황 렌더링 ──────────────────────────────────
function renderGoalStandards() {
  const el = document.getElementById('goal-standards-content');
  if (!el) return;

  const canonical = STATE.canonicalCenters;
  const canonicalKaigangs = new Set(
    Object.keys(STATE.goals).map(k => k.split('|')[0]).filter(Boolean)
  );

  // 데이터 전체에서 센터·개강 수집
  const allRows = [...STATE.nujeok, ...STATE.tallag, ...STATE.dbFindings];
  const centerCount  = {};
  const kaigangCount = {};
  allRows.forEach(r => {
    const c = r['목표센터'];
    const k = r['목표개강(연도/월)'];
    if (c) centerCount[c]  = (centerCount[c]  || 0) + 1;
    if (k) kaigangCount[k] = (kaigangCount[k] || 0) + 1;
  });

  // 비표준값 (canonical에 없는 것)
  const nonStdCenters  = Object.entries(centerCount).filter(([c]) => !canonical.has(c)).sort((a, b) => b[1] - a[1]);
  const nonStdKaigangs = Object.entries(kaigangCount).filter(([k]) => !canonicalKaigangs.has(k)).sort();

  const canonicalCenterList = [...canonical].sort();
  const canonicalKaigangList = [...canonicalKaigangs].sort();

  const chip = (txt, cls) =>
    `<span style="display:inline-block;background:${cls};border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;margin:2px;">${txt}</span>`;

  const nonStdToggleChip = (v, n, type) =>
    `<span class="norm-chip" data-type="${type}" data-val="${v}"
      style="display:inline-flex;align-items:center;gap:4px;background:#fee2e2;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;margin:2px;cursor:pointer;user-select:none;border:2px solid #fca5a5;"
      title="클릭하여 정규화 대상에서 제외"
    ><span class="norm-chip-check">✓</span>${v} (${n}건)</span>`;

  const nonStdHtml = (list, type) => list.length
    ? list.map(([v, n]) => nonStdToggleChip(v, n, type)).join('')
    : `<span style="font-size:11px;color:var(--text3);">없음 ✓</span>`;

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;">📌 표준 센터 (goals 기준)</div>
        <div>${canonicalCenterList.length ? canonicalCenterList.map(c => chip(c, '#dbeafe')).join('') : '<span style="font-size:11px;color:var(--text3);">미설정</span>'}</div>
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin:10px 0 6px;">⚠️ 비표준 센터 <span style="font-size:10px;font-weight:400;color:var(--text3);">(클릭하면 제외)</span></div>
        <div>${nonStdHtml(nonStdCenters, 'center')}</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin-bottom:6px;">📌 표준 개강 (goals 기준)</div>
        <div>${canonicalKaigangList.length ? canonicalKaigangList.map(k => chip(k, '#dcfce7')).join('') : '<span style="font-size:11px;color:var(--text3);">미설정</span>'}</div>
        <div style="font-size:11px;font-weight:700;color:var(--text2);margin:10px 0 6px;">⚠️ 비표준 개강 <span style="font-size:10px;font-weight:400;color:var(--text3);">(클릭하면 제외)</span></div>
        <div>${nonStdHtml(nonStdKaigangs, 'kaigang')}</div>
      </div>
    </div>
    ${(nonStdCenters.length || nonStdKaigangs.length) ? `
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);">
      <button id="norm-run-btn" class="btn reg-pri" style="padding:8px 20px;" onclick="runDbNormalization()">DB 정규화 실행</button>
      <span style="font-size:11px;color:var(--text3);margin-left:10px;">선택된 비표준 데이터를 표준값으로 수정합니다</span>
    </div>` : ''}
  `;

  // 칩 토글 이벤트
  el.querySelectorAll('.norm-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const excluded = chip.dataset.excluded === 'true';
      chip.dataset.excluded = excluded ? 'false' : 'true';
      if (!excluded) {
        chip.style.background = '#e5e7eb';
        chip.style.borderColor = '#d1d5db';
        chip.style.color = '#9ca3af';
        chip.style.textDecoration = 'line-through';
        chip.querySelector('.norm-chip-check').textContent = '✗';
        chip.title = '클릭하여 정규화 대상에 포함';
      } else {
        chip.style.background = '#fee2e2';
        chip.style.borderColor = '#fca5a5';
        chip.style.color = '';
        chip.style.textDecoration = '';
        chip.querySelector('.norm-chip-check').textContent = '✓';
        chip.title = '클릭하여 정규화 대상에서 제외';
      }
    });
  });
}

// ── DB 정규화 실행 ────────────────────────────────────
async function runDbNormalization() {
  // 제외된(excluded=true) 값 수집
  const excludedKaigangs = new Set();
  const excludedCenters  = new Set();
  document.querySelectorAll('.norm-chip[data-excluded="true"]').forEach(el => {
    if (el.dataset.type === 'kaigang') excludedKaigangs.add(el.dataset.val);
    if (el.dataset.type === 'center')  excludedCenters.add(el.dataset.val);
  });

  const excludeNote = (excludedKaigangs.size + excludedCenters.size) > 0
    ? `\n제외 항목: ${[...excludedKaigangs, ...excludedCenters].join(', ')}`
    : '';
  if (!confirm(`선택된 비표준 데이터를 표준값으로 수정합니다.${excludeNote}\n계속할까요?`)) return;

  const btn = document.getElementById('norm-run-btn');
  if (btn) { btn.disabled = true; btn.textContent = '정규화 중...'; }

  let totalChanged = 0;
  try {
    const tables = [
      ['nujeok',      'id,"목표개강(연도/월)","목표센터"'],
      ['tallag',      'id,"목표개강(연도/월)","목표센터"'],
      ['db_findings', 'id,"목표개강(연도/월)","목표센터"'],
    ];
    for (const [table, cols] of tables) {
      const { data: rows, error } = await SUPA.from(table).select(cols);
      if (error) throw new Error(error.message);
      for (const r of (rows || [])) {
        const origK = r['목표개강(연도/월)'] || '';
        const origC = r['목표센터'] || '';
        const normK = excludedKaigangs.has(origK) ? origK : normalizeKaigang(origK);
        const normC = excludedCenters.has(origC)  ? origC : normalizeCenter(origC, STATE.canonicalCenters);
        const kChanged = normK !== origK;
        const cChanged = normC !== origC;
        if (!kChanged && !cChanged) continue;
        const patch = {};
        if (kChanged) patch['목표개강(연도/월)'] = normK;
        if (cChanged) patch['목표센터'] = normC;
        const { error: ue } = await SUPA.from(table).update(patch).eq('id', r.id);
        if (ue) throw new Error(ue.message);
        totalChanged++;
      }
    }
    showToast(`✅ 정규화 완료 — ${totalChanged}건 수정`);
    await loadData(false);
  } catch (e) {
    showToast(`⚠️ 정규화 실패: ${e.message}`, 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'DB 정규화 실행'; }
  }
}
