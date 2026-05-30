// ══════════════════════════════════════════════════════
//  pages/adm-review.js — 심의 탭 (청년회 관리자)
// ══════════════════════════════════════════════════════

function renderAdmReview() {
  const stageF  = document.getElementById('rv-stage-sel')?.value  || '';
  const statusF = document.getElementById('rv-status-sel')?.value || '';

  let data = (STATE.dbFindings || []).filter(r => r['심의요청여부'] === 'Y');
  if (stageF)  data = data.filter(r => (r['심의단계']||r['구분']) === stageF);
  if (statusF === 'pending')  data = data.filter(r => r['심의승인여부'] !== 'Y');
  if (statusF === 'approved') data = data.filter(r => r['심의승인여부'] === 'Y' && r['전송완료여부'] !== 'Y');  // includes 'F' (failed) rows
  if (statusF === 'sent')     data = data.filter(r => r['전송완료여부'] === 'Y');

  const all      = (STATE.dbFindings || []).filter(r => r['심의요청여부'] === 'Y');
  const pending  = all.filter(r => r['심의승인여부'] !== 'Y').length;
  const approved = all.filter(r => r['심의승인여부'] === 'Y' && r['전송완료여부'] !== 'Y' && r['전송완료여부'] !== 'F').length;
  const failed   = all.filter(r => r['전송완료여부'] === 'F').length;
  const sent     = all.filter(r => r['전송완료여부'] === 'Y').length;

  document.getElementById('rv-stat-pending').textContent  = pending;
  document.getElementById('rv-stat-approved').textContent = approved + failed;
  document.getElementById('rv-stat-sent').textContent     = sent;

  const tbody = document.getElementById('rv-body');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:var(--text3);">심의 요청 없음</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const ri       = r.id;
    const reqStage = r['심의단계'] || r['구분'] || '—';
    const reqSc    = STAGE_COLORS[reqStage] || { bg:'#f0f0f0', c:'#555' };
    const reqDate  = String(r['심의요청일시']||'').substring(0,10);

    // 현 단계: nujeok에서 조회 (동일 섭외자+인도자 행이 여러 개면 단계 순서 가장 높은 것 선택)
    const nujeokMatches = (STATE.nujeok || []).filter(n =>
      n['섭외자'] === r['섭외자'] && n['인도자'] === r['인도자']
    );
    const nujeokRow = nujeokMatches.sort((a, b) =>
      stageIndex(b['단계']) - stageIndex(a['단계'])
    )[0];
    const curStage = nujeokRow?.['단계'] || '—';
    const curSc    = STAGE_COLORS[curStage] || { bg:'#f0f0f0', c:'#555' };

    // 심의요청일시 > 심의승인일시 이면 새 요청 → 이전 승인 무효
    const aprvTime     = r['심의승인일시'] ? new Date(r['심의승인일시']) : null;
    const reqTime      = r['심의요청일시'] ? new Date(r['심의요청일시']) : null;
    const isNewRequest = !aprvTime || (reqTime && reqTime > aprvTime);

    const isSent     = !isNewRequest && r['전송완료여부'] === 'Y';
    const isFailed   = !isNewRequest && r['전송완료여부'] === 'F';
    const isApproved = !isNewRequest && r['심의승인여부'] === 'Y';

    let statusBadge;
    if (isSent)          statusBadge = '<span class="badge b-green">지파전송완료</span>';
    else if (isFailed)   statusBadge = '<span class="badge b-red">지파전송필요</span>';
    else if (isApproved) statusBadge = '<span class="badge b-adm">승인완료</span>';
    else                 statusBadge = '<span class="badge" style="background:var(--amber-light);color:var(--amber);">심의대기</span>';

    let actionBtn = '';
    if (!isSent) {
      if (!isApproved || isFailed) {
        const btnLabel = isFailed ? '🔄 재전송' : `✓ ${reqStage} 승인`;
        const fn       = isFailed ? 'sendTelegram' : 'approveAndSend';
        actionBtn = `<button class="btn adm-pri" style="font-size:11px;padding:4px 10px;"
          onclick="${fn}('${ri}', '${reqStage}')">${btnLabel}</button>`;
      }
    }

    return `<tr>
      <td><span style="background:${curSc.bg};color:${curSc.c};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">${curStage}</span></td>
      <td>
        <span style="font-size:10px;color:var(--text3);margin-right:3px;">→</span>
        <span style="background:${reqSc.bg};color:${reqSc.c};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">${reqStage}</span>
      </td>
      <td><strong>${r['섭외자']||'—'}</strong></td>
      <td style="font-size:12px;color:var(--text3);">${r['섭외유형']||'—'}</td>
      <td style="font-size:12px;">${r['실적지역']||'—'}</td>
      <td style="font-size:12px;">${r['인도자']||'—'}</td>
      <td style="font-size:11px;color:var(--text3);">${reqDate}</td>
      <td>${statusBadge}</td>
      <td style="display:flex;gap:4px;align-items:center;white-space:nowrap;">
        <button class="btn" style="font-size:11px;padding:4px 8px;"
          onclick="openReviewPersonDetail('${ri}')">상세</button>
        ${actionBtn}
      </td>
    </tr>`;
  }).join('');
}

// ─── 상세 버튼 → 섭외자 상세 페이지 ───
function openReviewPersonDetail(rowIndex) {
  const r = (STATE.dbFindings || []).find(d => d.id === rowIndex);
  if (!r) return;

  // nujeok에서 같은 사람 찾기 (실적지역까지 일치해야 다른 지역 행 오매칭 방지)
  const nujeokRow = STATE.nujeok.find(n =>
    n['섭외자'] === r['섭외자'] && n['인도자'] === r['인도자'] && n['실적지역'] === r['실적지역']
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
  const r = (STATE.dbFindings || []).find(d => d.id === rowIndex);
  if (!r) return;

  const stage = r['심의단계'] || r['구분'] || '';
  const sc    = STAGE_COLORS[stage] || { bg:'#f0f0f0', c:'#555' };

  const fieldMap = {
    '찾기':   ['실적지역','인도자부서/지역/팀/구역','인도자','목표개강(연도/월)','목표센터','섭외자','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','다음만남일','다음만남시간','다음만남목적'],
    '합자':   ['실적지역','인도자부서/지역/팀/구역','인도자','목표개강(연도/월)','목표센터','섭외자','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','따기예정일','교사부서/지역/팀/구역','교사','다음만남일','다음만남시간','다음만남목적'],
    '육따기': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기주간횟수','따기기간','고정요일','다음만남일','다음만남시간','다음만남목적'],
    '영따기': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '따기':   ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '복음방': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','섭외자','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목','다음만남일','다음만남시간','다음만남목적'],
    '지역장': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','다음만남일','다음만남시간','다음만남목적','복음방총횟수','복음방체크리스트','개강진면접여부','신천지오픈여부','센터수강여부','재입교자여부'],
  };
  const fields = fieldMap[stage] || Object.keys(r).filter(k => !k.startsWith('__') && !['구분','등록일시','심의요청여부','심의요청일시','심의승인여부','심의승인일시','전송완료여부','전송완료일시','심의단계'].includes(k));

  const isSent     = r['전송완료여부'] === 'Y';
  const isFailed   = r['전송완료여부'] === 'F';
  const isApproved = r['심의승인여부'] === 'Y';
  const ri         = r.id;

  let detailAction;
  if (isSent) {
    detailAction = `<div style="flex:1;text-align:center;color:var(--green);font-weight:700;padding:10px;">✅ 지파전송완료</div>`;
  } else if (isFailed) {
    detailAction = `<button class="btn adm-pri" style="flex:1;padding:10px;font-size:13px;"
      onclick="closeReviewDetail();sendTelegram('${ri}','${stage}')">🔄 재전송</button>`;
  } else {
    detailAction = `<button class="btn adm-pri" style="flex:1;padding:10px;font-size:13px;"
      onclick="closeReviewDetail();approveAndSend('${ri}','${stage}')">✓ ${stage} 승인</button>`;
  }

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
      ${detailAction}
      <button class="btn" onclick="closeReviewDetail()" style="padding:10px 16px;">닫기</button>
    </div>
  `;

  document.getElementById('rv-detail-modal').classList.add('show');
}

function closeReviewDetail() {
  document.getElementById('rv-detail-modal').classList.remove('show');
}

// ─── 전송 메시지 텍스트 빌더 ───
function buildReviewMessageText(stage, data) {
  const LABELS  = { '실적지역': '실적부서/지역' };
  const VALUES  = { '실적지역': val => '청년회/' + (val || '') };
  const header  = stage === '영따기' ? '따기' : stage;
  const fieldMap = {
    '찾기':   ['실적지역','인도자부서/지역/팀/구역','인도자','목표개강(연도/월)','목표센터','섭외자','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','다음만남일','다음만남시간','다음만남목적'],
    '합자':   ['실적지역','인도자부서/지역/팀/구역','인도자','목표개강(연도/월)','목표센터','섭외자','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','따기예정일','교사부서/지역/팀/구역','교사','다음만남일','다음만남시간','다음만남목적'],
    '육따기': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기주간횟수','따기기간','고정요일','다음만남일','다음만남시간','다음만남목적'],
    '영따기': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '따기':   ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','따기유형','따기단계','첫수업예정일','다음만남일','다음만남시간','다음만남목적'],
    '복음방': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섬김이부서/지역/팀/구역','섬김이','섭외자','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목','다음만남일','다음만남시간','다음만남목적'],
    '지역장': ['실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','섭외자','다음만남일','다음만남시간','다음만남목적','복음방총횟수','복음방체크리스트','개강진면접여부','신천지오픈여부','센터수강여부','재입교자여부'],
  };
  const fields = fieldMap[stage] || [];
  return `[${header}]\n` + fields.map(f => {
    const label = LABELS[f] || f;
    const val   = VALUES[f] ? VALUES[f](data[f]) : (data[f] || '');
    return `${label} : ${val}`;
  }).join('\n');
}

// ─── 텔레그램 전송 공통 헬퍼 ───
async function _sendTelegramReview(stage, data) {
  if (!TELEGRAM_BOT_TOKEN) throw new Error('텔레그램 토큰 미설정 (config.js)');
  const messageText = buildReviewMessageText(stage, data);
  const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: REVIEW_TELEGRAM_CHAT, text: messageText }),
  });
  const tgJson = await tgRes.json();
  if (!tgJson.ok) throw new Error(tgJson.description || '전송 실패');
}

// ─── 승인 + 즉시 전송 ───
async function approveAndSend(rowIndex, stage) {
  const btns = document.querySelectorAll(`[onclick*="approveAndSend('${rowIndex}'"]`);
  btns.forEach(b => { b.textContent = '처리 중...'; b.disabled = true; });

  try {
    if (USE_SAMPLE) {
      const t = (STATE.dbFindings||[]).find(d => d.id === rowIndex);
      if (t) { t['심의승인여부']='Y'; t['심의단계']=stage; t['전송완료여부']='Y'; }
      showToast(`📤 [${stage}] 승인 및 전송 완료! (샘플)`);
      renderAdmReview();
      return;
    }

    const targetRow = (STATE.dbFindings || []).find(d => d.id === rowIndex);
    if (!targetRow) throw new Error('행을 찾을 수 없습니다');
    const rowId = targetRow.id;

    // 1. 승인 저장
    const { error } = await SUPA.from('db_findings').update({
      '심의승인여부': 'Y', '심의승인일시': new Date().toISOString(), '심의단계': stage,
    }).eq('id', rowId);
    if (error) throw new Error(error.message);

    // 2. 텔레그램 전송
    const { data: refreshed } = await SUPA.from('db_findings').select('*');
    STATE.dbFindings = (refreshed || []).map((r, i) => ({ ...r, __rowIndex: parseInt(r.id) || i }));
    const r = STATE.dbFindings.find(d => d.id === rowId);

    try {
      await _sendTelegramReview(stage, r);
    } catch(tgErr) {
      await SUPA.from('db_findings').update({ '전송완료여부': 'F' }).eq('id', rowId);
      const { data: r2 } = await SUPA.from('db_findings').select('*');
      STATE.dbFindings = (r2 || []).map((d, i) => ({ ...d, __rowIndex: parseInt(d.id) || i }));
      alert(`텔레그램 전송 실패:\n${tgErr.message}`);
      renderAdmReview();
      return;
    }

    // 3. 전송 완료 저장
    await SUPA.from('db_findings').update({
      '전송완료여부': 'Y', '전송완료일시': new Date().toISOString(),
    }).eq('id', rowId);

    const [{ data: refreshed2 }, { data: freshNujeok }] = await Promise.all([
      SUPA.from('db_findings').select('*'),
      SUPA.from('nujeok').select('*'),
    ]);
    STATE.dbFindings = (refreshed2 || []).map((d, i) => ({ ...d, __rowIndex: parseInt(d.id) || i }));
    if (freshNujeok) {
      const cc = STATE.canonicalCenters;
      STATE.nujeok = freshNujeok.map((r, i) => ({
        ...r,
        '목표개강(연도/월)': normalizeKaigang(r['목표개강(연도/월)']),
        '이전개강':          normalizeKaigang(r['이전개강']),
        '목표센터':          normalizeCenter(r['목표센터'], cc),
        __rowIndex: parseInt(r.id) || i,
      }));
    }

    showToast(`📤 [${stage}] 승인 및 전송 완료!`);
    renderAdmReview();
  } catch(e) {
    alert(`승인 실패:\n${e.message}`);
    btns.forEach(b => { b.textContent = `✓ ${stage} 승인`; b.disabled = false; });
  }
}

// ─── 텔레그램 전송 (승인 완료 후) ───
async function sendTelegram(rowIndex, stage) {
  const btns = document.querySelectorAll(`[onclick*="sendTelegram('${rowIndex}'"]`);
  btns.forEach(b => { b.textContent = '전송 중...'; b.disabled = true; });

  try {
    if (USE_SAMPLE) {
      const t = (STATE.dbFindings||[]).find(d => d.id === rowIndex);
      if (t) t['전송완료여부'] = 'Y';
      showToast('📤 지파전송 완료! (샘플)');
      renderAdmReview();
      return;
    }

    const targetRow = (STATE.dbFindings || []).find(d => d.id === rowIndex);
    if (!targetRow) throw new Error('행을 찾을 수 없습니다');
    const rowId = targetRow.id;

    try {
      await _sendTelegramReview(stage, targetRow);
    } catch(tgErr) {
      // 전송 실패 상태 저장 → 배지를 빨간색 "지파전송필요"로 표시
      await SUPA.from('db_findings').update({ '전송완료여부': 'F' }).eq('id', rowId);
      const { data: refreshed } = await SUPA.from('db_findings').select('*');
      STATE.dbFindings = (refreshed || []).map((r, i) => ({ ...r, __rowIndex: parseInt(r.id) || i }));
      alert(`텔레그램 전송 실패:\n${tgErr.message}`);
      renderAdmReview();
      return;
    }

    await SUPA.from('db_findings').update({
      '전송완료여부': 'Y', '전송완료일시': new Date().toISOString(),
    }).eq('id', rowId);

    const { data: refreshed } = await SUPA.from('db_findings').select('*');
    STATE.dbFindings = (refreshed || []).map((r, i) => ({ ...r, __rowIndex: parseInt(r.id) || i }));

    showToast(`📤 [${stage}] 지파전송 완료!`);
    renderAdmReview();
  } catch(e) {
    alert(`전송 실패:\n${e.message}`);
    btns.forEach(b => { b.textContent = '📤 지파전송'; b.disabled = false; });
  }
}
