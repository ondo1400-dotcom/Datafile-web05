// ══════════════════════════════════════════════════════
//  pages/adm-check.js — 청년회 개강 준비 체크 전체 현황
// ══════════════════════════════════════════════════════

function renderAdmCheckTable() {
  const regionF = document.getElementById('adm-check-region-sel')?.value || '';
  const people  = STATE.nujeok.filter(r => !regionF || r['실적지역'] === regionF);
  const items   = STATE.checkItems;

  // 헤더 동적 생성
  const thead = document.querySelector('#sc-adm-check table thead tr');
  if (thead) {
    thead.innerHTML =
      '<th>실적지역</th><th>인도자</th><th>섭외자</th><th>목표개강</th>'
      + items.map(i => `<th style="min-width:72px;text-align:center;">${i}</th>`).join('');
  }

  const countEl = document.getElementById('adm-check-count');
  if (countEl) countEl.textContent = `총 ${people.length}명`;

  const tbody = document.getElementById('adm-check-body');
  if (!people.length) {
    tbody.innerHTML = `<tr><td colspan="${4 + items.length}" style="text-align:center;padding:20px;color:var(--text3);">데이터 없음</td></tr>`;
    return;
  }

  const checkMap = buildCheckMap();

  tbody.innerHTML = people.map(r => {
    const key    = makeKey(r);
    const isTal  = isTallag(r);
    const rowStyle = isTal ? 'background:#f5f5f5;opacity:.6;' : '';

    const itemCells = items.map(item => {
      const ck      = key + '||' + item;
      const checked = checkMap[ck]?.checked;
      return `<td style="text-align:center;">${checked ? '✅' : '⬜'}</td>`;
    }).join('');

    return `<tr style="${rowStyle}">
      <td>${r['실적지역'] || '—'} ${isTal ? '<span class="badge b-red">탈락</span>' : ''}</td>
      <td>${r['인도자']   || '—'}</td>
      <td>${r['섭외자']   || '—'}</td>
      <td style="font-size:11px;">${r['목표개강(연도/월)'] || '—'}</td>
      ${itemCells}
    </tr>`;
  }).join('');
}
