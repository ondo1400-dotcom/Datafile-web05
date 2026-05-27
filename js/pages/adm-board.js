// ══════════════════════════════════════════════════════
//  pages/adm-board.js — 청년회 전지역 보유현황
// ══════════════════════════════════════════════════════

// 필터 상태
let _boardStages   = new Set(); // 빈 Set = 전체
let _boardRegions  = new Set(); // 빈 Set = 전체
let _boardCheckItems = new Set(); // 보여줄 체크항목

let _boardStageDropOpen  = false;
let _boardRegionDropOpen = false;
let _boardCheckDropOpen  = false;

function renderBoardTable() {
  const kaigangF = document.getElementById('board-kaigang-sel')?.value || '';

  _fillBoardCheckItems();

  const findingRows = (STATE.dbFindings || [])
    .filter(r => r['구분'] === '찾기')
    .map(r => ({ ...r, '단계': '찾기', _isDbFinding: true }));

  const data = [...STATE.nujeok, ...findingRows].filter(r => {
    if (_boardStages.size > 0 && !_boardStages.has(r['단계'])) return false;
    if (_boardRegions.size > 0 && !_boardRegions.has(r['실적지역'])) return false;
    if (kaigangF) {
      const matchKaigang = r['목표개강(연도/월)'] === kaigangF;
      const matchPrev    = r['이전개강'] === kaigangF;
      if (!matchKaigang && !matchPrev) return false;
    }
    return true;
  });

  const countEl = document.getElementById('board-count');
  if (countEl) countEl.textContent = `총 ${data.length}명`;

  const checkMap  = buildCheckMap();
  const showItems = _boardCheckItems.size > 0
    ? STATE.checkItems.filter(i => _boardCheckItems.has(i))
    : STATE.checkItems;

  // 테이블 헤더 동적 생성
  const thead = document.querySelector('#sc-adm-board table thead tr');
  if (thead) {
    thead.innerHTML = `
      <th>단계</th><th>실적지역</th><th>인도자</th><th>섭외자</th>
      <th>목표개강</th><th>목표센터</th>
      ${showItems.map(i => `<th style="font-size:11px;text-align:center;max-width:80px;">${i}</th>`).join('')}
    `;
  }

  const tbody = document.getElementById('board-body');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="${6 + showItems.length}" style="text-align:center;padding:20px;color:var(--text3);">해당 데이터 없음</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map(r => {
    const tallag  = isTallag(r);
    const style   = tallag ? 'opacity:.5;' : '';
    const key     = makeKey(r);
    const ri      = r['__rowIndex'];
    const clickFn = r._isDbFinding ? `openDbFindingDetail(${ri})` : `openPersonDetail(${ri})`;

    const checkCells = showItems.map(item => {
      const ck      = key + '||' + item;
      const checked = checkMap[ck]?.checked;
      return `<td style="text-align:center;">${checked ? '✅' : '⬜'}</td>`;
    }).join('');

    return `<tr style="${style}cursor:pointer;" class="cr" onclick="${clickFn}">
      <td>${stageBadge(r['단계'])} ${tallag ? '<span class="badge b-red">탈락</span>' : ''}</td>
      <td>${r['실적지역'] || '—'}</td>
      <td>${r['인도자']   || '—'}</td>
      <td>${r['섭외자']   || '—'}</td>
      <td style="font-size:11px;">${r['목표개강(연도/월)'] || '—'}</td>
      <td style="font-size:11px;">${r['목표센터'] || '—'}</td>
      ${checkCells}
    </tr>`;
  }).join('');
}

function _fillBoardCheckItems() {
  // 체크항목 드롭다운 초기화 (처음 한 번만)
  if (_boardCheckItems.size === 0 && STATE.checkItems.length > 0) {
    // 기본: 전체 표시
  }
}

// ─── 단계 필터 ───
function toggleBoardStageFilter() {
  _boardStageDropOpen = !_boardStageDropOpen;
  _boardRegionDropOpen = false;
  _boardCheckDropOpen  = false;
  document.getElementById('board-region-drop').style.display  = 'none';
  document.getElementById('board-check-drop').style.display   = 'none';
  buildBoardStageUI();
  document.getElementById('board-stage-drop').style.display = _boardStageDropOpen ? 'block' : 'none';
}

function buildBoardStageUI() {
  const container = document.getElementById('board-stage-drop');
  if (!container) return;
  container.innerHTML = `
    <div style="padding:8px;background:#fff;border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:150px;">
      <div style="font-size:11px;color:var(--text3);margin-bottom:4px;">단계 선택 (복수 가능)</div>
      <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer;">
        <input type="checkbox" id="board-stage-all" ${_boardStages.size===0?'checked':''}
          onchange="toggleBoardAllStages(this)"> 전체
      </label>
      ${STAGE_ORDER.map(s => {
        const sc = STAGE_COLORS[s] || {bg:'#f0f0f0',c:'#555'};
        return `<label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer;">
          <input type="checkbox" value="${s}" ${_boardStages.has(s)||_boardStages.size===0?'checked':''}
            onchange="toggleBoardStage('${s}',this)">
          <span style="background:${sc.bg};color:${sc.c};padding:1px 6px;border-radius:8px;font-weight:700;">${s}</span>
        </label>`;
      }).join('')}
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
        <button class="btn adm-pri" style="width:100%;font-size:12px;"
          onclick="document.getElementById('board-stage-drop').style.display='none';_boardStageDropOpen=false;renderBoardTable()">적용</button>
      </div>
    </div>`;
}

function toggleBoardAllStages(cb) {
  if (cb.checked) {
    _boardStages = new Set();
    document.querySelectorAll('#board-stage-drop input[value]').forEach(c => c.checked = true);
  } else {
    _boardStages = new Set(['__none__']);
    document.querySelectorAll('#board-stage-drop input[value]').forEach(c => c.checked = false);
  }
}

function toggleBoardStage(s, cb) {
  _boardStages.delete('__none__');
  cb.checked ? _boardStages.add(s) : _boardStages.delete(s);
  const allCb = document.getElementById('board-stage-all');
  if (allCb) allCb.checked = _boardStages.size === 0;
}

// ─── 지역 필터 ───
function toggleBoardRegionFilter() {
  _boardRegionDropOpen = !_boardRegionDropOpen;
  _boardStageDropOpen  = false;
  _boardCheckDropOpen  = false;
  document.getElementById('board-stage-drop').style.display = 'none';
  document.getElementById('board-check-drop').style.display = 'none';
  buildBoardRegionUI();
  document.getElementById('board-region-drop').style.display = _boardRegionDropOpen ? 'block' : 'none';
}

function buildBoardRegionUI() {
  const container = document.getElementById('board-region-drop');
  if (!container) return;
  const regions = sortRegions([...new Set(STATE.nujeok.map(r => r['실적지역']).filter(Boolean))]);
  container.innerHTML = `
    <div style="padding:8px;background:#fff;border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:140px;">
      <div style="font-size:11px;color:var(--text3);margin-bottom:4px;">지역 선택 (복수 가능)</div>
      <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer;">
        <input type="checkbox" id="board-region-all" ${_boardRegions.size===0?'checked':''}
          onchange="toggleBoardAllRegions(this)"> 전체
      </label>
      ${regions.map(r => `
        <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer;">
          <input type="checkbox" value="${r}" ${_boardRegions.has(r)||_boardRegions.size===0?'checked':''}
            onchange="toggleBoardRegion('${r}',this)">
          ${r}
        </label>`).join('')}
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
        <button class="btn adm-pri" style="width:100%;font-size:12px;"
          onclick="document.getElementById('board-region-drop').style.display='none';_boardRegionDropOpen=false;renderBoardTable()">적용</button>
      </div>
    </div>`;
}

function toggleBoardAllRegions(cb) {
  if (cb.checked) {
    _boardRegions = new Set();
    document.querySelectorAll('#board-region-drop input[value]').forEach(c => c.checked = true);
  } else {
    _boardRegions = new Set(['__none__']);
    document.querySelectorAll('#board-region-drop input[value]').forEach(c => c.checked = false);
  }
}

function toggleBoardRegion(r, cb) {
  _boardRegions.delete('__none__');
  cb.checked ? _boardRegions.add(r) : _boardRegions.delete(r);
  const allCb = document.getElementById('board-region-all');
  if (allCb) allCb.checked = _boardRegions.size === 0;
}

// ─── 체크항목 필터 ───
function toggleBoardCheckFilter() {
  _boardCheckDropOpen = !_boardCheckDropOpen;
  _boardStageDropOpen = false;
  _boardRegionDropOpen = false;
  document.getElementById('board-stage-drop').style.display  = 'none';
  document.getElementById('board-region-drop').style.display = 'none';
  buildBoardCheckUI();
  document.getElementById('board-check-drop').style.display = _boardCheckDropOpen ? 'block' : 'none';
}

function buildBoardCheckUI() {
  const container = document.getElementById('board-check-drop');
  if (!container) return;
  container.innerHTML = `
    <div style="padding:8px;background:#fff;border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:180px;">
      <div style="font-size:11px;color:var(--text3);margin-bottom:4px;">체크항목 선택</div>
      <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer;">
        <input type="checkbox" id="board-check-all" ${_boardCheckItems.size===0?'checked':''}
          onchange="toggleBoardAllChecks(this)"> 전체
      </label>
      ${STATE.checkItems.map(i => `
        <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer;">
          <input type="checkbox" value="${i}" ${_boardCheckItems.has(i)||_boardCheckItems.size===0?'checked':''}
            onchange="toggleBoardCheck('${i}',this)">
          ${i}
        </label>`).join('')}
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
        <button class="btn adm-pri" style="width:100%;font-size:12px;"
          onclick="document.getElementById('board-check-drop').style.display='none';_boardCheckDropOpen=false;renderBoardTable()">적용</button>
      </div>
    </div>`;
}

function toggleBoardAllChecks(cb) {
  if (cb.checked) {
    _boardCheckItems = new Set();
    document.querySelectorAll('#board-check-drop input[value]').forEach(c => c.checked = true);
  } else {
    _boardCheckItems = new Set(['__none__']);
    document.querySelectorAll('#board-check-drop input[value]').forEach(c => c.checked = false);
  }
}

function toggleBoardCheck(i, cb) {
  _boardCheckItems.delete('__none__');
  cb.checked ? _boardCheckItems.add(i) : _boardCheckItems.delete(i);
  const allCb = document.getElementById('board-check-all');
  if (allCb) allCb.checked = _boardCheckItems.size === 0;
}
