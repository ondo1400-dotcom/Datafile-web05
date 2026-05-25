// ══════════════════════════════════════════════════════
//  pages/reg-detail.js — 섭외자 상세 페이지
// ══════════════════════════════════════════════════════

let _detailRow = null;
let _detailTab = 'basic'; // basic | history | meets | check

function openPersonDetail(rowIndex) {
  _detailRow = STATE.nujeok.find(r => r['__rowIndex'] === rowIndex)
             || STATE.tallag.find(r => r['__rowIndex'] === rowIndex);
  if (!_detailRow) return;
  _detailTab = 'basic';
  nav('reg-detail');
}

function renderRegDetail() {
  if (!_detailRow) { nav('reg-board'); return; }
  const r = _detailRow;

  const initials = (r['섭외자'] || '?').charAt(0);
  const tallag   = isTallag(r);
  const sc       = STAGE_COLORS[r['단계']] || { bg:'#f0f0f0', c:'#555' };

  // 만남 기록 (다음만남일 시트에서)
  const personMeets = (STATE.meets || []).filter(m =>
    m['섭외자'] === r['섭외자'] && m['인도자'] === r['인도자']
  ).sort((a, b) => {
    const da = a._date ? a._date.getTime() : 0;
    const db = b._date ? b._date.getTime() : 0;
    return db - da;
  });

  const lastMeet   = personMeets[0];
  const totalMeets = personMeets.length;

  // 개강 체크
  const key        = makeKey(r);
  const checkMap   = buildCheckMap();
  const doneChecks = STATE.checkItems.filter(item => checkMap[key + '||' + item]?.checked).length;

  document.getElementById('detail-content').innerHTML = `
    <!-- 상단 카드 -->
    <div style="background:var(--reg-light);border:1px solid var(--reg-mid);border-radius:var(--radius-lg);padding:16px;margin-bottom:16px;position:relative;">
      <div style="display:flex;align-items:flex-start;gap:14px;">
        <!-- 아바타 -->
        <div style="width:52px;height:52px;border-radius:50%;background:var(--reg2);display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;flex-shrink:0;">
          ${initials}
        </div>
        <!-- 기본 정보 -->
        <div style="flex:1;">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
            <span style="font-size:20px;font-weight:700;">${r['섭외자'] || '—'}</span>
            <span style="background:${sc.bg};color:${sc.c};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:700;">${r['단계'] || '—'}</span>
            ${tallag ? '<span class="badge b-red">탈락</span>' : ''}
          </div>
          <div style="font-size:12px;color:var(--text3);margin-bottom:8px;">
            ${r['실적지역']||''} · ${r['인도자팀']||''} · ${r['목표개강(연도/월)']||''}
            ${r['섭외유형'] ? ' · ' + r['섭외유형'] : ''}
            ${r['인도자구역'] ? ' · 구역: ' + r['인도자구역'] : ''}
          </div>
          <!-- 주요 인물 카드들 -->
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
            ${[
              ['인도자', r['인도자']],
              ['교사', r['교사']],
              ['섬외자', r['섭외자']],
              ['총 만남', totalMeets + '회'],
            ].map(([label, val]) => `
              <div style="background:#fff;border-radius:8px;padding:8px;text-align:center;border:1px solid var(--border);">
                <div style="font-size:10px;color:var(--text3);margin-bottom:2px;">${label}</div>
                <div style="font-size:13px;font-weight:700;color:${label==='총 만남'?'var(--reg2)':'var(--text1)'};">${val||'—'}</div>
              </div>
            `).join('')}
          </div>
        </div>
        <!-- 오른쪽 버튼 -->
        <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
          <button class="btn" onclick="nav('reg-board')" style="font-size:11px;padding:6px 10px;">← 목록</button>
          <button class="btn reg-pri" id="detail-edit-toggle" onclick="toggleEditMode()" style="font-size:11px;padding:6px 10px;">✏️ 수정</button>
          <button class="btn" onclick="openIwolModal()" style="font-size:11px;padding:6px 10px;color:var(--amber);">↩ 이월</button>
          <button class="btn" onclick="openTallagModal()" style="font-size:11px;padding:6px 10px;color:var(--red);">✕ 탈락</button>
        </div>
      </div>
    </div>

    <!-- 탭 -->
    <div style="display:flex;border-bottom:2px solid var(--border);margin-bottom:16px;">
      ${[['basic','기본 정보'],['stage','단계 정보'],['meets','만남 기록'],['check','개강 준비']].map(([id, label]) => `
        <button onclick="switchDetailTab('${id}')" id="dtab-${id}"
          style="padding:8px 16px;border:none;background:none;font-size:13px;font-weight:600;cursor:pointer;
          border-bottom:${_detailTab===id?'2px solid var(--reg2)':'2px solid transparent'};
          color:${_detailTab===id?'var(--reg2)':'var(--text3)'};margin-bottom:-2px;">
          ${label}
        </button>
      `).join('')}
    </div>

    <!-- 탭 내용 -->
    <div id="detail-tab-content"></div>
  `;

  renderDetailTab();
}

function switchDetailTab(tab) {
  _detailTab = tab;
  // 탭 버튼 스타일 업데이트
  ['basic','stage','meets','check'].forEach(id => {
    const btn = document.getElementById('dtab-' + id);
    if (!btn) return;
    btn.style.borderBottom = id === tab ? '2px solid var(--reg2)' : '2px solid transparent';
    btn.style.color = id === tab ? 'var(--reg2)' : 'var(--text3)';
  });
  renderDetailTab();
}

function renderDetailTab() {
  const r   = _detailRow;
  const el  = document.getElementById('detail-tab-content');
  if (!el || !r) return;

  if (_detailTab === 'basic' || _detailTab === 'stage') {
    if (_isEditMode) {
      const isStage   = _detailTab === 'stage';
      const editFields = isStage
        ? (_STAGE_EDIT_FIELDS[r['단계']] || _STAGE_EDIT_FIELDS['찾기'])
        : _BASIC_EDIT_FIELDS;
      const editLabel   = isStage ? `✏️ 단계 정보 수정 — ${r['단계']} 양식으로 보고됩니다` : '✏️ 기본 개인정보 수정';
      const submitLabel = isStage ? '📤 수정 보고 (텔레그램 전송)' : '💾 저장 (조용히)';
      el.innerHTML = `
        <div style="background:var(--reg-light);border:1px solid var(--reg-mid);border-radius:8px;padding:12px;margin-bottom:14px;font-size:12px;color:var(--reg2);font-weight:600;">
          ${editLabel}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
          ${editFields.map(f => `
            <div>
              <div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:3px;">${f}</div>
              <input id="inline-edit-${f.replace(/[\/\(\)\s]/g,'_')}" type="text" class="top-sel" style="width:100%;"
                autocomplete="off"
                value="${fmtValForEdit(f, r[f]).replace(/"/g,'&quot;')}">
            </div>
          `).join('')}
        </div>
        <button id="inline-edit-submit" class="btn reg-pri" style="width:100%;padding:12px;font-size:14px;"
          onclick="submitInlineEdit()">${submitLabel}</button>
      `;
      return;
    }

    if (_detailTab === 'stage') {
      const stage = r['단계'] || '';
      const _c3 = (label, val) => `
        <div class="stat-card base">
          <div class="stat-label">${label}</div>
          <div style="font-size:13px;font-weight:600;">${val||'—'}</div>
        </div>`;

      let stageContent = '';
      if (['합자','육따기','따기','영따기','복음방','지역장'].includes(stage)) {
        stageContent += `
          <div class="sl">담당자</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
            ${_c3('인도자부서/지역/팀/구역', r['인도자부서/지역/팀/구역'])}
            ${_c3('인도자', r['인도자'])}
            ${_c3('교사부서/지역/팀/구역', r['교사부서/지역/팀/구역'])}
            ${_c3('교사', r['교사'])}
          </div>`;
      }
      if (stage === '합자') {
        stageContent += `
          <div class="sl">합자 정보</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
            ${_c3('변화의지', r['변화의지'])}
            ${_c3('따기포인트', r['따기포인트'])}
            ${_c3('반응', r['반응'])}
          </div>`;
      } else if (stage === '육따기') {
        stageContent += `
          <div class="sl">따기 기간</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
            ${_c3('따기주간횟수', r['따기주간횟수'])}
            ${_c3('따기기간', r['따기기간'])}
            ${_c3('고정요일', r['고정요일'])}
          </div>`;
      } else if (stage === '따기' || stage === '영따기') {
        stageContent += `
          <div class="sl">따기 정보</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
            ${_c3('따기유형', r['따기유형'])}
            ${_c3('따기단계', r['따기단계'])}
            ${_c3('첫수업예정일', r['첫수업예정일'] ? fmtValForEdit('첫수업예정일', r['첫수업예정일']) : '')}
          </div>`;
      } else if (stage === '복음방' || stage === '지역장') {
        stageContent += `
          <div class="sl">복음방 정보</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
            ${_c3('섬김이부서/지역/팀/구역', r['섬김이부서/지역/팀/구역'])}
            ${_c3('섬김이', r['섬김이'])}
            ${_c3('마팔수강번호', r['마팔수강번호'])}
            ${_c3('복음방수업방식', r['복음방수업방식'])}
            ${_c3('첫수업진행일', r['첫수업진행일'] ? fmtValForEdit('첫수업진행일', r['첫수업진행일']) : '')}
            ${_c3('첫수업과목', r['첫수업과목'])}
          </div>`;
        if (stage === '지역장') {
          stageContent += `
            <div class="sl">지역장 승인 정보</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
              ${_c3('복음방총횟수', r['복음방총횟수'])}
              ${_c3('복음방체크리스트', r['복음방체크리스트'])}
              ${_c3('개강진면접여부', r['개강진면접여부'])}
              ${_c3('신천지오픈여부', r['신천지오픈여부'])}
              ${_c3('센터수강여부', r['센터수강여부'])}
              ${_c3('재입교자여부', r['재입교자여부'])}
            </div>`;
        }
      }

      stageContent += `
        <div class="sl">다음 만남</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
          ${_c3('다음만남일', r['다음만남일'] ? fmtValForEdit('다음만남일', r['다음만남일']) : '')}
          ${_c3('다음만남시간', fmtTime(r['다음만남시간']))}
          ${_c3('다음만남목적', r['다음만남목적'])}
        </div>`;

      if (!stageContent) {
        stageContent = '<div style="color:var(--text3);padding:20px;text-align:center;">찾기 단계에서는 기본 정보 탭에서 수정하세요</div>';
      }
      el.innerHTML = stageContent;
      return;
    }

    // basic 탭 일반 보기 모드
    const personMeets = (STATE.meets || []).filter(m =>
      m['섭외자'] === r['섭외자'] && m['인도자'] === r['인도자']
    ).sort((a, b) => (b._date?.getTime()||0) - (a._date?.getTime()||0));

    const lastMeet = personMeets[0];
    const nextMeet = personMeets.find(m => {
      const diff = m._date ? Math.round((m._date - new Date().setHours(0,0,0,0)) / 86400000) : null;
      return diff !== null && diff >= 0;
    });

    const _card = (label, val) => `
      <div class="stat-card base">
        <div class="stat-label">${label}</div>
        <div style="font-size:13px;font-weight:600;">${val||'—'}</div>
      </div>`;

    el.innerHTML = `
      <div class="sl">만남 현황</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
        <div class="stat-card base"><div class="stat-label">최근 만남일</div><div style="font-size:15px;font-weight:700;">${lastMeet ? fmtMD(lastMeet._date) : '—'}</div></div>
        <div class="stat-card base"><div class="stat-label">만남 목적</div><div style="font-size:13px;font-weight:600;">${lastMeet?.['다음만남목적']||'—'}</div></div>
        <div class="stat-card base"><div class="stat-label">만남 결과</div><div style="font-size:15px;">${lastMeet?.['만남결과']||'—'}</div></div>
        <div class="stat-card base"><div class="stat-label">다음 만남일</div><div style="font-size:15px;font-weight:700;color:var(--reg2);">${nextMeet ? fmtMD(nextMeet._date) : '—'}</div></div>
        <div class="stat-card base"><div class="stat-label">만남 시간</div><div style="font-size:13px;font-weight:600;">${fmtTime(r['다음만남시간'])||'—'}</div></div>
        <div class="stat-card base"><div class="stat-label">다음 만남 목적</div><div style="font-size:13px;font-weight:600;">${r['다음만남목적']||'—'}</div></div>
      </div>

      <div class="sl">기본 정보</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
        ${[
          ['출생연도', r['출생연도']],
          ['성별', r['성별']],
          ['사는곳', r['사는곳']],
          ['하는일', r['하는일']],
          ['종교', r['종교']],
          ['신앙년수', r['신앙년수']],
          ['섭외유형', r['섭외유형']],
          ['2차연결유형', r['2차연결유형']],
          ['목표센터', r['목표센터']],
        ].map(([label, val]) => _card(label, val)).join('')}
      </div>
    `;

  } else if (_detailTab === 'meets') {
    const personMeets = (STATE.meets || []).filter(m =>
      m['섭외자'] === r['섭외자'] && m['인도자'] === r['인도자']
    ).sort((a, b) => (b._date?.getTime()||0) - (a._date?.getTime()||0));

    if (!personMeets.length) {
      el.innerHTML = '<div style="color:var(--text3);padding:20px;text-align:center;">만남 기록 없음</div>';
      return;
    }

    el.innerHTML = `
      <div class="tw">
        <table class="bt">
          <thead><tr><th>날짜</th><th>시간</th><th>목적</th><th>결과</th></tr></thead>
          <tbody>
            ${personMeets.map(m => `
              <tr>
                <td style="font-weight:700;">${m._date ? fmtMD(m._date) : '—'}</td>
                <td>${fmtTime(m['다음만남시간'])||'—'}</td>
                <td>${m['다음만남목적']||'—'}</td>
                <td style="font-size:16px;">${m['만남결과']||'⬜'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

  } else if (_detailTab === 'check') {
    const key      = makeKey(r);
    const checkMap = buildCheckMap();

    el.innerHTML = `
      <div class="sl">개강 준비 체크 (${STATE.checkItems.filter(item => checkMap[key+'||'+item]?.checked).length}/${STATE.checkItems.length} 완료)</div>
      ${STATE.checkItems.map(item => {
        const ck  = key + '||' + item;
        const st  = checkMap[ck] || {};
        const done = st.checked;
        return `
          <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border:1px solid ${done?'var(--green)':'var(--border)'};border-radius:8px;background:${done?'var(--green-light)':'#fff'};margin-bottom:6px;">
            <span style="font-size:16px;">${done?'✅':'⬜'}</span>
            <span style="flex:1;font-size:13px;font-weight:500;">${item}</span>
            ${done ? `<span style="font-size:10px;color:var(--text3);">✓ ${st.체크자||''} ${st.체크일시||''}</span>` : ''}
          </div>
        `;
      }).join('')}
    `;
  }
}

// fmtMD 함수 (adm-meet.js에서도 사용)
function fmtMD(date) {
  if (!date) return '—';
  return `${date.getMonth()+1}/${date.getDate()}`;
}

// ─── 인라인 수정 모드 ───
let _isEditMode = false;

const _BASIC_EDIT_FIELDS = [
  '전화번호','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','목표개강(연도/월)','목표센터',
];
const _STAGE_EDIT_FIELDS = {
  '찾기':   ['실적지역','인도자부서/지역/팀/구역','인도자','다음만남일','다음만남시간','다음만남목적'],
  '합자':   ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','변화의지','따기포인트','반응','다음만남일','다음만남시간','다음만남목적'],
  '육따기': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','따기주간횟수','따기기간','고정요일','다음만남일','다음만남시간','다음만남목적'],
  '따기':   ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
  '영따기': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
  '복음방': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목','다음만남일','다음만남시간','다음만남목적'],
  '지역장': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','복음방총횟수','복음방체크리스트','개강진면접여부','신천지오픈여부','센터수강여부','재입교자여부','다음만남일','다음만남시간','다음만남목적'],
};

function toggleEditMode() {
  _isEditMode = !_isEditMode;
  const btn = document.getElementById('detail-edit-toggle');
  if (btn) btn.textContent = _isEditMode ? '✕ 취소' : '✏️ 수정';
  renderDetailTab();
}

async function submitInlineEdit() {
  if (!_detailRow) return;
  const isStage = _detailTab === 'stage';
  const stage   = _detailRow['단계'] || '찾기';
  const fields  = isStage
    ? (_STAGE_EDIT_FIELDS[stage] || _STAGE_EDIT_FIELDS['찾기'])
    : _BASIC_EDIT_FIELDS;

  const payload = { ..._detailRow };
  const changed = [];
  fields.forEach(f => {
    const el = document.getElementById('inline-edit-' + f.replace(/[\/\(\)\s]/g,'_'));
    if (!el) return;
    const newVal = el.value;
    if (newVal !== String(_detailRow[f]||'')) changed.push(f);
    payload[f] = newVal;
  });

  if (!changed.length) { showToast('변경된 내용이 없어요'); return; }

  const btn = document.getElementById('inline-edit-submit');
  if (btn) { btn.textContent = '저장 중...'; btn.disabled = true; }

  try {
    if (USE_SAMPLE) {
      Object.assign(_detailRow, payload);
      showToast(isStage ? '📤 수정 보고 전송 완료!' : '💾 저장 완료!');
      _isEditMode = false;
      renderRegDetail();
      return;
    }

    if (isStage) {
      const res = await gasPost({ action: 'requestEdit', ...payload, 단계: stage });
      if (!res.success) throw new Error(res.error);
      showToast('📤 수정 보고 전송 완료!');
    } else {
      const res = await gasPost({ action: 'saveOrUpdateDbFinding', ...payload });
      if (!res.success) throw new Error(res.error);
      if (res.dbFindings) STATE.dbFindings = res.dbFindings;
      showToast('💾 기본 정보 저장 완료!');
    }
    Object.assign(_detailRow, payload);
    _isEditMode = false;
    renderRegDetail();
  } catch(e) {
    showToast('⚠️ 실패: ' + e.message, 'error');
    if (btn) { btn.textContent = isStage ? '📤 수정 보고 (텔레그램 전송)' : '💾 저장 (조용히)'; btn.disabled = false; }
  }
}

// ─── DB_찾기 상세 수정 모달 ───
let _editDbRow = null;

function openDbEditModal(rowIndex) {
  _editDbRow = (STATE.dbFindings || []).find(r => r['__rowIndex'] === rowIndex);
  if (!_editDbRow) return;

  const modal = document.getElementById('db-edit-modal');
  if (!modal) return;

  // 폼 채우기
  const fields = [
    '실적지역','인도자부서/지역/팀/구역','인도자',
    '목표개강(연도/월)','목표센터','섭외자','전화번호',
    '출생연도','성별','사는곳','하는일','종교','신앙년수',
    '섭외유형','2차연결유형','다음만남일','다음만남시간','다음만남목적'
  ];

  fields.forEach(key => {
    const id = 'edit-' + key.replace(/[\/\(\)]/g, '_');
    const el = document.getElementById(id);
    if (el) el.value = _editDbRow[key] || '';
  });

  modal.classList.add('show');
}

function closeDbEditModal() {
  document.getElementById('db-edit-modal')?.classList.remove('show');
  _editDbRow = null;
}

async function submitDbEdit() {
  if (!_editDbRow) return;

  const payload = { ..._editDbRow };
  const fields = [
    '실적지역','인도자부서/지역/팀/구역','인도자',
    '목표개강(연도/월)','목표센터','섭외자','전화번호',
    '출생연도','성별','사는곳','하는일','종교','신앙년수',
    '섭외유형','2차연결유형','다음만남일','다음만남시간','다음만남목적'
  ];

  fields.forEach(key => {
    const id = 'edit-' + key.replace(/[\/\(\)]/g, '_');
    const el = document.getElementById(id);
    if (el) payload[key] = el.value;
  });

  const btn = document.getElementById('db-edit-submit-btn');
  if (btn) { btn.textContent = '저장 중...'; btn.disabled = true; }

  try {
    if (USE_SAMPLE) {
      const target = (STATE.dbFindings || []).find(r => r['__rowIndex'] === _editDbRow['__rowIndex']);
      if (target) Object.assign(target, payload);
      showToast('✅ 수정됨 (샘플 모드)');
      closeDbEditModal();
      return;
    }

    const res = await gasPost({ action: 'saveOrUpdateDbFinding', ...payload });
    if (!res.success) throw new Error(res.error);
    STATE.dbFindings = res.dbFindings;
    showToast('✅ 수정 완료');
    closeDbEditModal();
  } catch(e) {
    showToast('⚠️ 수정 실패: ' + e.message, 'error');
    if (btn) { btn.textContent = '저장'; btn.disabled = false; }
  }
}

// ─── 섭외자 상세 수정 ───
let _editDetailRow  = null;
let _editDetailOrig = null; // 수정 전 원본

function openDetailEditModal() {
  if (!_detailRow) return;
  _editDetailRow  = { ..._detailRow };
  _editDetailOrig = { ..._detailRow };

  const stage = _detailRow['단계'] || '찾기';

  // 단계별 편집 필드
  const fieldMap = {
    '찾기':   ['실적지역','인도자부서/지역/팀/구역','인도자','목표개강(연도/월)','목표센터','섭외자','전화번호','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','다음만남일','다음만남시간','다음만남목적'],
    '합자':   ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','변화의지','따기포인트','반응','다음만남일','다음만남시간','다음만남목적'],
    '육따기': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기주간횟수','따기기간','고정요일','다음만남일','다음만남시간','다음만남목적'],
    '따기':   ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '복음방': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','섭외자','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목'],
  };
  const fields = fieldMap[stage] || fieldMap['찾기'];

  const modal = document.getElementById('detail-edit-modal');
  if (!modal) return;

  document.getElementById('detail-edit-stage').textContent = stage;
  document.getElementById('detail-edit-name').textContent  = _detailRow['섭외자'] || '—';

  document.getElementById('detail-edit-fields').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      ${fields.map(f => `
        <div>
          <div style="font-size:10px;font-weight:700;color:var(--text3);margin-bottom:3px;">${f}</div>
          <input id="dedit-${f.replace(/[\/\(\)\s]/g,'_')}" type="text" class="top-sel" style="width:100%;"
            autocomplete="off"
            value="${fmtValForEdit(f, _detailRow[f]).replace(/"/g,'&quot;')}">
        </div>
      `).join('')}
    </div>
  `;

  const btn = document.getElementById('detail-edit-submit-btn');
  if (btn) { btn.textContent = '저장 및 보고'; btn.disabled = false; }

  modal.classList.add('show');
}

function closeDetailEditModal() {
  document.getElementById('detail-edit-modal')?.classList.remove('show');
  _editDetailRow  = null;
  _editDetailOrig = null;
}

async function submitDetailEdit() {
  if (!_detailRow) return;

  const stage = _detailRow['단계'] || '찾기';
  const fieldMap = {
    '찾기':   ['실적지역','인도자부서/지역/팀/구역','인도자','목표개강(연도/월)','목표센터','섭외자','전화번호','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','다음만남일','다음만남시간','다음만남목적'],
    '합자':   ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','변화의지','따기포인트','반응','다음만남일','다음만남시간','다음만남목적'],
    '육따기': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기주간횟수','따기기간','고정요일','다음만남일','다음만남시간','다음만남목적'],
    '따기':   ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '복음방': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','섭외자','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목'],
  };
  const fields = fieldMap[stage] || fieldMap['찾기'];

  // 수정된 값 수집
  const payload = { ..._detailRow };
  const changed = [];
  fields.forEach(f => {
    const el = document.getElementById('dedit-' + f.replace(/[\/\(\)\s]/g,'_'));
    if (!el) return;
    const newVal = el.value;
    const oldVal = String(_detailRow[f] || '');
    payload[f] = newVal;
    if (newVal !== oldVal) changed.push(f);
  });

  if (!changed.length) {
    showToast('변경된 내용이 없어요');
    return;
  }

  const btn = document.getElementById('detail-edit-submit-btn');
  if (btn) { btn.textContent = '저장 중...'; btn.disabled = true; }

  try {
    if (USE_SAMPLE) {
      Object.assign(_detailRow, payload);
      showToast('✅ 수정됨 (샘플 모드)');
      closeDetailEditModal();
      renderRegDetail();
      return;
    }

    // Datafile-05에 저장
    const res = await gasPost({ action: 'saveOrUpdateDbFinding', ...payload });
    if (!res.success) throw new Error(res.error);
    STATE.dbFindings = res.dbFindings;
    Object.assign(_detailRow, payload);

    showToast('✅ 수정 완료! 심의요청 탭에서 보고할 수 있어요');
    closeDetailEditModal();
    renderRegDetail();
  } catch(e) {
    showToast('⚠️ 수정 실패: ' + e.message, 'error');
    if (btn) { btn.textContent = '저장 및 보고'; btn.disabled = false; }
  }
}

// ─── 탈락 처리 ───
function openTallagModal() {
  if (!_detailRow) return;
  document.getElementById('tallag-name').textContent = _detailRow['섭외자'] || '—';
  document.getElementById('tallag-stage').textContent = _detailRow['단계'] || '—';
  document.getElementById('tallag-reason').value = '';
  const btn = document.getElementById('tallag-submit-btn');
  if (btn) { btn.textContent = '탈락 보고'; btn.disabled = false; }
  document.getElementById('tallag-modal').classList.add('show');
}

function closeTallagModal() {
  document.getElementById('tallag-modal').classList.remove('show');
}

async function submitTallag() {
  if (!_detailRow) return;
  const reason = document.getElementById('tallag-reason').value.trim();
  if (!reason) { showToast('⚠️ 탈락 사유를 입력해주세요', 'error'); return; }

  const btn = document.getElementById('tallag-submit-btn');
  if (btn) { btn.textContent = '전송 중...'; btn.disabled = true; }

  try {
    if (USE_SAMPLE) {
      showToast('✅ 탈락 보고 완료 (샘플)');
      closeTallagModal();
      return;
    }
    const res = await gasPost({
      action: 'requestTallag',
      ..._detailRow,
      탈락사유: reason,
    });
    if (!res.success) throw new Error(res.error);
    showToast('📤 탈락 보고 전송 완료!');
    closeTallagModal();
  } catch(e) {
    showToast('⚠️ 실패: ' + e.message, 'error');
    if (btn) { btn.textContent = '탈락 보고'; btn.disabled = false; }
  }
}

// ─── 이월 처리 ───
function openIwolModal() {
  if (!_detailRow) return;
  document.getElementById('iwol-name').textContent  = _detailRow['섭외자'] || '—';
  document.getElementById('iwol-stage').textContent = _detailRow['단계'] || '—';
  document.getElementById('iwol-current-kaigang').textContent = _detailRow['목표개강(연도/월)'] || '—';
  document.getElementById('iwol-reason').value       = '';
  document.getElementById('iwol-new-kaigang').value  = '';
  document.getElementById('iwol-new-center').value   = _detailRow['목표센터'] || '';
  const btn = document.getElementById('iwol-submit-btn');
  if (btn) { btn.textContent = '이월 보고'; btn.disabled = false; }
  document.getElementById('iwol-modal').classList.add('show');
}

function closeIwolModal() {
  document.getElementById('iwol-modal').classList.remove('show');
}

async function submitIwol() {
  if (!_detailRow) return;
  const reason     = document.getElementById('iwol-reason').value.trim();
  const newKaigang = document.getElementById('iwol-new-kaigang').value.trim();
  const newCenter  = document.getElementById('iwol-new-center').value.trim();

  if (!reason)     { showToast('⚠️ 이월 사유를 입력해주세요', 'error'); return; }
  if (!newKaigang) { showToast('⚠️ 이월 목표개강을 입력해주세요', 'error'); return; }

  const btn = document.getElementById('iwol-submit-btn');
  if (btn) { btn.textContent = '전송 중...'; btn.disabled = true; }

  try {
    if (USE_SAMPLE) {
      showToast('✅ 이월 보고 완료 (샘플)');
      closeIwolModal();
      return;
    }
    const res = await gasPost({
      action: 'requestIwol',
      ..._detailRow,
      이월사유: reason,
      이월목표개강: newKaigang,
      이월목표센터: newCenter,
    });
    if (!res.success) throw new Error(res.error);
    showToast('📤 이월 보고 전송 완료!');
    closeIwolModal();
  } catch(e) {
    showToast('⚠️ 실패: ' + e.message, 'error');
    if (btn) { btn.textContent = '이월 보고'; btn.disabled = false; }
  }
}
