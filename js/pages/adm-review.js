// ══════════════════════════════════════════════════════
//  pages/adm-review.js — 심의 탭 (청년회 관리자)
// ══════════════════════════════════════════════════════

function renderAdmReview() {
  const stageF  = document.getElementById('rv-stage-sel')?.value  || '';
  const statusF = document.getElementById('rv-status-sel')?.value || '';

  let data = (STATE.dbFindings || []).filter(r => r['심의요청여부'] === 'Y');
  if (stageF)  data = data.filter(r => (r['심의단계']||r['구분']) === stageF);
  if (statusF === 'pending')  data = data.filter(r => r['심의승인여부'] !== 'Y');
  if (statusF === 'approved') data = data.filter(r => r['심의승인여부'] === 'Y' && r['전송완료여부'] !== 'Y');
  if (statusF === 'sent')     data = data.filter(r => r['전송완료여부'] === 'Y');

  const all      = (STATE.dbFindings || []).filter(r => r['심의요청여부'] === 'Y');
  const pending  = all.filter(r => r['심의승인여부'] !== 'Y').length;
  const approved = all.filter(r => r['심의승인여부'] === 'Y' && r['전송완료여부'] !== 'Y').length;
  const sent     = all.filter(r => r['전송완료여부'] === 'Y').length;

  document.getElementById('rv-stat-pending').textContent  = pending;
  document.getElementById('rv-stat-approved').textContent = approved;
  document.getElementById('rv-stat-sent').textContent     = sent;

  const tbody = document.getElementById('rv-body');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3);">심의 요청 없음</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const ri         = r['__rowIndex'];
    const isSent     = r['전송완료여부'] === 'Y';
    const isApproved = r['심의승인여부'] === 'Y';
    const stage      = r['심의단계'] || r['구분'] || '—';
    const sc         = STAGE_COLORS[stage] || { bg:'#f0f0f0', c:'#555' };
    const reqDate    = String(r['심의요청일시']||'').substring(0,10);

    let statusBadge = '';
    if (isSent)          statusBadge = '<span class="badge b-green">전송완료</span>';
    else if (isApproved) statusBadge = '<span class="badge b-adm">승인완료</span>';
    else                 statusBadge = '<span class="badge b-amber">심의대기</span>';

    // 승인 버튼 누르면 바로 전송
    let actionBtn = '';
    if (!isSent) {
      actionBtn = `<button class="btn adm-pri" style="font-size:11px;padding:4px 10px;"
        onclick="approveAndSend(${ri}, '${stage}')">✓ ${stage} 승인</button>`;
    }

    return `<tr>
      <td><span style="background:${sc.bg};color:${sc.c};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">${stage}</span></td>
      <td><strong>${r['섭외자']||'—'}</strong></td>
      <td style="font-size:12px;">${r['실적지역']||'—'}</td>
      <td style="font-size:12px;">${r['인도자']||'—'}</td>
      <td style="font-size:11px;color:var(--text3);">${reqDate}</td>
      <td>${statusBadge}</td>
      <td style="display:flex;gap:4px;align-items:center;white-space:nowrap;">
        <button class="btn" style="font-size:11px;padding:4px 8px;"
          onclick="openReviewPersonDetail(${ri})">상세</button>
        ${actionBtn}
      </td>
    </tr>`;
  }).join('');
}

// ─── 상세 버튼 → 섭외자 상세 페이지 ───
function openReviewPersonDetail(rowIndex) {
  const r = (STATE.dbFindings || []).find(d => d['__rowIndex'] === rowIndex);
  if (!r) return;

  // nujeok에서 같은 사람 찾기
  const nujeokRow = STATE.nujeok.find(n =>
    n['섭외자'] === r['섭외자'] && n['인도자'] === r['인도자']
  );

  if (nujeokRow) {
    // 섭외자 상세 페이지로 이동
    openPersonDetail(nujeokRow['__rowIndex']);
  } else {
    // nujeok에 없으면 DB_찾기 데이터로 모달 표시
    openReviewDetail(rowIndex);
  }
}

// ─── 간단 상세 모달 (nujeok 없는 경우) ───
function openReviewDetail(rowIndex) {
  const r = (STATE.dbFindings || []).find(d => d['__rowIndex'] === rowIndex);
  if (!r) return;

  const stage = r['심의단계'] || r['구분'] || '';
  const sc    = STAGE_COLORS[stage] || { bg:'#f0f0f0', c:'#555' };

  const fieldMap = {
    '찾기':   ['실적지역','인도자부서/지역/팀/구역','인도자','목표개강(연도/월)','목표센터','섭외자','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','다음만남일','다음만남시간','다음만남목적'],
    '합자':   ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','변화의지','따기포인트','반응','다음만남일','다음만남시간','다음만남목적'],
    '육따기': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기주간횟수','따기기간','고정요일','다음만남일','다음만남시간','다음만남목적'],
    '따기':   ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '복음방': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','섭외자','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목'],
  };
  const fields = fieldMap[stage] || Object.keys(r).filter(k => !k.startsWith('__') && !['구분','등록일시','심의요청여부','심의요청일시','심의승인여부','심의승인일시','전송완료여부','전송완료일시','심의단계'].includes(k));

  const isSent = r['전송완료여부'] === 'Y';
  const ri     = r['__rowIndex'];

  document.getElementById('rv-detail-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <span style="background:${sc.bg};color:${sc.c};padding:3px 10px;border-radius:20px;font-size:12px;font-weight:700;">${stage}</span>
      <strong style="font-size:16px;">${r['섭외자']||'—'}</strong>
      <span style="font-size:12px;color:var(--text3);">${r['실적지역']||''} · ${r['인도자']||''}</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px;">
      ${fields.map(f => `
        <div style="padding:8px;background:var(--surface2);border-radius:6px;">
          <div style="font-size:10px;color:var(--text3);font-weight:700;margin-bottom:2px;">${f}</div>
          <div style="font-size:13px;font-weight:600;">${r[f]||'—'}</div>
        </div>
      `).join('')}
    </div>
    <div style="display:flex;gap:8px;">
      ${!isSent ? `
        <button class="btn adm-pri" style="flex:1;padding:10px;font-size:13px;"
          onclick="closeReviewDetail();approveAndSend(${ri},'${stage}')">✓ ${stage} 승인 및 전송</button>
      ` : `
        <div style="flex:1;text-align:center;color:var(--green);font-weight:700;padding:10px;">✅ 전송 완료</div>
      `}
      <button class="btn" onclick="closeReviewDetail()" style="padding:10px 16px;">닫기</button>
    </div>
  `;

  document.getElementById('rv-detail-modal').classList.add('show');
}

function closeReviewDetail() {
  document.getElementById('rv-detail-modal').classList.remove('show');
}

// ─── 승인 + 즉시 전송 ───
async function approveAndSend(rowIndex, stage) {
  if (!confirm(`[${stage}] 승인하고 바로 전송할까요?`)) return;

  const btns = document.querySelectorAll(`[onclick*="approveAndSend(${rowIndex}"]`);
  btns.forEach(b => { b.textContent = '전송 중...'; b.disabled = true; });

  try {
    if (USE_SAMPLE) {
      const t = (STATE.dbFindings||[]).find(d => d['__rowIndex'] === rowIndex);
      if (t) { t['심의승인여부']='Y'; t['심의단계']=stage; t['전송완료여부']='Y'; }
      showToast('📤 전송 완료! (샘플)');
      renderAdmReview();
      return;
    }

    // 1. 승인
    const approveRes = await gasPost({ action: 'approveReview', rowIndex, stage });
    if (!approveRes.success) throw new Error(approveRes.error);
    STATE.dbFindings = approveRes.dbFindings || STATE.dbFindings;

    // 2. 즉시 전송
    const r = (STATE.dbFindings||[]).find(d => d['__rowIndex'] === rowIndex);
    if (!r) throw new Error('데이터 없음');

    const sendRes = await gasPost({ action: 'sendReviewTelegram', rowIndex, ...r });
    if (!sendRes.success) throw new Error(sendRes.error);
    STATE.dbFindings = sendRes.dbFindings || STATE.dbFindings;

    showToast(`📤 [${stage}] 승인 및 전송 완료!`);
    renderAdmReview();
  } catch(e) {
    showToast('⚠️ 실패: ' + e.message, 'error');
    btns.forEach(b => { b.textContent = `✓ ${stage} 승인`; b.disabled = false; });
  }
}
