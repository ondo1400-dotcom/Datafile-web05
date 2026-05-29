// ══════════════════════════════════════════════════════
//  pages/reg-board.js — 지역 담당자 보유현황
// ══════════════════════════════════════════════════════

const VALID_STAGES = ['찾기', '합자', '육따기', '영따기', '따기', '복음방', '센확', '수신'];

// 필터/정렬 상태
let _regBoardShowTallag = false;
let _colFilters   = {};  // { colKey: Set } — 빈 Set = 전체 허용
let _colSortState = { col: 'stage', dir: 'asc' };
let _openColDrop  = null;
let _cfTempSet    = null;

// ─── 데이터 빌드 헬퍼 ───
function _buildMeetMap() {
  const meetMap = {};
  (STATE.meets || []).forEach(m => {
    const key = (m['섭외자'] || '') + '|' + (m['인도자'] || '');
    if (!meetMap[key] || (m._date && (!meetMap[key]._date || m._date > meetMap[key]._date))) {
      meetMap[key] = m;
    }
  });
  return meetMap;
}

function _buildBaseData() {
  const kaigangF = document.getElementById('reg-kaigang-sel')?.value || '';
  const centerF  = document.getElementById('reg-center-sel')?.value  || '';
  const findingRows = (STATE.dbFindings || [])
    .filter(r => r['구분'] === '찾기')
    .map(r => ({ ...r, '단계': '찾기', _isDbFinding: true }));
  const allNujeok = [...STATE.nujeok, ...STATE.tallag.map(r => ({ ...r, _isTallag: true }))];
  return [...allNujeok.filter(r => VALID_STAGES.includes(r['단계'])), ...findingRows]
    .filter(r => {
      const allowed = getAllowedRegions();
      if (allowed !== null && !allowed.includes(r['실적지역'])) return false;
      return true;
    })
    .filter(r => !kaigangF || r['목표개강(연도/월)'] === kaigangF || r['이전개강'] === kaigangF)
    .filter(r => !centerF  || r['목표센터'] === centerF)
    .filter(r => _regBoardShowTallag ? true : !isTallag(r) && !r['_isTallag']);
}

function _getRowColVal(col, row, meetMap) {
  if (col === 'stage')   return row['단계'] || '';
  if (col === 'region')  return row['실적지역'] || '';
  if (col === 'seobja')  return row['섭외자'] || '';
  if (col === 'indoja')  return row['인도자'] || '';
  if (col === 'gyosa')   return row['교사'] || '';
  if (col === 'meet') {
    const mk = (row['섭외자']||'') + '|' + (row['인도자']||'');
    const m  = meetMap[mk];
    return m?._date ? fmtMD(m._date) : (m?.['다음만남일'] || '—');
  }
  if (col === 'purpose') {
    const mk = (row['섭외자']||'') + '|' + (row['인도자']||'');
    return meetMap[mk]?.['다음만남목적'] || '—';
  }
  return '';
}

function _applyColFilters(data, meetMap, excludeCol) {
  return data.filter(r => {
    for (const [col, filterSet] of Object.entries(_colFilters)) {
      if (col === excludeCol) continue;
      if (!filterSet || filterSet.size === 0) continue;
      if (filterSet.has('__none__')) return false;
      const val = _getRowColVal(col, r, meetMap);
      if (!filterSet.has(val)) return false;
    }
    return true;
  });
}

function hasColFilter(col) {
  const s = _colFilters[col];
  return !!(s && s.size > 0);
}

function _updateColIcons() {
  ['stage','region','seobja','indoja','gyosa','meet','purpose'].forEach(col => {
    const el = document.getElementById('cfi-' + col);
    if (!el) return;
    const isSort     = _colSortState.col === col;
    const isFiltered = hasColFilter(col);
    if (isSort) {
      el.textContent = _colSortState.dir === 'asc' ? ' ▲' : ' ▼';
      el.className   = 'col-sort-icon active';
    } else {
      el.textContent = isFiltered ? ' ▼' : ' ⬍';
      el.className   = isFiltered ? 'col-sort-icon filtered' : 'col-sort-icon';
    }
  });
}

function renderRegBoard() {
  const findingRows = (STATE.dbFindings || [])
    .filter(r => r['구분'] === '찾기')
    .map(r => ({ ...r, '단계': '찾기', _isDbFinding: true }));

  const tallagRows = _regBoardShowTallag
    ? (STATE.tallag || []).map(r => ({ ...r, _isTallag: true }))
    : [];
  const allNujeok = [...(STATE.nujeok || []), ...tallagRows];
  let data = [...allNujeok.filter(r => VALID_STAGES.includes(r['단계'])), ...findingRows];

  const allowed = getAllowedRegions();
  if (allowed !== null) {
    data = data.filter(r => allowed.includes(r['실적지역']));
  }

  if (window.NotionTableApp) {
    window.NotionTableApp.mountBoardTable('reg-board-notion-root', data, {
      source: 'reg-board',
      onRefresh: () => { if (typeof loadData === 'function') loadData().then(renderRegBoard); },
    });
  }
}

function _sortRegBoard(data, meetMap) {
  const { col, dir } = _colSortState;
  const mul      = dir === 'asc' ? 1 : -1;
  const stageIdx = s => STAGE_ORDER.indexOf(s);
  return [...data].sort((a, b) => {
    if (col === 'stage')  return mul * (stageIdx(a['단계']) - stageIdx(b['단계']));
    if (col === 'region') return mul * (a['실적지역']||'').localeCompare(b['실적지역']||'');
    if (col === 'seobja') return mul * (a['섭외자']||'').localeCompare(b['섭외자']||'');
    if (col === 'indoja') return mul * (a['인도자']||'').localeCompare(b['인도자']||'');
    if (col === 'gyosa')  return mul * (a['교사']||'').localeCompare(b['교사']||'');
    if (col === 'meet') {
      const kA = (a['섭외자']||'')+'|'+(a['인도자']||'');
      const kB = (b['섭외자']||'')+'|'+(b['인도자']||'');
      return mul * ((meetMap[kA]?._date?.getTime()||0) - (meetMap[kB]?._date?.getTime()||0));
    }
    if (col === 'purpose') {
      const kA = (a['섭외자']||'')+'|'+(a['인도자']||'');
      const kB = (b['섭외자']||'')+'|'+(b['인도자']||'');
      return mul * (meetMap[kA]?.['다음만남목적']||'').localeCompare(meetMap[kB]?.['다음만남목적']||'');
    }
    return stageIdx(a['단계']) - stageIdx(b['단계']);
  });
}

function _fillRegBoardSelects() {
  const data = STATE.nujeok.filter(r => VALID_STAGES.includes(r['단계']));
  _fillSelect('reg-kaigang-sel', [...new Set(data.map(r => r['목표개강(연도/월)']).filter(Boolean))].sort());
  _fillSelect('reg-center-sel',  [...new Set(data.map(r => r['목표센터']).filter(Boolean))].sort());
}

function _fillSelect(id, options) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = ['<option value="">전체</option>',
    ...options.map(v => `<option${v === cur ? ' selected' : ''}>${v}</option>`)
  ].join('');
}

// ─── 탈락 토글 ───
function toggleTallag() {
  _regBoardShowTallag = !_regBoardShowTallag;
  const btn = document.getElementById('reg-tallag-toggle');
  if (btn) {
    btn.textContent = _regBoardShowTallag ? '탈락 숨기기' : '탈락 보기';
    btn.style.background = _regBoardShowTallag ? 'var(--red)' : '';
    btn.style.color      = _regBoardShowTallag ? '#fff' : '';
  }
  renderRegBoard();
}

// ─── 컬럼 헤더 필터 드롭다운 (엑셀 스타일) ───
function openColFilter(event, col) {
  event.stopPropagation();
  if (_openColDrop === col) { closeColFilter(); return; }
  _openColDrop = col;

  const meetMap  = _buildMeetMap();
  const baseData = _buildBaseData();
  const filtered = _applyColFilters(baseData, meetMap, col);

  const valSet = new Set();
  filtered.forEach(r => {
    const v = _getRowColVal(col, r, meetMap);
    if (v && v !== '—') valSet.add(v);
  });

  let values = [...valSet];
  if (col === 'stage') {
    values = VALID_STAGES.filter(s => valSet.has(s));
  } else {
    values.sort((a, b) => a.localeCompare(b));
  }

  const curFilter  = _colFilters[col] || new Set();
  _cfTempSet       = new Set(curFilter);
  const allChecked = _cfTempSet.size === 0;
  const sortUp     = _colSortState.col === col && _colSortState.dir === 'asc';
  const sortDown   = _colSortState.col === col && _colSortState.dir === 'desc';

  const drop = document.getElementById('col-filter-drop');
  if (!drop) return;

  drop.innerHTML = `<div class="col-filter-panel">
    <div class="cf-sort-row">
      <button class="btn${sortUp?' reg-pri':''}" onclick="setColSort('${col}','asc')">▲ 오름차순</button>
      <button class="btn${sortDown?' reg-pri':''}" onclick="setColSort('${col}','desc')">▼ 내림차순</button>
    </div>
    ${values.length > 10 ? `<input type="text" class="cf-search" placeholder="검색..." oninput="filterCfSearch(this.value)">` : ''}
    <div id="cf-value-list" class="cf-list">
      <label class="cf-item cf-all-item">
        <input type="checkbox" id="cf-all-cb" ${allChecked?'checked':''} onchange="toggleCfAll(this)">
        <strong>전체</strong>
      </label>
      ${values.map(v => {
        const checked = allChecked || _cfTempSet.has(v);
        const esc = v.replace(/"/g,'&quot;').replace(/'/g,'&#39;');
        if (col === 'stage') {
          const sc = STAGE_COLORS[v] || {bg:'#f0f0f0',c:'#555'};
          return `<label class="cf-item">
            <input type="checkbox" class="cf-val-cb" value="${esc}" ${checked?'checked':''} onchange="toggleCfVal(this)">
            <span class="stage-tag" style="background:${sc.bg};color:${sc.c}">${v}</span>
          </label>`;
        }
        return `<label class="cf-item">
          <input type="checkbox" class="cf-val-cb" value="${esc}" ${checked?'checked':''} onchange="toggleCfVal(this)">
          <span class="cf-val-text">${v}</span>
        </label>`;
      }).join('')}
    </div>
    <div class="cf-actions">
      <button class="btn" onclick="resetCfCol('${col}')">초기화</button>
      <button class="btn reg-pri" onclick="applyCfCol('${col}')">적용</button>
    </div>
  </div>`;

  const rect = event.currentTarget.getBoundingClientRect();
  drop.style.display = 'block';
  drop.style.top  = (rect.bottom + 4) + 'px';
  drop.style.left = Math.min(rect.left, window.innerWidth - 260) + 'px';
}

function closeColFilter() {
  _openColDrop = null;
  _cfTempSet   = null;
  const drop = document.getElementById('col-filter-drop');
  if (drop) drop.style.display = 'none';
}

function filterCfSearch(val) {
  const q = (val || '').toLowerCase();
  document.querySelectorAll('#cf-value-list .cf-val-cb').forEach(cb => {
    const label = cb.closest('label');
    if (label) label.style.display = cb.value.toLowerCase().includes(q) ? '' : 'none';
  });
}

function toggleCfAll(cb) {
  if (cb.checked) {
    _cfTempSet = new Set();
    document.querySelectorAll('#cf-value-list .cf-val-cb').forEach(c => c.checked = true);
  } else {
    _cfTempSet = new Set(['__none__']);
    document.querySelectorAll('#cf-value-list .cf-val-cb').forEach(c => c.checked = false);
  }
}

function toggleCfVal(cb) {
  if (_cfTempSet.has('__none__')) _cfTempSet = new Set();
  if (cb.checked) _cfTempSet.add(cb.value); else _cfTempSet.delete(cb.value);
  const allCbs     = document.querySelectorAll('#cf-value-list .cf-val-cb');
  const allChecked = Array.from(allCbs).every(c => c.checked);
  if (allChecked) _cfTempSet = new Set();
  const allCb = document.getElementById('cf-all-cb');
  if (allCb) allCb.checked = allChecked;
}

function resetCfCol(col) {
  _colFilters[col] = new Set();
  closeColFilter();
  renderRegBoard();
}

function applyCfCol(col) {
  if (_cfTempSet !== null) _colFilters[col] = new Set(_cfTempSet);
  closeColFilter();
  renderRegBoard();
}

function setColSort(col, dir) {
  _colSortState = { col, dir };
  applyCfCol(col);
}

document.addEventListener('click', e => {
  const drop = document.getElementById('col-filter-drop');
  if (_openColDrop && drop && !drop.contains(e.target)) closeColFilter();
});

// ─── 심의요청 모달 ───
let _reviewRow   = null;
let _reviewDbRow = null;

const _REVIEW_COMMON_FIELDS = [
  { key: '실적지역',                label: '실적지역',                required: true },
  { key: '인도자부서/지역/팀/구역', label: '인도자부서/지역/팀/구역', required: true, wide: true },
  { key: '인도자',                  label: '인도자',                  required: true },
  { key: '교사부서/지역/팀/구역',   label: '교사부서/지역/팀/구역',   required: true, wide: true },
  { key: '교사',                    label: '교사',                    required: true },
  { key: '다음만남일',              label: '다음만남일',              type: 'date', required: true },
  { key: '다음만남시간',            label: '다음만남시간',            type: 'time', required: true },
  { key: '다음만남목적',            label: '다음만남목적',            required: true, wide: true },
];

const _REVIEW_STAGE_FIELDS = {
  '찾기': [],
  '합자':  [
    { key: '따기예정일', label: '따기예정일', type: 'date', required: true },
  ],
  '육따기': [
    { key: '따기주간횟수', label: '따기주간횟수', required: true },
    { key: '따기기간',     label: '따기기간',     required: true },
    { key: '고정요일',     label: '고정요일',     required: true },
  ],
  '영따기': [
    { key: '따기유형',     label: '따기유형',     required: true },
    { key: '따기단계',     label: '따기단계',     required: true },
    { key: '첫수업예정일', label: '첫수업예정일', type: 'date', required: true },
  ],
  '복음방': [
    { key: '섬김이부서/지역/팀/구역', label: '섬김이부서/지역/팀/구역', required: true, wide: true },
    { key: '섬김이',          label: '섬김이',          required: true },
    { key: '마팔수강번호',    label: '마팔수강번호',    required: true },
    { key: '복음방수업방식',  label: '복음방수업방식',  required: true },
    { key: '첫수업진행일',    label: '첫수업진행일',    type: 'date', required: true },
    { key: '첫수업과목',      label: '첫수업과목',      required: true },
  ],
  '지역장': [
    { key: '복음방총횟수',     label: '복음방총횟수',     required: true },
    { key: '복음방체크리스트', label: '복음방체크리스트', required: true, wide: true },
    { key: '개강진면접여부',   label: '개강진면접여부',   required: true },
    { key: '신천지오픈여부',   label: '신천지오픈여부',   required: true },
    { key: '센터수강여부',     label: '센터수강여부',     required: true },
    { key: '재입교자여부',     label: '재입교자여부',     required: true },
  ],
};

function _toDateVal(v) {
  if (!v) return '';
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : '';
}

function _toTimeVal(v) {
  if (!v) return '';
  const s = String(v);
  const m = s.match(/T(\d{2}):(\d{2})/) || s.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : s;
}

function renderReviewFormFields(stage) {
  const container = document.getElementById('review-form-fields');
  if (!container) return;
  const data       = _reviewDbRow || {};
  const stageExtra = _REVIEW_STAGE_FIELDS[stage] || [];

  const renderField = f => {
    const raw = data[f.key] !== undefined ? data[f.key] : '';
    const val = f.type === 'date' ? _toDateVal(raw) : f.type === 'time' ? _toTimeVal(raw) : String(raw || '');
    const esc = val.replace(/"/g, '&quot;');
    const span = f.wide ? 'grid-column:span 2;' : '';
    return `<div style="${span}">
      <div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:3px;">${f.label}</div>
      <input data-rv-key="${f.key}" type="${f.type || 'text'}" value="${esc}"
        class="top-sel" style="width:100%;box-sizing:border-box;" oninput="validateReviewForm()" onchange="validateReviewForm()">
    </div>`;
  };

  let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
    + _REVIEW_COMMON_FIELDS.map(renderField).join('')
    + '</div>';

  if (stage === '합자' || stage === '찾기') {
    const baseKeys = ['목표개강(연도/월)','목표센터','섭외자','출생연도','성별','사는곳','하는일','종교','신앙년수','편입부서','섭외유형','2차연결유형'];
    const baseDisplay = { ...data, '편입부서': '청년' };
    html += `<div style="font-size:11px;font-weight:700;color:var(--text2);margin:12px 0 8px;padding-top:10px;border-top:1px solid var(--border);">찾기 기본 정보 확인</div>`;
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--bg2,#f5f5f5);padding:10px;border-radius:6px;margin-bottom:4px;">';
    baseKeys.forEach(k => {
      html += `<div><div style="font-size:10px;color:var(--text3);margin-bottom:2px;">${k}</div><div style="font-size:12px;font-weight:600;">${baseDisplay[k] || '—'}</div></div>`;
    });
    html += '</div>';
  }

  if (stageExtra.length) {
    html += `<div style="font-size:11px;font-weight:700;color:var(--text2);margin:12px 0 8px;padding-top:10px;border-top:1px solid var(--border);">[${stage}] 추가 정보</div>`;
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
      + stageExtra.map(renderField).join('')
      + '</div>';
  }

  container.innerHTML = html;
}

function validateReviewForm() {
  const inputs = document.querySelectorAll('#review-form-fields [data-rv-key]');
  let allFilled = true;
  inputs.forEach(inp => {
    const empty = inp.value.trim() === '';
    inp.style.borderColor = empty ? 'var(--red)' : '';
    if (empty) allFilled = false;
  });
  const btn = document.getElementById('review-submit-btn');
  if (btn) btn.disabled = !allFilled;
}

function onReviewStageChange() {
  const stage = document.getElementById('review-stage-sel')?.value;
  if (!stage) return;
  renderReviewFormFields(stage);
  validateReviewForm();
}

function openRequestReviewModal(rowIndex, source) {
  if (source === 'db') {
    _reviewRow = (STATE.dbFindings || []).find(r => r['__rowIndex'] === rowIndex)
              || (STATE.nujeok || []).find(r => r['__rowIndex'] === rowIndex);
  } else if (source === 'nujeok') {
    _reviewRow = STATE.nujeok.find(r => r['__rowIndex'] === rowIndex);
  } else {
    _reviewRow = STATE.nujeok.find(r => r['__rowIndex'] === rowIndex)
      || (STATE.dbFindings || []).find(r => r['__rowIndex'] === rowIndex);
  }
  if (!_reviewRow) return;

  _reviewDbRow = (STATE.dbFindings || []).find(d =>
    d['섭외자'] === _reviewRow['섭외자'] && d['인도자'] === _reviewRow['인도자']
    && d['실적지역'] === _reviewRow['실적지역']
  ) || _reviewRow;

  const curStage     = _reviewRow['단계'] || _reviewRow['구분'] || '찾기';
  const defaultStage = _REVIEW_STAGE_FIELDS[curStage] !== undefined ? curStage : '합자';

  const sel = document.getElementById('review-stage-sel');
  if (sel) sel.value = defaultStage;

  const nameEl = document.getElementById('review-name');
  if (nameEl) nameEl.textContent = _reviewRow['섭외자'] || '—';

  const stageTxt = document.getElementById('review-stage-txt');
  if (stageTxt) stageTxt.textContent = curStage !== defaultStage ? `${curStage} → ${defaultStage}` : curStage;

  renderReviewFormFields(defaultStage);
  validateReviewForm();
  document.getElementById('request-review-modal').classList.add('show');
}

function closeRequestReviewModal() {
  document.getElementById('request-review-modal').classList.remove('show');
  _reviewRow   = null;
  _reviewDbRow = null;
  const btn = document.getElementById('review-submit-btn');
  if (btn) { btn.textContent = '심의 요청'; btn.disabled = true; }
  const fields = document.getElementById('review-form-fields');
  if (fields) fields.innerHTML = '';
}

async function submitRequestReview() {
  if (!_reviewRow) return;
  const stage = document.getElementById('review-stage-sel').value;
  const btn   = document.getElementById('review-submit-btn');
  if (btn) { btn.textContent = '요청 중...'; btn.disabled = true; }

  const formData = {};
  document.querySelectorAll('#review-form-fields [data-rv-key]').forEach(inp => {
    formData[inp.dataset.rvKey] = inp.value.trim();
  });

  try {
    if (USE_SAMPLE) {
      showToast('✅ 심의 요청 완료 (샘플)');
      closeRequestReviewModal();
      if (STATE.currentScreen === 'adm-db') renderAdmDb(); else renderRegBoard();
      return;
    }

    const base = _reviewDbRow || _reviewRow;
    const _NUJEOK_ONLY = new Set(['단계', '이전개강']);
    const upsertData = {
      '구분': _reviewRow['단계'] || _reviewRow['구분'] || '찾기',
      ...Object.fromEntries(Object.entries(base).filter(([k]) =>
        !k.startsWith('_') && k !== 'id' && k !== 'synced_at' && !_NUJEOK_ONLY.has(k)
      )),
      ...formData,
    };

    // db_findings upsert (실적지역+섭외자+인도자 기준)
    const { data: saved, error: saveErr } = await SUPA
      .from('db_findings')
      .upsert(upsertData, { onConflict: '실적지역,섭외자,인도자' })
      .select()
      .single();
    if (saveErr) throw new Error(saveErr.message);

    // 심의요청 상태 업데이트
    const now = new Date().toISOString();
    const { error: reviewErr } = await SUPA
      .from('db_findings')
      .update({ '심의요청여부': 'Y', '심의요청일시': now, '심의단계': stage })
      .eq('id', saved.id);
    if (reviewErr) throw new Error(reviewErr.message);

    // STATE 갱신
    const { data: refreshed } = await SUPA.from('db_findings').select('*');
    STATE.dbFindings = (refreshed || []).map((r, i) => ({ ...r, __rowIndex: parseInt(r.id) || i }));

    showToast('✅ 심의 요청 완료!');
    closeRequestReviewModal();
    if (STATE.currentScreen === 'adm-db') renderAdmDb(); else renderRegBoard();
  } catch(e) {
    showToast('⚠️ 요청 실패: ' + e.message, 'error');
    if (btn) { btn.textContent = '심의 요청'; btn.disabled = false; }
  }
}
