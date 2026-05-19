// ══════════════════════════════════════════════════════
//  pages/reg-check.js — 지역 담당자 개강 준비 체크 입력
// ══════════════════════════════════════════════════════

function renderRegCheck() {
  const regionF  = document.getElementById('reg-check-region-sel')?.value || '';
  const people   = STATE.nujeok
    .filter(r => (!regionF || r['실적지역'] === regionF) && !isTallag(r));

  const container = document.getElementById('reg-check-list');

  if (!people.length) {
    container.innerHTML = '<div style="color:var(--text3);padding:20px;text-align:center;">지역을 선택하거나 데이터가 없습니다</div>';
    return;
  }
  if (!STATE.checkItems.length) {
    container.innerHTML = '<div class="error-box">⚠️ 체크 항목이 없습니다. 청년회 관리자가 설정탭에서 항목을 추가해주세요.</div>';
    return;
  }

  const checkMap = buildCheckMap();

  container.innerHTML = people.map(r => {
    const key      = makeKey(r);
    const initials = (r['섭외자'] || '?').charAt(0);
    const doneCount = STATE.checkItems.filter(item => checkMap[key + '||' + item]?.checked).length;

    const itemRows = STATE.checkItems.map(item => {
      const ck        = key + '||' + item;
      const st        = checkMap[ck] || { checked: false, 체크자: '', 체크일시: '' };
      const checkedCls = st.checked ? 'checked' : '';
      const cbCls      = st.checked ? 'on' : '';
      const metaText   = st.checked && st.체크자 ? `✓ ${st.체크자} ${st.체크일시}` : '미체크';
      // data 속성으로 key/item 전달 (onclick 문자열 이스케이프 방지)
      const safeKey  = key.replace(/'/g, "\\'");
      const safeItem = item.replace(/'/g, "\\'");

      return `<div class="check-item-row ${checkedCls}">
        <div class="check-cb ${cbCls}" onclick="toggleCheck('${safeKey}','${safeItem}',this)"></div>
        <span class="check-item-label">${item}</span>
        <span class="check-item-meta">${metaText}</span>
      </div>`;
    }).join('');

    return `<div class="check-person-card">
      <div class="check-person-header">
        <div class="check-av">${initials}</div>
        <div>
          <div class="check-name">${r['섭외자'] || '—'}</div>
          <div class="check-meta">
            ${r['실적지역'] || ''} · ${r['단계'] || ''} · 인도자: ${r['인도자'] || ''} · 개강: ${r['목표개강(연도/월)'] || ''}
          </div>
        </div>
        <div style="margin-left:auto;font-size:12px;font-weight:600;color:${doneCount === STATE.checkItems.length ? 'var(--green)' : 'var(--text3)'};">
          ${doneCount}/${STATE.checkItems.length} 완료
        </div>
      </div>
      <div class="check-body">${itemRows}</div>
    </div>`;
  }).join('');
}

// 체크 토글
async function toggleCheck(key, item, cbEl) {
  const checkerName = document.getElementById('checker-name')?.value?.trim() || '';
  if (!checkerName) {
    showToast('⚠️ 체크자 이름을 먼저 입력해주세요', 'error');
    document.getElementById('checker-name')?.focus();
    return;
  }

  const newChecked = !cbEl.classList.contains('on');
  cbEl.classList.toggle('on', newChecked);

  const row = cbEl.closest('.check-item-row');
  row.classList.toggle('checked', newChecked);

  const metaEl = row.querySelector('.check-item-meta');
  const now    = new Date().toLocaleString('ko-KR');
  if (metaEl) metaEl.textContent = newChecked ? `✓ ${checkerName} 방금` : '미체크';

  // STATE 업데이트
  let existing = STATE.checks.find(c => c['복합키'] === key && c['항목명'] === item);
  if (existing) {
    existing['체크여부'] = newChecked ? 'Y' : 'N';
    existing['체크자']   = checkerName;
    existing['체크일시'] = now;
  } else {
    const nujeokRow = STATE.nujeok.find(r => makeKey(r) === key) || {};
    STATE.checks.push({
      '복합키':            key,
      '실적지역':          nujeokRow['실적지역']          || '',
      '인도자':            nujeokRow['인도자']            || '',
      '섭외자':            nujeokRow['섭외자']            || '',
      '목표개강(연도/월)': nujeokRow['목표개강(연도/월)'] || '',
      '목표센터':          nujeokRow['목표센터']          || '',
      '단계':              nujeokRow['단계']              || '',
      '항목명':            item,
      '체크여부':          newChecked ? 'Y' : 'N',
      '체크자':            checkerName,
      '체크일시':          now,
    });
  }

  // 시트 저장
  if (USE_SAMPLE) {
    showToast(newChecked ? '💾 체크 저장됨 (샘플 모드)' : '↩️ 체크 해제됨 (샘플 모드)');
    return;
  }

  try {
    const nujeokRow = STATE.nujeok.find(r => makeKey(r) === key) || {};
    await gasPost({
      action:    'saveCheck',
      key,
      itemName:  item,
      checked:   newChecked,
      checker:   checkerName,
      nujeokInfo: nujeokRow,
    });
    showToast(newChecked ? '✅ 체크 저장됨' : '↩️ 체크 해제됨');
  } catch (e) {
    showToast('⚠️ 저장 실패: ' + e.message, 'error');
  }
}
