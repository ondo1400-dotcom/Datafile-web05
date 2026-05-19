// ══════════════════════════════════════════════════════
//  pages/adm-dash.js — 청년회 종합 대시보드
// ══════════════════════════════════════════════════════

function renderAdmDash() {
  const active = STATE.nujeok.filter(r => !isTallag(r));

  // 통계 카드
  document.getElementById('ds-total').textContent  = STATE.nujeok.length;
  document.getElementById('ds-tallag').textContent = STATE.tallag.length;
  document.getElementById('ds-active').textContent = active.length;

  const totalChecks = STATE.checks.length;
  const doneChecks  = STATE.checks.filter(c => c['체크여부'] === 'Y').length;
  document.getElementById('ds-check-rate').textContent = totalChecks
    ? Math.round(doneChecks / totalChecks * 100) + '%'
    : '—';

  // 단계별 지역 집계
  const byRegion = {};
  const totals   = {};
  STAGE_ORDER.forEach(s => totals[s] = 0);

  active.forEach(r => {
    const region = r['실적지역'] || '미입력';
    const stage  = r['단계']     || '미입력';
    if (!byRegion[region]) byRegion[region] = {};
    byRegion[region][stage] = (byRegion[region][stage] || 0) + 1;
  });

  let rows = '';
  Object.entries(byRegion).sort().forEach(([region, stages]) => {
    let sum   = 0;
    let cells = STAGE_ORDER.map(s => {
      const n = stages[s] || 0;
      totals[s] += n;
      sum += n;
      return `<td style="text-align:center;border:1px solid var(--border);font-family:monospace;font-size:13px;">${n || '—'}</td>`;
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
  const checkSummary = document.getElementById('dash-check-summary');
  const activePeople = [...new Set(active.map(r => makeKey(r)))];

  if (STATE.checkItems.length) {
    checkSummary.style.gridTemplateColumns = `repeat(${Math.min(STATE.checkItems.length, 4)}, 1fr)`;
    checkSummary.innerHTML = STATE.checkItems.map(item => {
      const doneCount = STATE.checks.filter(c => c['항목명'] === item && c['체크여부'] === 'Y').length;
      const total     = activePeople.length;
      const pct       = total ? Math.round(doneCount / total * 100) : 0;
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
