// ══════════════════════════════════════════════════════
//  pages/reg-board.js — 지역 담당자 보유현황
// ══════════════════════════════════════════════════════

const VALID_STAGES = ['찾기', '합자', '육따기', '영따기', '복음방', '센확', '수신'];

function renderRegBoard() {
  const regionF  = document.getElementById('reg-region-sel')?.value  || '';
  const kaigangF = document.getElementById('reg-kaigang-sel')?.value || '';
  const centerF  = document.getElementById('reg-center-sel')?.value  || '';
  const stageF   = document.getElementById('reg-stage-sel')?.value   || '';
  const sortVal  = document.getElementById('reg-sort-sel')?.value    || 'stage-asc';

  // 필터 드롭다운 옵션 채우기
  _fillRegBoardSelects();

  // 만남 데이터를 섭외자+인도자 키로 인덱싱
  const meetMap = {};
  (STATE.meets || []).forEach(m => {
    const key = (m['섭외자'] || '') + '|' + (m['인도자'] || '');
    if (!meetMap[key] || (m._date && (!meetMap[key]._date || m._date > meetMap[key]._date))) {
      meetMap[key] = m;
    }
  });

  let data = STATE.nujeok
    .filter(r => VALID_STAGES.includes(r['단계']))
    .filter(r => {
      // 지역 권한이면 허용된 지역만
      const allowed = getAllowedRegions();
      if (allowed !== null && !allowed.includes(r['실적지역'])) return false;
      return true;
    })
    .filter(r => !kaigangF || r['목표개강(연도/월)']  === kaigangF)
    .filter(r => !centerF  || r['목표센터']           === centerF)
    .filter(r => !stageF   || r['단계']               === stageF);

  // 정렬
  data = _sortRegBoard(data, meetMap, sortVal);

  const countEl = document.getElementById('reg-board-count');
  if (countEl) countEl.textContent = `${data.length}명`;

  const tbody = document.getElementById('reg-board-body');
  if (!data.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text3);">데이터가 없습니다</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(r => {
    const tallag  = isTallag(r);
    const style   = tallag ? 'opacity:.5;' : '';
    const ri      = r['__rowIndex'];
    const meetKey = (r['섭외자'] || '') + '|' + (r['인도자'] || '');
    const meet    = meetMap[meetKey];
    const meetDate = meet?._date ? fmtMD(meet._date) : (meet?.['다음만남일'] || '—');
    const meetPurpose = meet?.['다음만남목적'] || '—';

    // 심의요청 상태 확인 (DB_찾기에서 찾기)
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

    return `<tr style="${style}cursor:pointer;" class="cr" onclick="openPersonDetail(${ri})">
      <td>
        ${stageBadge(r['단계'])}
        ${tallag ? '<span class="badge b-red" style="margin-left:4px;">탈락</span>' : ''}
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

    const keyA = (a['섭외자'] || '') + '|' + (a['인도자'] || '');
    const keyB = (b['섭외자'] || '') + '|' + (b['인도자'] || '');
    const dA   = meetMap[keyA]?._date?.getTime() || 0;
    const dB   = meetMap[keyB]?._date?.getTime() || 0;

    if (sortVal === 'meet-asc')  return dA - dB;
    if (sortVal === 'meet-desc') return dB - dA;
    return 0;
  });
}

function _fillRegBoardSelects() {
  const data = STATE.nujeok.filter(r => VALID_STAGES.includes(r['단계']));

  _fillSelect('reg-region-sel',  [...new Set(data.map(r => r['실적지역']).filter(Boolean))].sort());
  _fillSelect('reg-kaigang-sel', [...new Set(data.map(r => r['목표개강(연도/월)']).filter(Boolean))].sort());
  _fillSelect('reg-center-sel',  [...new Set(data.map(r => r['목표센터']).filter(Boolean))].sort());
}

function _fillSelect(id, options) {
  const sel = document.getElementById(id);
  if (!sel) return;
  const cur = sel.value;
  const opts = ['<option value="">전체</option>',
    ...options.map(v => `<option${v === cur ? ' selected' : ''}>${v}</option>`)
  ];
  sel.innerHTML = opts.join('');
}

// ─── 심의요청 모달 ───
let _reviewRow = null;

function openRequestReviewModal(rowIndex) {
  _reviewRow = STATE.nujeok.find(r => r['__rowIndex'] === rowIndex);
  if (!_reviewRow) return;

  // 현재 단계로 기본 선택
  const stage = _reviewRow['단계'] || '찾기';
  document.getElementById('review-stage-sel').value = stage;
  document.getElementById('review-name').textContent  = _reviewRow['섭외자'] || '—';
  document.getElementById('review-stage-txt').textContent = stage;
  document.getElementById('request-review-modal').classList.add('show');
}

function closeRequestReviewModal() {
  document.getElementById('request-review-modal').classList.remove('show');
  _reviewRow = null;
}

async function submitRequestReview() {
  if (!_reviewRow) return;

  const stage = document.getElementById('review-stage-sel').value;

  // DB_찾기에서 해당 섭외자 찾기
  let dbRow = (STATE.dbFindings || []).find(d =>
    d['섭외자'] === _reviewRow['섭외자'] && d['인도자'] === _reviewRow['인도자']
  );

  const btn = document.getElementById('review-submit-btn');
  if (btn) { btn.textContent = '요청 중...'; btn.disabled = true; }

  try {
    if (USE_SAMPLE) {
      showToast('✅ 심의 요청 완료 (샘플)');
      closeRequestReviewModal();
      renderRegBoard();
      return;
    }

    // DB_찾기에 없으면 먼저 저장
    if (!dbRow) {
      const saveRes = await gasPost({
        action: 'saveOrUpdateDbFinding',
        구분: _reviewRow['단계'] || '찾기',
        ...Object.fromEntries(
          Object.entries(_reviewRow).filter(([k]) => !k.startsWith('__'))
        ),
      });
      STATE.dbFindings = saveRes.dbFindings || STATE.dbFindings;
      dbRow = (STATE.dbFindings || []).find(d =>
        d['섭외자'] === _reviewRow['섭외자'] && d['인도자'] === _reviewRow['인도자']
      );
    }

    const res = await gasPost({
      action: 'requestReview',
      __rowIndex: dbRow?.['__rowIndex'],
      심의단계: stage,
    });

    if (!res.success) throw new Error(res.error);
    STATE.dbFindings = res.dbFindings;

    showToast('✅ 심의 요청 완료!');
    closeRequestReviewModal();
    renderRegBoard();
  } catch(e) {
    showToast('⚠️ 요청 실패: ' + e.message, 'error');
    if (btn) { btn.textContent = '심의 요청'; btn.disabled = false; }
  }
}
