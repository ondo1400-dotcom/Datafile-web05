// ══════════════════════════════════════════════════════
//  pages/adm-dropdown.js — 드롭다운 옵션 관리
// ══════════════════════════════════════════════════════

const DROPDOWN_FIELDS = [
  { key: '실적지역',       label: '실적지역' },
  { key: '목표센터',       label: '목표센터' },
  { key: '섭외유형',       label: '섭외유형' },
  { key: '종교',           label: '종교' },
  { key: '다음만남확티현황', label: '다음만남확티현황' },
  { key: '따기주간횟수',   label: '따기주간횟수' },
  { key: '따기유형',       label: '따기유형' },
  { key: '따기단계',       label: '따기단계' },
  { key: '컨설팅유무',     label: '컨설팅유무' },
];

const DEFAULT_DROPDOWN_VALUES = {
  '실적지역': ['화정', '대학', '상암', '명동', '새소망', '새신자', '완성'],
  '목표센터': ['서울센터', '부산센터', '대구센터', '광주센터', '대전센터'],
  '섭외유형': ['지인', '전도', '소개', '기타'],
  '종교': ['무교', '기독교', '불교', '천주교', '기타'],
  '다음만남확티현황': ['확정', '잠정', '미정'],
  '따기주간횟수': ['1회', '2회', '3회', '4회', '5회'],
  '따기유형': [],
  '따기단계': [],
  '컨설팅유무': ['컨설팅', '인터뷰'],
};

let _dropdownEditState = {};

async function loadDropdownOptions() {
  if (USE_SAMPLE) {
    STATE.dropdownOptions = { ...DEFAULT_DROPDOWN_VALUES };
    return;
  }
  try {
    const { data, error } = await SUPA.from('dropdown_options').select('*');
    if (error) throw new Error(error.message);

    const opts = { ...DEFAULT_DROPDOWN_VALUES };
    (data || []).forEach(r => {
      if (r.field_name && Array.isArray(r.options)) {
        opts[r.field_name] = r.options;
      }
    });
    STATE.dropdownOptions = opts;
  } catch (e) {
    console.warn('dropdown_options 로드 실패, 기본값 사용:', e.message);
    STATE.dropdownOptions = { ...DEFAULT_DROPDOWN_VALUES };
  }
}

function renderAdmDropdown() {
  const container = document.getElementById('adm-dropdown-content');
  if (!container) return;

  const opts = STATE.dropdownOptions || DEFAULT_DROPDOWN_VALUES;
  _dropdownEditState = {};
  DROPDOWN_FIELDS.forEach(f => {
    _dropdownEditState[f.key] = [...(opts[f.key] || [])];
  });

  container.innerHTML = DROPDOWN_FIELDS.map(f => {
    const items = _dropdownEditState[f.key];
    return `
      <div class="dd-field-card" id="dd-card-${f.key}">
        <div class="dd-field-header">
          <div class="dd-field-title">${f.label}</div>
          <div class="dd-field-count">${items.length}개 옵션</div>
        </div>
        <div class="dd-items-list" id="dd-list-${f.key}">
          ${_renderDropdownItems(f.key, items)}
        </div>
        <div class="dd-add-row">
          <input type="text" class="dd-add-input" id="dd-input-${f.key}"
            placeholder="새 옵션 입력" onkeydown="if(event.key==='Enter')addDropdownOption('${f.key}')">
          <button class="dd-add-btn" onclick="addDropdownOption('${f.key}')">추가</button>
        </div>
      </div>
    `;
  }).join('');
}

function _renderDropdownItems(key, items) {
  if (!items.length) {
    return '<div class="dd-empty">등록된 옵션이 없습니다</div>';
  }
  return items.map((item, idx) => `
    <div class="dd-item" draggable="true"
      ondragstart="ddDragStart(event,'${key}',${idx})"
      ondragover="ddDragOver(event)"
      ondrop="ddDrop(event,'${key}',${idx})">
      <span class="dd-drag-handle">⠿</span>
      <span class="dd-item-text">${item}</span>
      <button class="dd-item-del" onclick="removeDropdownOption('${key}',${idx})" title="삭제">×</button>
    </div>
  `).join('');
}

function _refreshDropdownCard(key) {
  const items = _dropdownEditState[key];
  const list = document.getElementById('dd-list-' + key);
  if (list) list.innerHTML = _renderDropdownItems(key, items);

  const card = document.getElementById('dd-card-' + key);
  if (card) {
    const countEl = card.querySelector('.dd-field-count');
    if (countEl) countEl.textContent = items.length + '개 옵션';
  }
}

function addDropdownOption(key) {
  const input = document.getElementById('dd-input-' + key);
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;
  if (_dropdownEditState[key].includes(val)) {
    showToast('이미 존재하는 옵션입니다', 'error');
    return;
  }
  _dropdownEditState[key].push(val);
  input.value = '';
  _refreshDropdownCard(key);
  _saveDropdownField(key);
}

function removeDropdownOption(key, idx) {
  const removed = _dropdownEditState[key].splice(idx, 1)[0];
  _refreshDropdownCard(key);
  _saveDropdownField(key);
  showToast('"' + removed + '" 삭제됨');
}

// Drag & drop reorder
let _ddDragKey = null, _ddDragIdx = -1;

function ddDragStart(e, key, idx) {
  _ddDragKey = key;
  _ddDragIdx = idx;
  e.dataTransfer.effectAllowed = 'move';
}

function ddDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function ddDrop(e, key, dropIdx) {
  e.preventDefault();
  if (_ddDragKey !== key || _ddDragIdx === dropIdx) return;
  const items = _dropdownEditState[key];
  const [moved] = items.splice(_ddDragIdx, 1);
  items.splice(dropIdx, 0, moved);
  _refreshDropdownCard(key);
  _saveDropdownField(key);
}

let _savePending = {};

function _saveDropdownField(key) {
  if (_savePending[key]) clearTimeout(_savePending[key]);
  _savePending[key] = setTimeout(() => _doSaveDropdownField(key), 400);
}

async function _doSaveDropdownField(key) {
  const options = [..._dropdownEditState[key]];

  STATE.dropdownOptions = STATE.dropdownOptions || {};
  STATE.dropdownOptions[key] = options;

  if (USE_SAMPLE) return;

  try {
    const { error } = await SUPA
      .from('dropdown_options')
      .upsert({ field_name: key, options: options }, { onConflict: 'field_name' });
    if (error) throw new Error(error.message);
  } catch (e) {
    showToast('저장 실패: ' + e.message, 'error');
  }
}
