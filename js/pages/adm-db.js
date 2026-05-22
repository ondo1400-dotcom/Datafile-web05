// ══════════════════════════════════════════════════════
//  pages/adm-db.js — DB/찾기 관리
// ══════════════════════════════════════════════════════

let dbFilter = { type: '', region: '' };

function renderAdmDb() {
  const data = STATE.dbFindings || [];

  const filtered = data.filter(r => {
    if (dbFilter.type   && r['구분']     !== dbFilter.type)   return false;
    if (dbFilter.region && r['실적지역'] !== dbFilter.region) return false;
    return true;
  });

  // 통계
  document.getElementById('db-stat-db').textContent    = data.filter(r => r['구분'] === 'DB').length;
  document.getElementById('db-stat-find').textContent  = data.filter(r => r['구분'] === '찾기').length;
  document.getElementById('db-stat-hapja').textContent = data.filter(r => r['합자요청여부'] === 'Y').length;

  const tbody = document.getElementById('db-body');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text3);">데이터 없음</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const isHapja   = r['합자요청여부'] === 'Y';
    const typeColor = r['구분'] === 'DB' ? 'b-gray' : 'b-reg';
    const rowStyle  = isHapja ? 'opacity:.5;' : '';
    const ri        = r['__rowIndex'];

    return `<tr style="${rowStyle}" class="cr" onclick="openDbDetail(${ri})">
      <td><span class="badge ${typeColor}">${r['구분']||'—'}</span></td>
      <td>${r['실적지역']||'—'}</td>
      <td><strong>${r['섭외자']||'—'}</strong></td>
      <td style="font-size:11px;">${r['전화번호']||'—'}</td>
      <td style="font-size:11px;">${r['인도자']||'—'}</td>
      <td style="font-size:11px;">${r['목표개강(연도/월)']||'—'}</td>
      <td style="font-size:11px;">${r['다음만남일']||'—'}</td>
      <td style="font-size:11px;">${r['섭외유형']||'—'}</td>
      <td style="font-size:11px;color:var(--text3);">${String(r['등록일시']||'').substring(0,10)}</td>
      <td onclick="event.stopPropagation()">
        ${isHapja
          ? '<span class="badge b-green">합자완료</span>'
          : `<button class="btn reg-pri" style="font-size:11px;padding:4px 10px;" onclick="openHapjaModal(${ri})">합자 요청</button>`
        }
      </td>
    </tr>`;
  }).join('');
}

function setDbFilter(key, val) {
  dbFilter[key] = val;
  renderAdmDb();
}

// ─── 상세 보기 ───
function openDbDetail(rowIndex) {
  const r = (STATE.dbFindings || []).find(d => d['__rowIndex'] === rowIndex);
  if (!r) return;

  const body = document.getElementById('db-detail-body');
  const fields = r['구분'] === 'DB'
    ? ['구분','실적지역','섭외자','전화번호','등록일시']
    : ['구분','실적지역','인도자부서/지역/팀/구역','인도자',
       '목표개강(연도/월)','목표센터','섭외자','전화번호',
       '출생연도','성별','사는곳','하는일','종교','신앙년수',
       '섭외유형','2차연결유형','다음만남일','다음만남시간','다음만남목적','등록일시'];

  const isAdmin = STATE.currentScreen === 'adm-db';

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;">
      ${fields.map(f => `
        <div style="padding:8px;background:var(--surface2);border-radius:6px;">
          <div style="font-size:10px;color:var(--text3);font-weight:700;margin-bottom:2px;">${f}</div>
          <div style="font-size:13px;font-weight:600;">${r[f]||'—'}</div>
        </div>
      `).join('')}
    </div>
    ${isAdmin
      ? (r['합자요청여부'] !== 'Y'
          ? `<div style="display:flex;gap:8px;margin-top:14px;">
               <button class="btn reg-pri" style="flex:1;padding:12px;font-size:14px;"
                 onclick="closeDbDetail();openHapjaModal(${rowIndex})">합자 요청하기</button>
               <button class="btn" style="flex:1;padding:12px;font-size:14px;"
                 onclick="closeDbDetail();openDbEditModal(${rowIndex})">✏️ 수정</button>
             </div>`
          : `<div style="display:flex;gap:8px;margin-top:14px;">
               <div style="flex:1;text-align:center;color:var(--green);font-weight:700;">✅ 합자 요청 완료</div>
               <button class="btn" style="flex:1;padding:12px;font-size:14px;"
                 onclick="closeDbDetail();openDbEditModal(${rowIndex})">✏️ 수정</button>
             </div>`)
      : `<div style="display:flex;gap:8px;margin-top:14px;">
           <button class="btn" style="flex:1;padding:12px;font-size:14px;"
             onclick="closeDbDetail();openDbEditModal(${rowIndex})">✏️ 수정</button>
         </div>`
    }`;

  document.getElementById('db-detail-modal').classList.add('show');
}

function closeDbDetail() {
  document.getElementById('db-detail-modal').classList.remove('show');
}

// ─── 합자 요청 모달 ───
let _hapjaRow = null;

function openHapjaModal(rowIndex) {
  _hapjaRow = (STATE.dbFindings || []).find(d => d['__rowIndex'] === rowIndex);
  if (!_hapjaRow) return;

  // 폼 자동 채우기
  const keys = ['실적지역','인도자부서_지역_팀_구역','인도자',
    '목표개강_연도_월_','목표센터','섭외자','출생연도','성별',
    '사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형',
    '다음만남일','다음만남시간','다음만남목적'];
  const origKeys = ['실적지역','인도자부서/지역/팀/구역','인도자',
    '목표개강(연도/월)','목표센터','섭외자','출생연도','성별',
    '사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형',
    '다음만남일','다음만남시간','다음만남목적'];

  keys.forEach((k, i) => {
    const el = document.getElementById('hapja-' + k);
    if (el) el.value = _hapjaRow[origKeys[i]] || '';
  });

  // 편입부서 고정값
  const 편입부서El = document.getElementById('hapja-편입부서');
  if (편입부서El) { 편입부서El.value = '청년'; 편입부서El.readOnly = true; 편입부서El.style.background = 'var(--surface2)'; }

  const btn = document.getElementById('hapja-submit-btn');
  if (btn) { btn.textContent = '텔레그램으로 합자 요청 전송'; btn.disabled = false; }

  document.getElementById('hapja-modal').classList.add('show');
}

function closeHapjaModal() {
  document.getElementById('hapja-modal').classList.remove('show');
  _hapjaRow = null;
}

async function submitHapja() {
  if (!_hapjaRow) return;

  const payload = { ..._hapjaRow };
  const keyMap = {
    '실적지역': '실적지역',
    '인도자부서/지역/팀/구역': '인도자부서_지역_팀_구역',
    '인도자': '인도자',
    '목표개강(연도/월)': '목표개강_연도_월_',
    '목표센터': '목표센터',
    '섭외자': '섭외자',
    '출생연도': '출생연도',
    '성별': '성별',
    '사는곳': '사는곳',
    '하는일': '하는일',
    '종교': '종교',
    '신앙년수': '신앙년수',
    '편입부서': '편입부서',
    '섭외유형': '섭외유형',
    '2차연결유형': '2차연결유형',
    '따기예정일': '따기예정일',
    '교사부서/지역/팀/구역': '교사부서_지역_팀_구역',
    '교사': '교사',
    '다음만남일': '다음만남일',
    '다음만남시간': '다음만남시간',
    '다음만남목적': '다음만남목적',
  };

  Object.entries(keyMap).forEach(([origKey, inputId]) => {
    const el = document.getElementById('hapja-' + inputId);
    if (el) payload[origKey] = el.value;
  });

  // 필수 필드 검증
  const required = {
    '실적지역': '실적지역',
    '인도자': '인도자',
    '목표개강(연도/월)': '목표개강(연도/월)',
    '목표센터': '목표센터',
    '섭외자': '섭외자',
    '출생연도': '출생연도',
    '성별': '성별',
    '사는곳': '사는곳',
    '하는일': '하는일',
    '종교': '종교',
    '신앙년수': '신앙년수',
    '섭외유형': '섭외유형',
    '2차연결유형': '2차연결유형',
    '따기예정일': '따기예정일',
    '교사': '교사',
  };

  const emptyFields = Object.entries(required)
    .filter(([key]) => !payload[key] || String(payload[key]).trim() === '')
    .map(([, label]) => label);

  if (emptyFields.length > 0) {
    showToast('⚠️ 필수 항목을 채워주세요: ' + emptyFields.join(', '), 'error');
    return;
  }

  const btn = document.getElementById('hapja-submit-btn');
  if (btn) { btn.textContent = '전송 중...'; btn.disabled = true; }

  try {
    if (USE_SAMPLE) {
      await new Promise(r => setTimeout(r, 800));
      const target = (STATE.dbFindings || []).find(d => d['__rowIndex'] === _hapjaRow['__rowIndex']);
      if (target) target['합자요청여부'] = 'Y';
      showToast('✅ 합자 요청 전송됨 (샘플 모드)');
      closeHapjaModal();
      renderAdmDb();
      return;
    }

    const res = await gasPost({ action: 'requestHapja', ...payload });
    if (!res.success) throw new Error(res.error || '전송 실패');

    const target = (STATE.dbFindings || []).find(d => d['__rowIndex'] === _hapjaRow['__rowIndex']);
    if (target) target['합자요청여부'] = 'Y';

    showToast('✅ 합자 요청이 텔레그램으로 전송됐어요!');
    closeHapjaModal();
    renderAdmDb();
  } catch(e) {
    showToast('⚠️ 전송 실패: ' + e.message, 'error');
    if (btn) { btn.textContent = '텔레그램으로 합자 요청 전송'; btn.disabled = false; }
  }
}

// ─── 신규 등록 ───
let _newDbType = 'DB';

function openNewDbModal(type) {
  _newDbType = type;
  document.getElementById('new-db-modal').classList.add('show');
  document.getElementById('new-db-title').textContent = type === 'DB' ? '새 DB 등록' : '새 찾기 등록';
  const findFields = document.getElementById('new-db-find-fields');
  if (findFields) findFields.style.display = type === 'DB' ? 'none' : 'block';
}

function closeNewDbModal() {
  document.getElementById('new-db-modal').classList.remove('show');
  document.querySelectorAll('[id^="newdb-"]').forEach(el => { el.value = ''; });
}

async function submitNewDb() {
  const payload = { '구분': _newDbType };
  document.querySelectorAll('[id^="newdb-"]').forEach(el => {
    const key = el.dataset.key;
    if (key) payload[key] = el.value;
  });

  if (!payload['실적지역'] || !payload['섭외자']) {
    alert('실적지역과 섭외자는 필수입니다.');
    return;
  }

  try {
    if (USE_SAMPLE) {
      payload['__rowIndex'] = Date.now();
      payload['등록일시']   = new Date().toLocaleString('ko-KR');
      payload['합자요청여부'] = '';
      STATE.dbFindings = [payload, ...(STATE.dbFindings || [])];
      showToast('✅ 등록됨 (샘플 모드)');
      closeNewDbModal();
      renderAdmDb();
      return;
    }
    const res = await gasPost({ action: 'saveDbFinding', ...payload });
    STATE.dbFindings = res.dbFindings;
    showToast('✅ 등록 완료');
    closeNewDbModal();
    renderAdmDb();
  } catch(e) {
    showToast('⚠️ 등록 실패: ' + e.message, 'error');
  }
}

// ─── 날짜 포맷 헬퍼 (GAS 한국어 timestamp 처리) ───
function fmtRegDate(val) {
  if (!val) return '—';
  const s = String(val);
  // "2026. 5. 20. 오후 2:54:44" → "2026.5.20"
  const m = s.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})/);
  if (m) return `${m[1]}.${m[2]}.${m[3]}`;
  return s.substring(0, 10);
}

// ─── REG: DB/찾기 (지역 담당자용) ───
function renderRegDb() {
  const typeFilter = document.getElementById('reg-db-type-sel')?.value || '';
  const data = (STATE.dbFindings || []).filter(r => {
    if (typeFilter && r['구분'] !== typeFilter) return false;
    return true;
  });

  const tbody = document.getElementById('reg-db-body');
  if (!tbody) return;

  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--text3);">데이터 없음</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const ri   = r['__rowIndex'];
    const type = r['구분'] === '찾기' ? '찾기' : 'DB';
    const typeColor = type === 'DB' ? '#e2e8f0;color:#475569' : '#dcfce7;color:#166534';
    return `<tr class="cr" onclick="openDbDetail(${ri})">
      <td><span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;background:${typeColor};">${type}</span></td>
      <td><strong>${r['섭외자']||'—'}</strong></td>
      <td style="font-size:11px;">${r['전화번호']||'—'}</td>
      <td style="font-size:11px;">${r['실적지역']||'—'}</td>
      <td style="font-size:11px;color:var(--text3);">${fmtRegDate(r['등록일시'])}</td>
    </tr>`;
  }).join('');
}
