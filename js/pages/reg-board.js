// ══════════════════════════════════════════════════════
//  pages/reg-board.js — 지역 담당자 보유현황
// ══════════════════════════════════════════════════════

const VALID_STAGES = ['찾기', '합자', '육따기', '영따기', '복음방', '센확', '수신'];

function renderRegBoard() {
  const regionF  = document.getElementById('reg-region-sel')?.value  || '';
  const kaigangF = document.getElementById('reg-kaigang-sel')?.value || '';
  const centerF  = document.getElementById('reg-center-sel')?.value  || '';
  const stageF   = document.getElementById('reg-stage-sel')?.value   || '';
  const sortVal  = document.getElementById('reg-sort-sel')?.value    || 'stage-asc';

  // 필터 드롭다운 옵션 채우기
  _fillRegBoardSelects();

  // 만남 데이터를 섭외자+인도자 키로 인덱싱
  const meetMap = {};
  (STATE.meets || []).forEach(m => {
    const key = (m['섭외자'] || '') + '|' + (m['인도자'] || '');
    if (!meetMap[key] || (m._date && (!meetMap[key]._date || m._date > meetMap[key]._date))) {
      meetMap[key] = m;
    }
  });

  let data = STATE.nujeok
    .filter(r => VALID_STAGES.includes(r['단계']))
    .filter(r => !regionF  || r['실적지역']          === regionF)
    .filter(r => !kaigangF || r['목표개강(연도/월)']  === kaigangF)
    .filter(r => !centerF  || r['목표센터']           === centerF)
    .filter(r => !stageF   || r['단계']               === stageF);

  // 정렬
  data = _sortRegBoard(data, meetMap, sortVal);

  const countEl = document.getElementById('reg-board-count');
  if (countEl) countEl.textContent = `${data.length}명`;

  const tbody = document.getElementById('reg-board-body');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3);">데이터가 없습니다</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const tallag  = isTallag(r);
    const style   = tallag ? 'opacity:.5;' : '';
    const ri      = r['__rowIndex'];
    const meetKey = (r['섭외자'] || '') + '|' + (r['인도자'] || '');
    const meet    = meetMap[meetKey];
    const meetDate = meet?._date ? fmtMD(meet._date) : (meet?.['다음만남일'] || '—');
    const meetPurpose = meet?.['다음만남목적'] || '—';

    return `<tr style="${style}cursor:pointer;" class="cr" onclick="openPersonDetail(${ri})">
      <td>
        ${stageBadge(r['단계'])}
        ${tallag ? '<span class="badge b-red" style="margin-left:4px;">탈락</span>' : ''}
      </td>
      <td><strong>${r['섭외자'] || '—'}</strong></td>
      <td style="font-size:12px;">${r['인도자'] || '—'}</td>
      <td style="font-size:12px;">${r['교사'] || '—'}</td>
      <td style="font-size:12px;font-weight:600;color:var(--reg2);">${meetDate}</td>
      <td style="font-size:11px;color:var(--text2);">${meetPurpose}</td>
    </tr>`;
  }).join('');
}

function _sortRegBoard(data, meetMap, sortVal) {
  const stageIndex = s => STAGE_ORDER.indexOf(s);

  return [...data].sort((a, b) => {
    if (sortVal === 'stage-asc')  return stageIndex(a['단계']) - stageIndex(b['단계']);
    if (sortVal === 'stage-desc') return stageIndex(b['단계']) - stageIndex(a['단계']);

    const keyA = (a['섭외자'] || '') + '|' + (a['인도자'] || '');
    const keyB = (b['섭외자'] || '') + '|' + (b['인도자'] || '');
    const dA   = meetMap[keyA]?._date?.getTime() || 0;
    const dB   = meetMap[keyB]?._date?.getTime() || 0;

    if (sortVal === 'meet-asc')  return dA - dB;
    if (sortVal === 'meet-desc') return dB - dA;
    return 0;
  });
}

function _fillRegBoardSelects() {
  const data = STATE.nujeok.filter(r => VALID_STAGES.includes(r['단계']));

  _fillSelect('reg-region-sel',  [...new Set(data.map(r => r['실적지역']).filter(Boolean))].sort());
  _fillSelect('reg-kaigang-sel', [...new Set(data.map(r => r['목표개강(연도/월)']).filter(Boolean))].sort());
  _fillSelect('reg-center-sel',  [...new Set(data.map(r => r['목표센터']).filter(Boolean))].sort());
}

function _fillSelect(id, options) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const cur = sel.value;
  const opts = ['<option value="">전체</option>',
    ...options.map(v => `<option${v === cur ? ' selected' : ''}>${v}</option>`)
  ];
  sel.innerHTML = opts.join('');
}
