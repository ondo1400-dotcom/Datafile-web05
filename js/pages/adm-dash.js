// ══════════════════════════════════════════════════════
//  pages/adm-dash.js — 청년회 종합 대시보드 (목표 달성% 반영)
// ══════════════════════════════════════════════════════

function renderAdmDash() {
  const active = STATE.nujeok.filter(r => !isTallag(r));

  document.getElementById('ds-total').textContent  = STATE.nujeok.length;
  document.getElementById('ds-tallag').textContent = STATE.tallag.length;
  document.getElementById('ds-active').textContent = active.length;

  const totalChecks = STATE.checks.length;
  const doneChecks  = STATE.checks.filter(c => c['체크여부'] === 'Y').length;
  document.getElementById('ds-check-rate').textContent = totalChecks
    ? Math.round(doneChecks / totalChecks * 100) + '%' : '—';

  // 단계별 지역 집계 (이월 데이터: 이전개강 컬럼도 포함)
  const byRegion = {};
  const totals   = {};
  STAGE_ORDER.forEach(s => totals[s] = 0);

  // 개강 필터 (대시보드는 전체 집계 - 이전개강 포함)
  active.forEach(r => {
    const region = r['실적지역'] || '미입력';
    const stage  = r['단계']     || '미입력';
    if (!byRegion[region]) byRegion[region] = {};
    byRegion[region][stage] = (byRegion[region][stage] || 0) + 1;
  });

  // 개강 필터 (대시보드용 - 전체 집계이므로 목표는 합산)
  let rows = '';
  sortRegions(Object.keys(byRegion)).forEach(region => { const stages = byRegion[region];
    let sum = 0;
    let cells = STAGE_ORDER.map(s => {
      const act = stages[s] || 0;
      totals[s] += act;
      sum += act;

      // 해당 지역+단계의 목표 합산 (개강 전체)
      const goalTotal = Object.entries(STATE.goals)
        .filter(([k]) => k.endsWith('|' + s + '|' + region))
        .reduce((acc, [, v]) => acc + v, 0);

      const pctHtml = goalTotal
        ? `<div style="font-size:9px;margin-top:1px;">${pctChip(act, goalTotal)}</div>`
        : '';

      return `<td style="text-align:center;border:1px solid var(--border);font-family:monospace;font-size:13px;padding:6px 4px;">
        ${act || '—'}${pctHtml}
      </td>`;
    }).join('');

    rows += `<tr>
      <td style="font-weight:700;background:#f0f9ff;padding:8px 12px;border:1px solid var(--border);text-align:center;">${region}</td>
      ${cells}
      <td style="text-align:center;border:1px solid var(--border);font-weight:700;background:var(--adm-light);color:var(--adm2);font-family:monospace;">${sum}</td>
    </tr>`;
  });

  // 합계 행
  let totSum   = 0;
  let totCells = STAGE_ORDER.map(s => {
    totSum += totals[s];
    return `<td style="text-align:center;border:1px solid var(--border);font-weight:700;font-family:monospace;background:#fef9c3;">${totals[s]}</td>`;
  }).join('');

  rows += `<tr>
    <td style="font-weight:700;background:#FAC608;color:#1a1400;padding:8px 12px;border:1px solid var(--border);text-align:center;">합계</td>
    ${totCells}
    <td style="text-align:center;border:1px solid var(--border);font-weight:700;background:#FAC608;color:#1a1400;font-family:monospace;">${totSum}</td>
  </tr>`;

  document.getElementById('dash-stage-body').innerHTML = rows
    || '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text3);">데이터 없음</td></tr>';

  // 체크 항목별 요약
  const checkSummary  = document.getElementById('dash-check-summary');
  const activePeopleN = [...new Set(active.map(r => makeKey(r)))].length;

  if (STATE.checkItems.length) {
    checkSummary.style.gridTemplateColumns = `repeat(${Math.min(STATE.checkItems.length, 4)}, 1fr)`;
    checkSummary.innerHTML = STATE.checkItems.map(item => {
      const doneCount = STATE.checks.filter(c => c['항목명'] === item && c['체크여부'] === 'Y').length;
      const pct       = activePeopleN ? Math.round(doneCount / activePeopleN * 100) : 0;
      const cardClass = pct >= 100 ? 'reg-c' : pct >= 50 ? 'base' : '';
      const color     = pct >= 100 ? 'var(--reg2)' : pct >= 50 ? 'var(--amber)' : 'var(--red)';
      return `<div class="stat-card ${cardClass}">
        <div class="stat-label">${item}</div>
        <div class="stat-val" style="font-size:18px;color:${color};">${doneCount}명</div>
        <div class="stat-sub">${pct}% 완료</div>
      </div>`;
    }).join('');
  } else {
    checkSummary.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:10px;">체크 항목을 설정탭에서 추가해주세요</div>';
  }
}

// ─── REG: 종합 현황 (지역 담당자용) ───
function renderRegDash() {
  const el = document.getElementById('reg-dash-content');
  if (!el) return;

  const active   = STATE.nujeok.filter(r => !isTallag(r));
  const allowed  = getAllowedRegions(); // null=전체, 배열=허용지역

  // 지역별 단계 집계 (전체)
  const byRegion = {};
  const totals   = {};
  STAGE_ORDER.forEach(s => totals[s] = 0);

  STATE.nujeok.filter(r => !isTallag(r)).forEach(r => {
    const region = r['실적지역'] || '기타';
    const stage  = r['단계'];
    if (!byRegion[region]) {
      byRegion[region] = {};
      STAGE_ORDER.forEach(s => byRegion[region][s] = 0);
    }
    if (STAGE_ORDER.includes(stage)) {
      byRegion[region][stage]++;
      totals[stage]++;
    }
  });

  const regions = sortRegions(Object.keys(byRegion));

  // 내 지역 하이라이트
  const myRegions = allowed || [];

  el.innerHTML = `
    <div class="stat-row c4" style="margin-bottom:20px;">
      <div class="stat-card base" style="text-align:center;">
        <div class="stat-label">전체 인원</div>
        <div class="stat-val" style="font-size:22px;">${STATE.nujeok.length}</div>
      </div>
      <div class="stat-card base" style="text-align:center;">
        <div class="stat-label">활성 인원</div>
        <div class="stat-val reg" style="font-size:22px;">${active.length}</div>
      </div>
      <div class="stat-card base" style="text-align:center;">
        <div class="stat-label">탈락 인원</div>
        <div class="stat-val" style="font-size:22px;color:var(--red);">${STATE.tallag.length}</div>
      </div>
      <div class="stat-card base" style="text-align:center;">
        <div class="stat-label">내 지역</div>
        <div class="stat-val reg" style="font-size:16px;">${myRegions.join(', ') || '전체'}</div>
      </div>
    </div>

    <div style="font-size:13px;font-weight:700;color:var(--text2);margin-bottom:10px;">지역별 단계 현황</div>
    <div class="tw">
      <table class="bt">
        <thead>
          <tr>
            <th>지역</th>
            ${STAGE_ORDER.map(s => `<th style="color:${STAGE_COLORS[s]?.c||'#555'}">${s}</th>`).join('')}
            <th>합계</th>
          </tr>
        </thead>
        <tbody>
          ${regions.map(region => {
            const isMyRegion = allowed === null || myRegions.includes(region);
            const rowStyle   = isMyRegion && allowed !== null
              ? 'background:var(--reg-light);font-weight:700;'
              : '';
            const total = STAGE_ORDER.reduce((sum, s) => sum + (byRegion[region][s]||0), 0);
            return `<tr style="${rowStyle}">
              <td>
                ${isMyRegion && allowed !== null
                  ? `<span style="color:var(--reg2);font-weight:700;">★ ${region}</span>`
                  : region}
              </td>
              ${STAGE_ORDER.map(s => `<td style="text-align:center;">${byRegion[region][s]||0}</td>`).join('')}
              <td style="text-align:center;font-weight:700;">${total}</td>
            </tr>`;
          }).join('')}
          <tr style="background:var(--surface2);font-weight:700;">
            <td>합계</td>
            ${STAGE_ORDER.map(s => `<td style="text-align:center;">${totals[s]||0}</td>`).join('')}
            <td style="text-align:center;">${STAGE_ORDER.reduce((sum,s)=>sum+(totals[s]||0),0)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}
