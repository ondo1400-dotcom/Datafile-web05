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

    return `<tr>
      <td style="padding:8px 12px;border:1px solid var(--border);font-weight:700;background:#f0f9ff;text-align:center;white-space:nowrap;">${region}</td>
      ${cells}
    </tr>`;
  }).join('');

  // 저장 상태 표시
  const status = document.getElementById('goal-save-status');
  if (status) status.textContent = `${kaigang} / ${center} 목표 편집 중`;
}

function setGoalFilter(key, val) {
  goalFilter[key] = val.trim();
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
