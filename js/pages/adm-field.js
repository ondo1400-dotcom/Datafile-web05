// ══════════════════════════════════════════════════════
//  pages/adm-field.js — 청년회 체크 항목 관리 (설정)
// ══════════════════════════════════════════════════════

function renderItemManage() {
  const list = document.getElementById('item-manage-list');

  if (!STATE.checkItems.length) {
    list.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:10px;">등록된 항목이 없습니다. 항목을 추가해주세요.</div>';
    return;
  }

  list.innerHTML = STATE.checkItems.map(item => `
    <div class="item-manage-row">
      <span style="width:10px;height:10px;border-radius:50%;background:var(--reg2);display:inline-block;margin-right:4px;flex-shrink:0;"></span>
      <span class="item-manage-name">${item}</span>
      <button class="item-manage-del" onclick="removeItem('${item}')">삭제</button>
    </div>
  `).join('');
}

// 추가 모달 열기
function showAddItemModal() {
  document.getElementById('add-item-modal').classList.add('show');
  setTimeout(() => document.getElementById('new-item-input').focus(), 50);
}

// 추가 모달 닫기
function closeAddItemModal() {
  document.getElementById('add-item-modal').classList.remove('show');
  document.getElementById('new-item-input').value = '';
}

// 항목 추가 확정
async function addItemConfirm() {
  const name = document.getElementById('new-item-input').value.trim();
  if (!name) return;

  if (USE_SAMPLE) {
    if (!STATE.checkItems.includes(name)) STATE.checkItems.push(name);
    closeAddItemModal();
    renderItemManage();
    showToast('✅ 항목 추가됨 (샘플 모드 — 시트 미저장)');
    return;
  }

  try {
    const { error } = await SUPA.from('check_items').insert({ '항목명': name, sort_order: STATE.checkItems.length + 1 });
    if (error) throw new Error(error.message);
    STATE.checkItems.push(name);
    closeAddItemModal();
    renderItemManage();
    showToast('✅ 항목 추가됨');
  } catch (e) {
    showToast('⚠️ 추가 실패: ' + e.message, 'error');
  }
}

// 항목 삭제
async function removeItem(name) {
  if (!confirm(`"${name}" 항목을 삭제할까요?`)) return;

  if (USE_SAMPLE) {
    STATE.checkItems = STATE.checkItems.filter(i => i !== name);
    renderItemManage();
    showToast('🗑 항목 삭제됨 (샘플 모드)');
    return;
  }

  try {
    const { error } = await SUPA.from('check_items').delete().eq('항목명', name);
    if (error) throw new Error(error.message);
    STATE.checkItems = STATE.checkItems.filter(i => i !== name);
    renderItemManage();
    showToast('🗑 항목 삭제됨');
  } catch (e) {
    showToast('⚠️ 삭제 실패: ' + e.message, 'error');
  }
}
