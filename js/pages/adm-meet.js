// ══════════════════════════════════════════════════════
//  pages/adm-meet.js — 만남 캘린더
//  다음만남일 시트 기반, 헤더 동적 파싱
// ══════════════════════════════════════════════════════

// ─── 날짜 파싱 (다양한 형식 지원) ───
function parseMeetDate(raw) {
  if (!raw) return null;

  // 이미 Date 객체 (구글시트에서 날짜셀로 읽힌 경우)
  if (raw instanceof Date && !isNaN(raw)) {
    return new Date(raw.getFullYear(), raw.getMonth(), raw.getDate());
  }

  const str  = String(raw).trim();
  if (!str) return null;
  const year = new Date().getFullYear();
  const today = new Date(); today.setHours(0,0,0,0);

  // ISO 8601 (GAS 직렬화): "2026-05-21T15:00:00.000Z"
  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})T[\d:.]+Z?$/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3]);

  // YYYY-MM-DD or YYYY/MM/DD
  m = str.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})$/);
  if (m) return new Date(+m[1], +m[2]-1, +m[3]);

  // MM-DD or MM/DD or MM.DD
  m = str.match(/^(\d{1,2})[-\/\.](\d{1,2})$/);
  if (m) {
    const d = new Date(year, +m[1]-1, +m[2]);
    if (d < today) d.setFullYear(year + 1);
    return d;
  }

  // MMDD (4자리)
  m = str.match(/^(\d{2})(\d{2})$/);
  if (m) {
    const d = new Date(year, +m[1]-1, +m[2]);
    if (d < today) d.setFullYear(year + 1);
    return d;
  }

  // MM월DD일
  m = str.match(/^(\d{1,2})월\s*(\d{1,2})일?$/);
  if (m) {
    const d = new Date(year, +m[1]-1, +m[2]);
    if (d < today) d.setFullYear(year + 1);
    return d;
  }

  // DD만
  m = str.match(/^(\d{1,2})일?$/);
  if (m) return new Date(year, today.getMonth(), +m[1]);

  return null;
}

function dateDiff(date) {
  if (!date) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(date); d.setHours(0,0,0,0);
  return Math.round((d - today) / 86400000);
}

function fmtMD(date) {
  if (!date) return '';
  return `${date.getMonth()+1}/${date.getDate()}`;
}

// ─── 시간 포맷 (GAS ISO 시간 직렬화 처리) ───
// 구글 시트 시간 셀은 GAS에서 "1899-12-30T{UTC시간}Z" 형식으로 직렬화됨 (UTC+9 변환 필요)
function fmtTime(val) {
  if (!val) return '';
  const s = String(val).trim();
  const m = s.match(/^1899-12-30T(\d{2}):(\d{2}):/);
  if (m) {
    const h = (parseInt(m[1]) + 9) % 24;
    return `${String(h).padStart(2,'0')}:${m[2]}`;
  }
  return s;
}

// ─── 수정 폼 입력값 포맷 (ISO → 사람이 읽기 좋은 형식) ───
function fmtValForEdit(field, val) {
  if (!val) return '';
  const s = String(val).trim();
  if (field === '다음만남일') {
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T/);
    if (m) return `${parseInt(m[2])}/${parseInt(m[3])}`;
  }
  if (field === '다음만남시간') {
    const m = s.match(/^1899-12-30T(\d{2}):(\d{2}):/);
    if (m) {
      const h = (parseInt(m[1]) + 9) % 24;
      return `${String(h).padStart(2,'0')}:${m[2]}`;
    }
  }
  return val;
}

const WEEKDAYS = ['일','월','화','수','목','금','토'];
const RESULT_EMOJI = { '🎉':'단계향상', '⭕️':'만남완료', '❌':'불발', '':'미입력' };

// ─── 현재 캘린더 상태 ───
let calYear  = new Date().getFullYear();
let calMonth = new Date().getMonth(); // 0-based
let meetRegionFilter = '';

function renderAdmMeet() {
  renderMeetSummary();
  renderCalendar();
}

// ══ 상단 요약 (오늘/내일/어제결과) ══
function renderMeetSummary() {
  const meets = STATE.meets || [];
  const today = new Date(); today.setHours(0,0,0,0);

  const todayMeets    = meets.filter(r => dateDiff(r._date) === 0);
  const tomorrowMeets = meets.filter(r => dateDiff(r._date) === 1);
  const yesterdayMeets= meets.filter(r => dateDiff(r._date) === -1);
  const upcomingMeets = meets.filter(r => { const d = dateDiff(r._date); return d !== null && d > 1 && d <= 7; });

  const summaryEl = document.getElementById('meet-summary');
  if (!summaryEl) return;

  const makeMiniChips = (list) => list.slice(0,6).map(r => {
    const result = r['만남결과'] || '';
    const emoji  = result ? result : '•';
    const sc     = STAGE_COLORS[r['단계']] || {bg:'#f0f0f0',c:'#555'};
    return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;padding:2px 7px;border-radius:20px;background:${sc.bg};color:${sc.c};margin:2px;">
      ${emoji} ${r['섭외자']||'—'}
    </span>`;
  }).join('') + (list.length > 6 ? `<span style="font-size:11px;color:var(--text3);"> +${list.length-6}명</span>` : '');

  summaryEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">
      <div class="stat-card" style="background:#EEF2FF;border-color:var(--adm-mid);">
        <div class="stat-label">오늘 만남</div>
        <div class="stat-val adm" style="font-size:20px;">${todayMeets.length}건</div>
        <div style="margin-top:6px;">${makeMiniChips(todayMeets)}</div>
      </div>
      <div class="stat-card" style="background:var(--reg-light);border-color:var(--reg-mid);">
        <div class="stat-label">내일 만남</div>
        <div class="stat-val reg" style="font-size:20px;">${tomorrowMeets.length}건</div>
        <div style="margin-top:6px;">${makeMiniChips(tomorrowMeets)}</div>
      </div>
      <div class="stat-card base">
        <div class="stat-label">어제 결과</div>
        <div style="display:flex;gap:8px;margin-top:6px;font-size:13px;font-weight:700;">
          <span>🎉 ${yesterdayMeets.filter(r=>r['만남결과']==='🎉').length}</span>
          <span>⭕️ ${yesterdayMeets.filter(r=>r['만남결과']==='⭕️').length}</span>
          <span>❌ ${yesterdayMeets.filter(r=>r['만남결과']==='❌').length}</span>
          <span style="color:var(--text3);">미 ${yesterdayMeets.filter(r=>!r['만남결과']).length}</span>
        </div>
        <div style="margin-top:4px;">${makeMiniChips(yesterdayMeets)}</div>
      </div>
      <div class="stat-card base">
        <div class="stat-label">이번주 예정</div>
        <div class="stat-val" style="font-size:20px;color:var(--purple);">${upcomingMeets.length}건</div>
        <div style="margin-top:6px;">${makeMiniChips(upcomingMeets)}</div>
      </div>
    </div>
  `;
}

// ══ 월별 캘린더 ══
function renderCalendar() {
  const meets  = STATE.meets || [];
  const region = meetRegionFilter;

  // 월 표시 업데이트
  const monthEl = document.getElementById('cal-month-label');
  if (monthEl) monthEl.textContent = `${calYear}년 ${calMonth+1}월`;

  // 이달 날짜 계산
  const firstDay = new Date(calYear, calMonth, 1);
  const lastDay  = new Date(calYear, calMonth+1, 0);
  const startDow = firstDay.getDay(); // 0=일

  // 만남 데이터 날짜별 그룹
  const byDate = {};
  meets
    .filter(r => !region || r['실적지역'] === region)
    .forEach(r => {
      if (!r._date) return;
      if (r._date.getFullYear() !== calYear || r._date.getMonth() !== calMonth) return;
      const key = r._date.getDate();
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(r);
    });

  const today = new Date(); today.setHours(0,0,0,0);

  // 달력 그리기
  let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">`;

  // 요일 헤더
  ['일','월','화','수','목','금','토'].forEach((d,i) => {
    const color = i===0?'var(--red)':i===6?'var(--adm2)':'var(--text2)';
    html += `<div style="text-align:center;font-size:11px;font-weight:700;color:${color};padding:6px 0;background:var(--surface2);border-radius:6px;">${d}</div>`;
  });

  // 빈 칸 (월 시작 전)
  for (let i = 0; i < startDow; i++) {
    html += `<div style="min-height:80px;background:var(--surface2);border-radius:6px;opacity:.3;"></div>`;
  }

  // 날짜 셀
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const cellDate  = new Date(calYear, calMonth, d);
    const isToday   = cellDate.getTime() === today.getTime();
    const isPast    = cellDate < today;
    const dow       = cellDate.getDay();
    const dayMeets  = byDate[d] || [];
    const hasMeets  = dayMeets.length > 0;

    const borderStyle = isToday ? '2px solid var(--adm2)' : '1px solid var(--border)';
    const bgStyle     = isToday ? 'var(--adm-light)' : isPast ? '#FAFAFA' : '#fff';
    const numColor    = dow===0 ? 'var(--red)' : dow===6 ? 'var(--adm2)' : isToday ? 'var(--adm2)' : 'var(--text1)';

    // 결과 요약 (어제 이전)
    const done    = dayMeets.filter(r => r['만남결과']).length;
    const notDone = dayMeets.length - done;

    // 사람 칩들
    const chips = dayMeets.slice(0,4).map(r => {
      const result = r['만남결과'] || '';
      const sc     = STAGE_COLORS[r['단계']] || {bg:'#f0f0f0',c:'#555'};
      const dot    = result === '🎉' ? '🎉' : result === '⭕️' ? '✅' : result === '전티완료' ? '🟡' : result === '확티완료' ? '🟢' : '🔴';
      return `<div onclick="openMeetResult('${encodeURIComponent(JSON.stringify(r))}')"
        style="display:flex;align-items:center;gap:3px;font-size:10px;padding:2px 5px;border-radius:10px;background:${sc.bg};color:${sc.c};margin-bottom:2px;cursor:pointer;white-space:nowrap;overflow:hidden;"
        title="${r['섭외자']||''} · ${r['단계']||''} · ${r['인도자']||''}">
        ${dot} <span style="overflow:hidden;text-overflow:ellipsis;">${r['섭외자']||'—'}</span>
      </div>`;
    }).join('');

    const moreTxt = dayMeets.length > 4
      ? `<div style="font-size:9px;color:var(--text3);text-align:right;">+${dayMeets.length-4}명</div>` : '';

    html += `<div style="min-height:80px;border:${borderStyle};border-radius:8px;background:${bgStyle};padding:4px;position:relative;">
      <div style="font-size:12px;font-weight:700;color:${numColor};margin-bottom:3px;display:flex;align-items:center;justify-content:space-between;">
        <span>${d}</span>
        ${hasMeets ? `<span style="font-size:10px;background:var(--adm2);color:#fff;border-radius:10px;padding:1px 5px;font-weight:600;">${dayMeets.length}</span>` : ''}
      </div>
      ${chips}${moreTxt}
    </div>`;
  }

  // 나머지 빈 칸
  const totalCells = startDow + lastDay.getDate();
  const remainder  = totalCells % 7;
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      html += `<div style="min-height:80px;background:var(--surface2);border-radius:6px;opacity:.3;"></div>`;
    }
  }

  html += `</div>`;
  const calEl = document.getElementById('cal-grid');
  if (calEl) calEl.innerHTML = html;
}

// ══ 만남 결과 입력 모달 ══
let _currentMeetRow = null;

function openMeetResult(encoded) {
  _currentMeetRow = JSON.parse(decodeURIComponent(encoded));
  const r = _currentMeetRow;

  const modal = document.getElementById('meet-result-modal');
  document.getElementById('mr-name').textContent   = r['섭외자'] || '—';
  document.getElementById('mr-date').textContent   = fmtMD(r._date) + (r['다음만남시간'] ? ' ' + fmtTime(r['다음만남시간']) : '');
  document.getElementById('mr-stage').textContent  = r['단계'] || '—';
  document.getElementById('mr-guide').textContent  = r['인도자'] || '—';
  document.getElementById('mr-region').textContent = r['실적지역'] || '—';
  document.getElementById('mr-purpose').textContent= r['다음만남목적'] || '—';

  // 현재 결과 버튼 활성화
  document.querySelectorAll('.mr-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.val === (r['만남결과'] || ''));
  });

  modal.classList.add('show');
}

function closeMeetResult() {
  document.getElementById('meet-result-modal').classList.remove('show');
  _currentMeetRow = null;
}

async function saveMeetResult(emoji) {
  if (!_currentMeetRow) return;

  document.querySelectorAll('.mr-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.val === emoji);
  });

  // STATE 업데이트
  const target = (STATE.meets || []).find(r =>
    r['섭외자'] === _currentMeetRow['섭외자'] &&
    r['인도자'] === _currentMeetRow['인도자'] &&
    r['__rowIndex'] === _currentMeetRow['__rowIndex']
  );
  if (target) target['만남결과'] = emoji;

  if (USE_SAMPLE) {
    showToast('💾 결과 저장됨 (샘플 모드)');
    renderCalendar();
    renderMeetSummary();
    return;
  }

  try {
    const rowId = _currentMeetRow['id'] || _currentMeetRow['__rowIndex'];
    const { error } = await SUPA.from('meets').update({ '만남결과': emoji }).eq('id', rowId);
    if (error) throw new Error(error.message);
    showToast(emoji + ' 결과 저장됨');
    renderCalendar();
    renderMeetSummary();
  } catch(e) {
    showToast('⚠️ 저장 실패: ' + e.message, 'error');
  }
}

// ══ 월 이동 ══
function calPrev() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}
function calNext() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}
function calToday() {
  calYear  = new Date().getFullYear();
  calMonth = new Date().getMonth();
  renderCalendar();
}

// ══ 지역 필터 ══
function setMeetRegion(val) {
  meetRegionFilter = val;
  renderAdmMeet();
}
