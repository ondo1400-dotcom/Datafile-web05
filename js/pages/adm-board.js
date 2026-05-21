// ══════════════════════════════════════════════════════
//  pages/adm-board.js — 청년회 전지역 보유현황
// ══════════════════════════════════════════════════════

function renderBoardTable() {
  const regionF  = document.getElementById('board-region-sel')?.value  || '';
  const stageF   = document.getElementById('board-stage-sel')?.value   || '';
  const kaigangF = document.getElementById('board-kaigang-sel')?.value || '';

  const findingRows = (STATE.dbFindings || [])
    .filter(r => r['구분'] === '찾기')
    .map(r => ({ ...r, '단계': '찾기' }));

  const data = [...STATE.nujeok, ...findingRows].filter(r => {
    if (regionF  && r['실적지역']          !== regionF)  return false;
    if (stageF   && r['단계']              !== stageF)   return false;
    if (kaigangF && r['목표개강(연도/월)'] !== kaigangF) return false;
    return true;
  });

  const countEl = document.getElementById('board-count');
  if (countEl) countEl.textContent = `총 ${data.length}명`;

  const tbody = document.getElementById('board-body');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text3);">해당 데이터 없음</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const tallag = isTallag(r);
    const style  = tallag ? 'opacity:.5;text-decoration:line-through;' : '';

    return `<tr style="${style}">
      <td>${stageBadge(r['단계'])} ${tallag ? '<span class="badge b-red">탈락</span>' : ''}</td>
      <td>${r['실적지역'] || '—'}</td>
      <td>${r['인도자']   || '—'}</td>
      <td>${r['섭외자']   || '—'}</td>
      <td style="font-size:11px;">${r['목표개강(연도/월)'] || '—'}</td>
      <td style="font-size:11px;">${r['목표센터']          || '—'}</td>
      <td>${reportBadge(r['합자-보고일'])}</td>
      <td>${reportBadge(r['육따기-보고일'])}</td>
      <td>${reportBadge(r['따기-보고일'])}</td>
      <td>${reportBadge(r['복음방-보고일'])}</td>
    </tr>`;
  }).join('');
}
