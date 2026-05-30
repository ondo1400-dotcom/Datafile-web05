// ══════════════════════════════════════════════════════
//  pages/reg-detail.js — 섭외자 상세 페이지
// ══════════════════════════════════════════════════════

// GAS 호출 헬퍼 (탈락/이월/clist 등 GAS 경유 작업에 사용)
async function gasPost(payload) {
  const res = await fetch(GAS_URL + '?payload=' + encodeURIComponent(JSON.stringify(payload)) + '&t=' + Date.now());
  return res.json();
}

let _detailRow = null;
let _detailTab = 'basic'; // basic | history | meets | check
let _detailBackScreen = 'reg-board';

function openPersonDetail(rowIndex, backScreen, tab, isTallag) {
  const baseRow = isTallag
    ? (STATE.tallag.find(r => r['__rowIndex'] === rowIndex) || STATE.nujeok.find(r => r['__rowIndex'] === rowIndex))
    : (STATE.nujeok.find(r => r['__rowIndex'] === rowIndex) || STATE.tallag.find(r => r['__rowIndex'] === rowIndex));
  if (!baseRow) return;

  const dbRow = (STATE.dbFindings || []).find(r =>
    r['섭외자'] === baseRow['섭외자'] &&
    r['인도자'] === baseRow['인도자'] &&
    r['실적지역'] === baseRow['실적지역']
  );
  _detailRow = dbRow ? { ...baseRow, ...dbRow } : baseRow;
  _detailBackScreen = backScreen || STATE.currentScreen || 'reg-board';

  _detailTab = tab || 'basic';
  nav('reg-detail');
}

function openDbFindingDetail(rowIndex, backScreen) {
  const row = (STATE.dbFindings || []).find(r => r['__rowIndex'] === rowIndex);
  if (!row) return;
  _detailRow = { ...row, 단계: row['단계'] || row['구분'] || '찾기' };
  _detailBackScreen = backScreen || STATE.currentScreen || 'reg-board';
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
          <button class="btn" onclick="nav(_detailBackScreen)" style="font-size:11px;padding:6px 10px;">← 목록</button>
          <button class="btn reg-pri" id="detail-edit-toggle" onclick="toggleEditMode()" style="font-size:11px;padding:6px 10px;">✏️ 수정</button>
          <button class="btn" onclick="openIwolModal()" style="font-size:11px;padding:6px 10px;color:var(--amber);">↩ 이월</button>
          <button class="btn" onclick="openTallagModal()" style="font-size:11px;padding:6px 10px;color:var(--red);">✕ 탈락</button>
        </div>
      </div>
    </div>

    <!-- 탭 -->
    <div style="display:flex;border-bottom:2px solid var(--border);margin-bottom:16px;">
      ${[['basic','기본 정보'],['stage','단계 정보'],['meets','만남 기록'],['check','개강 준비'],['clist','C_list']].map(([id, label]) => `
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
  ['basic','stage','meets','check','clist'].forEach(id => {
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
      const editLabel   = isStage ? `✏️ 단계 정보 수정 — 지파 보고 대상 항목 변경 시 자동 전송` : '✏️ 기본 개인정보 수정';
      const submitLabel = isStage ? '💾 저장' : '💾 저장 (조용히)';
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
    const dbMeets = (STATE.dbMeetings || []).filter(m => m['섭외자'] === r['섭외자']);

    if (!dbMeets.length) {
      el.innerHTML = '<div style="color:var(--text3);padding:20px;text-align:center;">만남 기록 없음</div>';
      return;
    }

    el.innerHTML = `
      <div style="padding:4px 0;">
        <div style="font-size:11px;color:var(--text3);padding:4px 12px 8px;">총 ${dbMeets.length}회</div>
        ${dbMeets.map((m, i) => {
          const nth = dbMeets.length - i;
          const date = m['만남일자'] || '—';
          const time = m['만남시간'] || '';
          const title = m['제목'] || '';
          const 내용 = m['수업내용'] || '';
          const 반응 = m['수업반응'] || '';
          const 특이 = m['특이사항'] || '';
          const next = m['다음만남일'] || '';
          const 교사 = m['교사'] || '';
          const 인도 = m['인도자'] || '';
          const 동행 = m['동행자'] || '';
          const 섬김 = m['섬김이'] || '';
          return `
            <div style="border:1px solid var(--border);border-radius:10px;margin:0 8px 10px;overflow:hidden;">
              <div style="background:var(--reg-light);padding:8px 12px;display:flex;align-items:center;gap:8px;border-bottom:1px solid var(--border);">
                <span style="font-size:12px;font-weight:700;color:var(--reg2);">${nth}차</span>
                <span style="font-size:13px;font-weight:700;">${date}</span>
                ${time ? `<span style="font-size:11px;color:var(--text3);">${time}</span>` : ''}
                ${title ? `<span style="font-size:12px;color:var(--text2);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${title}</span>` : '<span style="flex:1;"></span>'}
                ${교사 ? `<span style="font-size:11px;color:var(--text3);">교사: ${교사}</span>` : ''}
              </div>
              <div style="padding:10px 12px;font-size:12px;line-height:1.6;">
                ${인도 ? `<div style="font-size:11px;color:var(--text3);margin-bottom:6px;">인도자: ${인도}</div>` : ''}
                ${내용 ? `<div style="margin-bottom:6px;"><span style="font-weight:600;color:var(--text2);">수업내용</span><br><span style="color:var(--text1);white-space:pre-wrap;">${내용}</span></div>` : ''}
                ${반응 ? `<div style="margin-bottom:6px;"><span style="font-weight:600;color:var(--text2);">수업반응</span><br><span style="color:var(--text1);white-space:pre-wrap;">${반응}</span></div>` : ''}
                ${특이 ? `<div style="margin-bottom:6px;"><span style="font-weight:600;color:var(--text2);">특이사항</span><br><span style="color:var(--text1);white-space:pre-wrap;">${특이}</span></div>` : ''}
                ${(동행||섬김) ? `<div style="font-size:11px;color:var(--text3);">${동행?'동행: '+동행:''}${동행&&섬김?' · ':''}${섬김?'섬김: '+섬김:''}</div>` : ''}
                ${next ? `<div style="margin-top:6px;font-size:11px;color:var(--reg2);font-weight:600;">📅 다음만남: ${next}</div>` : ''}
              </div>
            </div>`;
        }).join('')}
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
  } else if (_detailTab === 'clist') {
    _renderClistTab(el);
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
  '찾기':   ['인도자부서/지역/팀/구역','인도자','다음만남일','다음만남시간','다음만남목적'],
  '합자':   ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','변화의지','따기포인트','반응','다음만남일','다음만남시간','다음만남목적'],
  '육따기': ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','따기주간횟수','따기기간','고정요일','다음만남일','다음만남시간','다음만남목적'],
  '따기':   ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
  '영따기': ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
  '복음방': ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목','다음만남일','다음만남시간','다음만남목적'],
  '지역장': ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','복음방총횟수','복음방체크리스트','개강진면접여부','신천지오픈여부','센터수강여부','재입교자여부','다음만남일','다음만남시간','다음만남목적'],
};

// 이 필드가 변경된 경우에만 지파에 수정 요청 전송
const STAGE_REPORT_FIELDS = {
  '합자':   ['실적지역','인도자부서/지역/팀/구역','인도자','목표개강(연도/월)','목표센터','섭외자','출생연도','성별','사는곳','하는일','종교','신앙년수','편입부서','섭외유형','2차연결유형','따기예정일'],
  '육따기': ['실적지역','인도자부서/지역/팀/구역','인도자','섭외자','따기주간횟수','따기기간','고정요일'],
  '따기':   ['실적지역','인도자부서/지역/팀/구역','인도자','섭외자','따기유형','따기주간횟수','따기기간','따기단계','첫수업예정일'],
  '영따기': ['실적지역','인도자부서/지역/팀/구역','인도자','섭외자','따기유형','따기주간횟수','따기기간','따기단계','첫수업예정일'],
  '복음방': ['실적지역','인도자부서/지역/팀/구역','인도자','섭외자','교사부서/지역/팀/구역','교사','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목'],
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
      showToast('💾 저장 완료!');
      _isEditMode = false;
      renderRegDetail();
      return;
    }

    const clean = Object.fromEntries(Object.entries(payload).filter(([k]) => !k.startsWith('__') && k !== 'id' && k !== 'synced_at'));
    const { error } = await SUPA.from('db_findings').upsert(clean, { onConflict: '실적지역,섭외자,인도자' });
    if (error) throw new Error(error.message);
    const { data: refreshed } = await SUPA.from('db_findings').select('*');
    STATE.dbFindings = (refreshed || []).map((r, i) => ({ ...r, __rowIndex: parseInt(r.id) || i }));

    const reportFields = STAGE_REPORT_FIELDS[stage] || [];
    const reportChanged = changed.filter(f => reportFields.includes(f));
    if (reportChanged.length > 0) {
      await SUPA.from('pending_updates').insert({
        '섭외자':   payload['섭외자']   || '',
        '인도자':   payload['인도자']   || '',
        '실적지역': payload['실적지역'] || '',
        changes:    payload,
        source:     'app',
        requested_by: USER_AUTH?.email || '',
      });
      const encoded = encodeURIComponent(JSON.stringify({ action: 'requestEdit', ...payload, 단계: stage }));
      fetch(GAS_URL + '?payload=' + encoded + '&t=' + Date.now()).catch(() => {});
      showToast('📤 수정 완료! 지파에 수정 요청 전송됨');
    } else {
      showToast('💾 저장 완료!');
    }
    Object.assign(_detailRow, payload);
    _isEditMode = false;
    renderRegDetail();
  } catch(e) {
    showToast('⚠️ 실패: ' + e.message, 'error');
    if (btn) { btn.textContent = isStage ? '💾 저장' : '💾 저장 (조용히)'; btn.disabled = false; }
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

    const clean = Object.fromEntries(Object.entries(payload).filter(([k]) => !k.startsWith('__') && k !== 'id' && k !== 'synced_at'));
    const { error } = await SUPA.from('db_findings').upsert(clean, { onConflict: '실적지역,섭외자,인도자' });
    if (error) throw new Error(error.message);
    const { data: refreshed } = await SUPA.from('db_findings').select('*');
    STATE.dbFindings = (refreshed || []).map((r, i) => ({ ...r, __rowIndex: parseInt(r.id) || i }));
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
    '찾기':   ['인도자부서/지역/팀/구역','인도자','목표개강(연도/월)','목표센터','섭외자','전화번호','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','다음만남일','다음만남시간','다음만남목적'],
    '합자':   ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','변화의지','따기포인트','반응','다음만남일','다음만남시간','다음만남목적'],
    '육따기': ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기주간횟수','따기기간','고정요일','다음만남일','다음만남시간','다음만남목적'],
    '따기':   ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '영따기': ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '복음방': ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','섭외자','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목'],
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
    '찾기':   ['인도자부서/지역/팀/구역','인도자','목표개강(연도/월)','목표센터','섭외자','전화번호','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','다음만남일','다음만남시간','다음만남목적'],
    '합자':   ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','변화의지','따기포인트','반응','다음만남일','다음만남시간','다음만남목적'],
    '육따기': ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기주간횟수','따기기간','고정요일','다음만남일','다음만남시간','다음만남목적'],
    '따기':   ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '영따기': ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '복음방': ['인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','섭외자','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목'],
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

    const clean = Object.fromEntries(Object.entries(payload).filter(([k]) => !k.startsWith('__') && k !== 'id' && k !== 'synced_at'));
    const { error } = await SUPA.from('db_findings').upsert(clean, { onConflict: '실적지역,섭외자,인도자' });
    if (error) throw new Error(error.message);
    const { data: refreshed } = await SUPA.from('db_findings').select('*');
    STATE.dbFindings = (refreshed || []).map((r, i) => ({ ...r, __rowIndex: parseInt(r.id) || i }));
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

// ═══════════════════════════════════════════════════════
//  C_list 탭 — 합자체크리스트 / 따기체크리스트 / 센터확정체크리스트
// ═══════════════════════════════════════════════════════

const _CLIST_ITEMS = {
  합자체크리스트: [
    { section: '인성', items: [
      { code: 'h_in_1', text: '정신질환 관련 약을 복용중이지 않은가? (우울증, 공황장애, ADHD, 조울증)' },
      { code: 'h_in_2', text: '만남에 특정 목적을 띄고 있지 않은가? (이성, 다단계, 보험권유 등)' },
      { code: 'h_in_3', text: '부모에게 지나치게 의존적이지 않는가? (통금, 외출 제약 등)' },
    ]},
    { section: '신성', items: [
      { code: 'h_sp_1', text: '신의 존재(보이지 않는 존재)를 부정하지않고 믿거나 있기를 소망하는가?' },
      { code: 'h_sp_2', text: '신천지에 대한 직·간접적인 부정적인 경험이 없는가?' },
      { code: 'h_sp_3', text: '현재 다니는 교회에서 사역 혹은 봉사활동 여부가 파악되었는가?' },
    ]},
    { section: '환경', items: [
      { code: 'h_ev_1', text: '사는 곳이 센터와 1시간 이내 거리인가?' },
      { code: 'h_ev_2', text: '타 지역 중복 섭외 이력을 확인하였는가?', note: '상담, 복음방 경험 / 세미나, 전도의 장, 인터뷰 경험: 지역장 또는 열매 통한 직접 파악' },
      { code: 'h_ev_3', text: '주 3회 대면 센터수강 시간이 가능한가?(평일 10시, 19시반)' },
      { code: 'h_ev_4', text: '센터기간(6개월) 내에 2주 이상의 센터수강 불가 일정이 없는가?', note: '여행, 타지역 방문 등' },
    ]},
  ],
  따기체크리스트: [
    { section: '교사와의 신뢰', items: [
      { code: 'd_tr_1', text: '교사의 말을 30분 이상 경청하는 자세를 가지며 배려심 있고 공손하다.' },
      { code: 'd_tr_2', text: '교사에게 자신의 이야기를 잘 털어놓는다. (가정사, 고민, 이성친구 등)' },
      { code: 'd_tr_3', text: '교사가 무료로 상담을 하는 이유에 대해 메리트있게 소개가 되었다.' },
      { code: 'd_tr_4', text: '교사와의 식사 등으로 친교와 마음사기가 되어 친밀감이 형성되었다.' },
    ]},
    { section: '정보파악', items: [
      { code: 'd_in_1', text: '필수 정보 파악이 되었다: 직장, 대략적인 주소, 생일 등' },
      { code: 'd_in_2', text: '영적 정보 파악이 되었다: 이단경계심, 종교 거부감, 침요소, 핍박요소 등' },
    ]},
    { section: '동기부여', items: [
      { code: 'd_mo_1', text: '내면이 변화해야하는 이유를 구체적으로 인식하고 표현한다.' },
      { code: 'd_mo_2', text: '영따기 프로그램에 대한 사전 안내가 1차적으로 되어 수강생이 궁금해하고 기대하는 마음이 있다.' },
    ]},
    { section: '침방지/입막음', items: [
      { code: 'd_sc_1', text: '보안서약서를 작성했는가?' },
      { code: 'd_sc_2', text: '상담을 받으러 나올때 주위에 뭐라고 하고 나오는지 확인이 되었는가?' },
    ]},
  ],
  센터확정체크리스트: [
    { section: '동기부여', items: [
      { code: 'b_mo_1', text: '건강한 미래를 위해 이 상담이 반드시 필요하다는 것을 받아들였는가?' },
      { code: 'b_mo_2', text: '자신의 현 상태를 인지하여 변화가 반드시 필요함을 인정하는가?' },
      { code: 'b_mo_3', text: '자신의 일정이 생겼을때 조율하려고 하는 의지가 있는가?' },
    ]},
    { section: '교사신뢰', items: [
      { code: 'b_tr_1', text: '교사가 나를 변화시켜줄 수 있는 존재임을 인정하는가? (고민을 이야기함/교사의 조언, 미션을 수행하는지)' },
      { code: 'b_tr_2', text: '교사와 원활하게 연락이 되고 있으며 늦거나 사정이 있을경우 사전에 양해를 구하는가?' },
    ]},
    { section: '종교거부감', items: [
      { code: 'b_re_1', text: '종교 거부감이 없거나 상담을 통해 충분히 해소 되었다.' },
      { code: 'b_re_2', text: '이단경계심이 상담을 통해서 해소되었다.' },
      { code: 'b_re_3', text: '성경 말씀을 변화/성장하기 위한 지침서로 인정한다.' },
      { code: 'b_re_4', text: '성경에 대해 열린 마음이다.' },
    ]},
    { section: '침방지/입막음', items: [
      { code: 'b_sc_1', text: '상담/교육에 대해 외부에 이야기 하지 않도록 스스로 인지하고, 말하지 않는다.' },
      { code: 'b_sc_2', text: '침을 맞을 우려가 적은 개인 맞춤 모략을 사용하고 있다.' },
    ]},
    { section: '섬김이', items: [
      { code: 'b_se_1', text: '열매의 고민/관심사에 맞는 간증 잎사귀가 투입되어 간증을 공유했다.' },
      { code: 'b_se_2', text: '열매에게 맞는 예정된 섬김이가 매칭 되어있다.' },
      { code: 'b_se_3', text: '섬김이와 열매가 친교만남을 가지며 마음열기가 되었다.' },
    ]},
    { section: '개강진 연결', items: [
      { code: 'b_ab_1', text: '센터 교육기관에 대해 목적/수익구조 등 멘트대로 잘 설명이 되었다.' },
      { code: 'b_ab_2', text: '자신의 간증을 넣은 멘트로 개강진 ABC가 진행되었다.' },
      { code: 'b_ab_3', text: '개강진 특강이 진행되었다.' },
    ]},
    { section: '수강환경', items: [
      { code: 'b_en_1', text: '센터요일에 맞춰 주3회 실참이 가능한 스케줄인가?' },
    ]},
  ],
};

const _clistCache = {};

function _renderClistHtml(el, state) {
  el.innerHTML = Object.entries(_CLIST_ITEMS).map(([typeName, sections]) => {
    const typeTotal = sections.reduce((s, sec) => s + sec.items.length, 0);
    const typeDone  = sections.reduce((s, sec) =>
      s + sec.items.filter(it => state[typeName + '|' + it.code] === '예').length, 0);
    return `
      <div style="margin-bottom:20px;">
        <div style="font-size:13px;font-weight:700;color:var(--reg2);margin:0 0 10px;padding:8px 12px;background:var(--reg-light);border-radius:8px;border:1px solid var(--reg-mid);">
          ■ ${typeName} &nbsp;<span style="font-size:11px;font-weight:400;">(${typeDone}/${typeTotal} 완료)</span>
        </div>
        ${sections.map(sec => `
          <div style="margin-bottom:10px;">
            <div style="font-size:11px;font-weight:700;color:var(--text3);margin-bottom:4px;padding:3px 8px;background:var(--bg2,#f5f5f5);border-radius:4px;">※${sec.section}</div>
            ${sec.items.map((item, idx) => {
              const key = typeName + '|' + item.code;
              const ans = state[key];
              return `
                <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 4px;border-bottom:1px solid var(--border);">
                  <span style="font-size:11px;color:var(--text3);min-width:18px;padding-top:1px;">${idx+1}.</span>
                  <span style="flex:1;font-size:12px;line-height:1.5;">${item.text}${item.note ? `<br><span style="font-size:10px;color:var(--text3);">(${item.note})</span>` : ''}</span>
                  <div style="display:flex;gap:4px;flex-shrink:0;">
                    <button onclick="saveClistItem('${typeName}','${item.code}','예')"
                      style="padding:3px 10px;border-radius:12px;border:1px solid ${ans==='예'?'var(--green)':'var(--border)'};background:${ans==='예'?'var(--green)':'#fff'};color:${ans==='예'?'#fff':'var(--text2)'};font-size:11px;font-weight:600;cursor:pointer;">예</button>
                    <button onclick="saveClistItem('${typeName}','${item.code}','아니오')"
                      style="padding:3px 10px;border-radius:12px;border:1px solid ${ans==='아니오'?'var(--red)':'var(--border)'};background:${ans==='아니오'?'var(--red)':'#fff'};color:${ans==='아니오'?'#fff':'var(--text2)'};font-size:11px;font-weight:600;cursor:pointer;">아니오</button>
                  </div>
                </div>`;
            }).join('')}
          </div>
        `).join('')}
      </div>`;
  }).join('');
}

function _hcDecodeToMap(str) {
  const order = _CLIST_ITEMS.합자체크리스트.flatMap(sec => sec.items.map(it => it.code));
  const map = {};
  order.forEach((code, i) => {
    const c = (str || '')[i];
    if (c === 'Y') map['합자체크리스트|' + code] = '예';
    else if (c === 'N') map['합자체크리스트|' + code] = '아니오';
  });
  return map;
}

function _renderClistTab(el) {
  const r = _detailRow;
  const cacheKey = (r['실적지역']||'') + '|' + (r['섭외자']||'') + '|' + (r['인도자']||'');

  // 합자체크리스트는 DB_찾기 행에서 직접 decode (별도 GAS 호출 불필요)
  if (_clistCache[cacheKey] === undefined && '합자체크리스트' in r) {
    _clistCache[cacheKey] = _hcDecodeToMap(r['합자체크리스트'] || '');
  }

  if (_clistCache[cacheKey] !== undefined) {
    _renderClistHtml(el, _clistCache[cacheKey]);
    return;
  }

  el.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text3);">로딩 중...</div>';

  if (USE_SAMPLE) {
    _clistCache[cacheKey] = {};
    _renderClistHtml(el, {});
    return;
  }

  gasPost({ action: 'getPersonChecklist', 실적지역: r['실적지역'], 섭외자: r['섭외자'], 인도자: r['인도자'] })
    .then(res => {
      const map = {};
      (res.items || []).forEach(item => { map[item['체크종류'] + '|' + item['항목코드']] = item['예아니오']; });
      _clistCache[cacheKey] = map;
      if (_detailTab === 'clist') _renderClistHtml(el, map);
    })
    .catch(() => {
      _clistCache[cacheKey] = {};
      if (_detailTab === 'clist') _renderClistHtml(el, {});
    });
}

async function saveClistItem(typeName, code, val) {
  const r = _detailRow;
  const cacheKey = (r['실적지역']||'') + '|' + (r['섭외자']||'') + '|' + (r['인도자']||'');
  if (!_clistCache[cacheKey]) _clistCache[cacheKey] = {};
  _clistCache[cacheKey][typeName + '|' + code] = val;

  // 합자체크리스트는 _detailRow['합자체크리스트'] 문자열도 함께 업데이트
  if (typeName === '합자체크리스트' && '합자체크리스트' in r) {
    const order = _CLIST_ITEMS.합자체크리스트.flatMap(sec => sec.items.map(it => it.code));
    const cur = (r['합자체크리스트'] || '-'.repeat(10)).padEnd(10, '-').split('');
    const pos = order.indexOf(code);
    if (pos >= 0) {
      cur[pos] = val === '예' ? 'Y' : val === '아니오' ? 'N' : '-';
      r['합자체크리스트'] = cur.join('');
    }
  }

  const el = document.getElementById('detail-tab-content');
  if (el && _detailTab === 'clist') _renderClistHtml(el, _clistCache[cacheKey]);

  if (USE_SAMPLE) return;

  try {
    await gasPost({
      action: 'savePersonChecklistItem',
      실적지역: r['실적지역'], 섭외자: r['섭외자'], 인도자: r['인도자'],
      체크종류: typeName, 항목코드: code, 예아니오: val,
      체크자: USER_AUTH?.name || USER_AUTH?.email || '',
    });
  } catch(e) {
    showToast('⚠️ 저장 실패: ' + e.message, 'error');
  }
}
