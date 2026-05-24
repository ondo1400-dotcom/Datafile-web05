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
  document.getElementById('db-stat-hapja').textContent = data.filter(r => r['전송완료여부'] === 'Y').length;

  const tbody = document.getElementById('db-body');
  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:var(--text3);">데이터 없음</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(r => {
    const typeColor = r['구분'] === 'DB' ? 'b-gray' : 'b-reg';
    const rowStyle  = r['전송완료여부'] === 'Y' ? 'opacity:.5;' : '';
    const ri        = r['__rowIndex'];

    const reviewStatus = r['전송완료여부'] === 'Y'
      ? '<span class="badge b-green" style="font-size:10px;">전송완료</span>'
      : r['심의승인여부'] === 'Y'
        ? '<span class="badge b-adm" style="font-size:10px;">승인완료</span>'
        : r['심의요청여부'] === 'Y'
          ? '<span class="badge b-amber" style="font-size:10px;">심의대기</span>'
          : `<button class="btn reg-pri" style="font-size:11px;padding:4px 10px;" onclick="event.stopPropagation();openRequestReviewModal(${ri})">심의요청</button>`;

    return `<tr style="${rowStyle}" class="cr" onclick="openDbDetail(${ri})">
      <td><span class="badge ${typeColor}">${r['구분']||'—'}</span></td>
      <td style="max-width:80px;overflow:hidden;text-overflow:ellipsis;">${r['실적지역']||'—'}</td>
      <td><strong>${r['섭외자']||'—'}</strong></td>
      <td style="font-size:11px;max-width:110px;overflow:hidden;text-overflow:ellipsis;">${r['전화번호']||'—'}</td>
      <td style="font-size:11px;">${r['인도자']||'—'}</td>
      <td style="font-size:11px;">${r['목표개강(연도/월)']||'—'}</td>
      <td style="font-size:11px;">${r['다음만남일']||'—'}</td>
      <td style="font-size:11px;">${r['섭외유형']||'—'}</td>
      <td style="font-size:11px;color:var(--text3);">${String(r['등록일시']||'').substring(0,10)}</td>
      <td onclick="event.stopPropagation()">${reviewStatus}</td>
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

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;">
      ${fields.map(f => `
        <div style="padding:8px;background:var(--surface2);border-radius:6px;">
          <div style="font-size:10px;color:var(--text3);font-weight:700;margin-bottom:2px;">${f}</div>
          <div style="font-size:13px;font-weight:600;">${r[f]||'—'}</div>
        </div>
      `).join('')}
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;">
      ${r['전송완료여부'] === 'Y'
        ? `<div style="flex:1;text-align:center;color:var(--green);font-weight:700;">✅ 전송 완료</div>`
        : r['심의승인여부'] === 'Y'
          ? `<div style="flex:1;text-align:center;color:var(--adm);font-weight:700;">✅ 승인 완료 — 전송 대기 중</div>`
          : r['심의요청여부'] === 'Y'
            ? `<div style="flex:1;text-align:center;color:var(--amber);font-weight:700;">⏳ 심의 대기 중</div>`
            : `<button class="btn reg-pri" style="flex:1;padding:12px;font-size:14px;"
                 onclick="closeDbDetail();openRequestReviewModal(${rowIndex})">심의 요청</button>`
      }
      <button class="btn" style="flex:1;padding:12px;font-size:14px;"
        onclick="closeDbDetail();openDbEditModal(${rowIndex})">✏️ 수정</button>
    </div>`;

  document.getElementById('db-detail-modal').classList.add('show');
}

function closeDbDetail() {
  document.getElementById('db-detail-modal').classList.remove('show');
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
    // 관리자 지역 보기 모드
    if (ADM_VIEW_REGION && r['실적지역'] !== ADM_VIEW_REGION) return false;
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
