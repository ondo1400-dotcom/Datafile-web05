// ══════════════════════════════════════════════════════
//  pages/reg-board.js — 지역 담당자 보유현황
// ══════════════════════════════════════════════════════

const VALID_STAGES = ['찾기', '합자', '육따기', '영따기', '따기', '복음방', '센확', '수신'];

// 필터 상태
let _regBoardStages   = new Set(); // 빈 Set = 전체
let _regBoardShowTallag = false;
let _regBoardSortDir  = 'asc'; // asc | desc

function renderRegBoard() {
  const kaigangF = document.getElementById('reg-kaigang-sel')?.value || '';
  const centerF  = document.getElementById('reg-center-sel')?.value  || '';
  const sortVal  = document.getElementById('reg-sort-sel')?.value    || 'stage-asc';

  _fillRegBoardSelects();

  // 만남 데이터 인덱싱
  const meetMap = {};
  (STATE.meets || []).forEach(m => {
    const key = (m['섭외자'] || '') + '|' + (m['인도자'] || '');
    if (!meetMap[key] || (m._date && (!meetMap[key]._date || m._date > meetMap[key]._date))) {
      meetMap[key] = m;
    }
  });

  // DB_찾기에서 찾기 단계 데이터 추가
  const findingRows = (STATE.dbFindings || [])
    .filter(r => r['구분'] === '찾기')
    .map(r => ({ ...r, '단계': '찾기', _isDbFinding: true }));

  // 전체 데이터 (누적 + 탈락 + 찾기)
  const allNujeok = [...STATE.nujeok, ...STATE.tallag.map(r => ({ ...r, _isTallag: true }))];

  let data = [...allNujeok.filter(r => VALID_STAGES.includes(r['단계'])), ...findingRows]
    .filter(r => {
      const allowed = getAllowedRegions();
      if (allowed !== null && !allowed.includes(r['실적지역'])) return false;
      return true;
    })
    .filter(r => !kaigangF || r['목표개강(연도/월)'] === kaigangF || r['이전개강'] === kaigangF)
    .filter(r => !centerF  || r['목표센터'] === centerF)
    .filter(r => {
      if (_regBoardStages.has('__none__')) return false; // 전체 해제
      return _regBoardStages.size === 0 || _regBoardStages.has(r['단계']);
    })
    .filter(r => _regBoardShowTallag ? true : !isTallag(r) && !r['_isTallag']);

  data = _sortRegBoard(data, meetMap, sortVal);

  const countEl = document.getElementById('reg-board-count');
  if (countEl) countEl.textContent = `${data.length}명`;

  const tbody = document.getElementById('reg-board-body');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text3);">데이터가 없습니다</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const tallag  = isTallag(r) || r['_isTallag'];
    const style   = tallag ? 'opacity:.5;' : '';
    const ri      = r['__rowIndex'];
    const meetKey = (r['섭외자'] || '') + '|' + (r['인도자'] || '');
    const meet    = meetMap[meetKey];
    const meetDate    = meet?._date ? fmtMD(meet._date) : (meet?.['다음만남일'] || '—');
    const meetPurpose = meet?.['다음만남목적'] || '—';

    const dbRow = (STATE.dbFindings || []).find(d =>
      d['섭외자'] === r['섭외자'] && d['인도자'] === r['인도자']
    );
    const reviewStatus = dbRow?.['심의요청여부'] === 'Y'
      ? (dbRow?.['전송완료여부'] === 'Y'
          ? '<span class="badge b-green" style="font-size:10px;">전송완료</span>'
          : dbRow?.['심의승인여부'] === 'Y'
            ? '<span class="badge b-adm" style="font-size:10px;">승인완료</span>'
            : '<span class="badge b-amber" style="font-size:10px;">심의대기</span>')
      : `<button class="btn" style="font-size:10px;padding:3px 7px;"
           onclick="event.stopPropagation();openRequestReviewModal(${ri})">심의요청</button>`;

    const clickFn = r._isDbFinding ? `openDbDetail(${ri})` : `openPersonDetail(${ri})`;
    return `<tr style="${style}cursor:pointer;" class="cr" onclick="${clickFn}">
      <td>
        ${stageBadge(r['단계'])}
        ${tallag ? '<span class="badge b-red" style="margin-left:4px;">탈락</span>' : ''}
        ${r._isDbFinding ? '<span class="badge b-gray" style="margin-left:4px;font-size:9px;">DB</span>' : ''}
      </td>
      <td><strong>${r['섭외자'] || '—'}</strong></td>
      <td style="font-size:12px;">${r['인도자'] || '—'}</td>
      <td style="font-size:12px;">${r['교사'] || '—'}</td>
      <td style="font-size:12px;font-weight:600;color:var(--reg2);">${meetDate}</td>
      <td style="font-size:11px;color:var(--text2);">${meetPurpose}</td>
      <td onclick="event.stopPropagation()">${reviewStatus}</td>
    </tr>`;
  }).join('');
}

function _sortRegBoard(data, meetMap, sortVal) {
  const stageIndex = s => STAGE_ORDER.indexOf(s);
  return [...data].sort((a, b) => {
    if (sortVal === 'stage-asc')  return stageIndex(a['단계']) - stageIndex(b['단계']);
    if (sortVal === 'stage-desc') return stageIndex(b['단계']) - stageIndex(a['단계']);
    const keyA = (a['섭외자']||'') + '|' + (a['인도자']||'');
    const keyB = (b['섭외자']||'') + '|' + (b['인도자']||'');
    const dA   = meetMap[keyA]?._date?.getTime() || 0;
    const dB   = meetMap[keyB]?._date?.getTime() || 0;
    if (sortVal === 'meet-asc')  return dA - dB;
    if (sortVal === 'meet-desc') return dB - dA;
    return 0;
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

// ─── 단계 필터 드롭다운 (구글시트 스타일) ───
let _stageDropOpen = false;

function toggleStageFilter() {
  _stageDropOpen = !_stageDropOpen;
  const drop = document.getElementById('stage-filter-drop');
  if (drop) drop.style.display = _stageDropOpen ? 'block' : 'none';
}

function closeStageFilter() {
  _stageDropOpen = false;
  const drop = document.getElementById('stage-filter-drop');
  if (drop) drop.style.display = 'none';
}

function buildStageFilterUI() {
  const container = document.getElementById('stage-filter-drop');
  if (!container) return;

  container.innerHTML = `
    <div style="padding:8px;background:#fff;border:1px solid var(--border);border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.12);min-width:160px;">
      <div style="display:flex;gap:6px;margin-bottom:8px;padding-bottom:8px;border-bottom:1px solid var(--border);">
        <button class="btn" style="flex:1;font-size:11px;padding:4px;" onclick="setSortDir('asc')">▲ 만남일 오름차순</button>
        <button class="btn" style="flex:1;font-size:11px;padding:4px;" onclick="setSortDir('desc')">▼ 만남일 내림차순</button>
      </div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:4px;">단계 선택 (복수 가능)</div>
      <label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer;">
        <input type="checkbox" id="stage-all-cb" ${_regBoardStages.size===0?'checked':''} onchange="toggleAllStages(this)"> 전체
      </label>
      ${VALID_STAGES.map(s => {
        const sc = STAGE_COLORS[s] || {bg:'#f0f0f0',c:'#555'};
        return `<label style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;cursor:pointer;">
          <input type="checkbox" value="${s}" ${_regBoardStages.has(s)||_regBoardStages.size===0?'checked':''}
            onchange="toggleStageItem('${s}',this)">
          <span style="background:${sc.bg};color:${sc.c};padding:1px 6px;border-radius:8px;font-weight:700;">${s}</span>
        </label>`;
      }).join('')}
      <div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--border);">
        <button class="btn reg-pri" style="width:100%;font-size:12px;" onclick="closeStageFilter();renderRegBoard()">적용</button>
      </div>
    </div>
  `;
}

function toggleAllStages(cb) {
  if (cb.checked) {
    // 전체 선택
    _regBoardStages = new Set();
    document.querySelectorAll('#stage-filter-drop input[type=checkbox][value]').forEach(c => c.checked = true);
  } else {
    // 전체 해제 → 아무것도 안 보임 (빈 Set이 아닌 더미값)
    _regBoardStages = new Set(['__none__']);
    document.querySelectorAll('#stage-filter-drop input[type=checkbox][value]').forEach(c => c.checked = false);
  }
}

function toggleStageItem(stage, cb) {
  // __none__ 제거
  _regBoardStages.delete('__none__');
  if (cb.checked) {
    _regBoardStages.add(stage);
  } else {
    _regBoardStages.delete(stage);
  }
  // 전체 체크박스 상태
  const allCb = document.getElementById('stage-all-cb');
  if (allCb) allCb.checked = _regBoardStages.size === 0;
}

function setSortDir(dir) {
  const sortSel = document.getElementById('reg-sort-sel');
  if (sortSel) sortSel.value = dir; closeStageFilter();
  renderRegBoard();
}

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
  '합자':  [],
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
        class="top-sel" style="width:100%;box-sizing:border-box;" oninput="validateReviewForm()">
    </div>`;
  };

  let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">'
    + _REVIEW_COMMON_FIELDS.map(renderField).join('')
    + '</div>';

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
  const allFilled = Array.from(inputs).every(inp => inp.value.trim() !== '');
  const btn = document.getElementById('review-submit-btn');
  if (btn) btn.disabled = !allFilled;
}

function onReviewStageChange() {
  const stage = document.getElementById('review-stage-sel')?.value;
  if (!stage) return;
  renderReviewFormFields(stage);
  validateReviewForm();
}

function openRequestReviewModal(rowIndex) {
  _reviewRow = STATE.nujeok.find(r => r['__rowIndex'] === rowIndex)
    || (STATE.dbFindings || []).find(r => r['__rowIndex'] === rowIndex);
  if (!_reviewRow) return;

  _reviewDbRow = (STATE.dbFindings || []).find(d =>
    d['섭외자'] === _reviewRow['섭외자'] && d['인도자'] === _reviewRow['인도자']
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
    const savePayload = {
      action: 'saveOrUpdateDbFinding',
      구분: _reviewRow['단계'] || _reviewRow['구분'] || '찾기',
      ...Object.fromEntries(Object.entries(base).filter(([k]) => !k.startsWith('__'))),
      ...formData,
    };
    if (base['__rowIndex']) savePayload['__rowIndex'] = base['__rowIndex'];

    const saveRes = await gasPost(savePayload);
    if (!saveRes.success) throw new Error(saveRes.error || '저장 실패');
    STATE.dbFindings = saveRes.dbFindings || STATE.dbFindings;

    const dbRow = (STATE.dbFindings || []).find(d =>
      d['섭외자'] === _reviewRow['섭외자'] && d['인도자'] === _reviewRow['인도자']
    );

    const res = await gasPost({
      action: 'requestReview',
      __rowIndex: dbRow?.['__rowIndex'],
      심의단계: stage,
    });
    if (!res.success) throw new Error(res.error);
    STATE.dbFindings = res.dbFindings;

    showToast('✅ 심의 요청 완료!');
    closeRequestReviewModal();
    if (STATE.currentScreen === 'adm-db') renderAdmDb(); else renderRegBoard();
  } catch(e) {
    showToast('⚠️ 요청 실패: ' + e.message, 'error');
    if (btn) { btn.textContent = '심의 요청'; btn.disabled = false; }
  }
}
