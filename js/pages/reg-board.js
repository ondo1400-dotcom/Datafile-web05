// ══════════════════════════════════════════════════════
//  pages/reg-board.js — 지역 담당자 보유현황
//  찾기 이상 단계만 표시 (DB 제외)
// ══════════════════════════════════════════════════════

// 찾기 이상 단계
const VALID_STAGES = ['찾기', '합자', '육따기', '영따기', '복음방', '센확', '수신'];

function renderRegBoard() {
  const regionF = document.getElementById('reg-region-sel')?.value || '';
  const data    = STATE.nujeok
    .filter(r => !regionF || r['실적지역'] === regionF)
    .filter(r => VALID_STAGES.includes(r['단계'])); // 찾기 이상만

  const tbody = document.getElementById('reg-board-body');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text3);">데이터가 없습니다</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const tallag = isTallag(r);
    const style  = tallag ? 'opacity:.5;' : '';
    const ri     = r['__rowIndex'];

    return `<tr style="${style};cursor:pointer;" class="cr" onclick="openPersonDetail(${ri})">
      <td>
        ${stageBadge(r['단계'])}
        ${tallag ? '<span class="badge b-red" style="margin-left:4px;">탈락</span>' : ''}
      </td>
      <td><strong>${r['섭외자'] || '—'}</strong></td>
      <td>${r['인도자'] || '—'}</td>
      <td style="font-size:11px;">${r['목표개강(연도/월)'] || '—'}</td>
      <td style="font-size:11px;">${r['목표센터']          || '—'}</td>
      <td>${reportBadge(r['합자-보고일'])}</td>
      <td>${reportBadge(r['육따기-보고일'])}</td>
      <td>${reportBadge(r['따기-보고일'])}</td>
      <td>${reportBadge(r['복음방-보고일'])}</td>
    </tr>`;
  }).join('');
}
