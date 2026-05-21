// ══════════════════════════════════════════════════════
//  pages/adm-review.js — 심의 탭 (청년회 관리자)
// ══════════════════════════════════════════════════════

const REVIEW_STAGES = ['찾기', '합자', '육따기', '따기', '복음방'];

function renderAdmReview() {
  const data = (STATE.dbFindings || []).filter(r => r['심의요청여부'] === 'Y');

  // 통계
  const pending  = data.filter(r => r['심의승인여부'] !== 'Y').length;
  const approved = data.filter(r => r['심의승인여부'] === 'Y' && r['전송완료여부'] !== 'Y').length;
  const sent     = data.filter(r => r['전송완료여부'] === 'Y').length;

  document.getElementById('rv-stat-pending').textContent  = pending;
  document.getElementById('rv-stat-approved').textContent = approved;
  document.getElementById('rv-stat-sent').textContent     = sent;

  const tbody = document.getElementById('rv-body');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--text3);">심의 요청 없음</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const ri       = r['__rowIndex'];
    const isSent   = r['전송완료여부'] === 'Y';
    const isApproved = r['심의승인여부'] === 'Y';
    const stage    = r['심의단계'] || r['구분'] || '—';
    const sc       = STAGE_COLORS[stage] || { bg:'#f0f0f0', c:'#555' };

    let statusBadge = '';
    if (isSent)       statusBadge = '<span class="badge b-green">전송완료</span>';
    else if (isApproved) statusBadge = '<span class="badge b-adm">승인완료</span>';
    else              statusBadge = '<span class="badge b-amber">심의대기</span>';

    return `<tr>
      <td><span style="background:${sc.bg};color:${sc.c};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">${stage}</span></td>
      <td><strong>${r['섭외자']||'—'}</strong></td>
      <td>${r['실적지역']||'—'}</td>
      <td>${r['인도자']||'—'}</td>
      <td style="font-size:11px;color:var(--text3);">${String(r['심의요청일시']||'').substring(0,10)}</td>
      <td>${statusBadge}</td>
      <td style="display:flex;gap:4px;align-items:center;">
        <button class="btn" style="font-size:11px;padding:4px 8px;"
          onclick="openReviewDetail(${ri})">상세</button>
        ${!isApproved ? `
          ${REVIEW_STAGES.map(s => `
            <button class="btn adm-pri" style="font-size:11px;padding:4px 8px;"
              onclick="approveReview(${ri}, '${s}')">
              ${s}승인
            </button>
          `).join('')}
        ` : !isSent ? `
          <button class="btn reg-pri" style="font-size:11px;padding:4px 10px;"
            onclick="sendReviewTelegram(${ri})">
            📤 전송
          </button>
        ` : ''}
      </td>
    </tr>`;
  }).join('');
}

// ─── 상세 보기 ───
function openReviewDetail(rowIndex) {
  const r = (STATE.dbFindings || []).find(d => d['__rowIndex'] === rowIndex);
  if (!r) return;

  const body = document.getElementById('rv-detail-body');
  const stage = r['심의단계'] || r['구분'] || '';

  // 단계별 표시 필드
  const fieldMap = {
    '찾기': ['실적지역','인도자부서/지역/팀/구역','인도자','목표개강(연도/월)','목표센터','섭외자','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','다음만남일','다음만남시간','다음만남목적'],
    '합자': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','변화의지','따기포인트','반응','다음만남일','다음만남시간','다음만남목적'],
    '육따기': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기주간횟수','따기기간','고정요일','다음만남일','다음만남시간','다음만남목적'],
    '따기': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '복음방': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','섭외자','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목'],
  };

  const fields = fieldMap[stage] || Object.keys(r).filter(k => !k.startsWith('__') && k !== '구분' && k !== '등록일시');

  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;">
      ${fields.map(f => `
        <div style="padding:8px;background:var(--surface2);border-radius:6px;">
          <div style="font-size:10px;color:var(--text3);font-weight:700;margin-bottom:2px;">${f}</div>
          <div style="font-size:13px;font-weight:600;">${r[f]||'—'}</div>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('rv-detail-modal').classList.add('show');
}

function closeReviewDetail() {
  document.getElementById('rv-detail-modal').classList.remove('show');
}

// ─── 단계별 승인 ───
async function approveReview(rowIndex, stage) {
  if (!confirm(`${stage} 승인 하시겠어요?`)) return;

  try {
    const res = await gasPost({
      action: 'approveReview',
      rowIndex,
      stage,
    });
    if (!res.success) throw new Error(res.error);

    const target = (STATE.dbFindings || []).find(d => d['__rowIndex'] === rowIndex);
    if (target) {
      target['심의승인여부'] = 'Y';
      target['심의단계']     = stage;
      target['심의승인일시'] = new Date().toLocaleString('ko-KR');
    }

    showToast(`✅ ${stage} 승인 완료`);
    renderAdmReview();
  } catch(e) {
    showToast('⚠️ 승인 실패: ' + e.message, 'error');
  }
}

// ─── 텔레그램 전송 ───
async function sendReviewTelegram(rowIndex) {
  const r = (STATE.dbFindings || []).find(d => d['__rowIndex'] === rowIndex);
  if (!r) return;

  const stage = r['심의단계'] || '';
  if (!confirm(`[${stage}] ${r['섭외자']} 전송하시겠어요?`)) return;

  const btn = document.querySelector(`[onclick="sendReviewTelegram(${rowIndex})"]`);
  if (btn) { btn.textContent = '전송 중...'; btn.disabled = true; }

  try {
    const res = await gasPost({
      action: 'sendReviewTelegram',
      rowIndex,
      ...r,
    });
    if (!res.success) throw new Error(res.error);

    const target = (STATE.dbFindings || []).find(d => d['__rowIndex'] === rowIndex);
    if (target) {
      target['전송완료여부'] = 'Y';
      target['전송완료일시'] = new Date().toLocaleString('ko-KR');
    }

    showToast('📤 전송 완료!');
    renderAdmReview();
  } catch(e) {
    showToast('⚠️ 전송 실패: ' + e.message, 'error');
    if (btn) { btn.textContent = '📤 전송'; btn.disabled = false; }
  }
}
