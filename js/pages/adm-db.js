// ══════════════════════════════════════════════════════
//  pages/adm-db.js — DB/찾기 관리
// ══════════════════════════════════════════════════════

function renderAdmDb() {
  const data = STATE.dbFindings || [];
  if (window.NotionTableApp) {
    window.NotionTableApp.mountDbTable('adm-db-notion-root', data, {
      onRefresh: () => { if (typeof loadData === 'function') loadData().then(renderAdmDb); },
    });
  }
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
    const { error } = await SUPA.from('db_findings').insert(payload);
    if (error) throw new Error(error.message);
    const { data: refreshed } = await SUPA.from('db_findings').select('*');
    STATE.dbFindings = (refreshed || []).map((r, i) => ({ ...r, __rowIndex: parseInt(r.id) || i }));
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
  let data = STATE.dbFindings || [];
  if (ADM_VIEW_REGION) {
    data = data.filter(r => r['실적지역'] === ADM_VIEW_REGION);
  }
  if (window.NotionTableApp) {
    window.NotionTableApp.mountDbTable('reg-db-notion-root', data, {
      onRefresh: () => { if (typeof loadData === 'function') loadData().then(renderRegDb); },
    });
  }
}
