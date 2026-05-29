// ══════════════════════════════════════════════════════
//  pages/reg-meet.js — 지역 담당자 만남 캘린더
//  adm-meet.js의 캘린더 로직을 재사용, 해당 지역만 필터링
// ══════════════════════════════════════════════════════

let regCalYear  = new Date().getFullYear();
let regCalMonth = new Date().getMonth();
let regMeetRegionFilter = '';

function renderRegMeet() {
  // 지역 필터 드롭다운 채우기 (USER_AUTH 허용 지역만)
  _fillRegMeetRegionSel();
  renderRegMeetSummary();
  renderRegCalendar();
}

// ─── 지역 필터 드롭다운 ───
function _fillRegMeetRegionSel() {
  const sel = document.getElementById('reg-meet-region-sel');
  if (!sel) return;

  const allowed = getAllowedRegions(); // null = 전체
  const allRegions = [...new Set((STATE.meets || []).map(m => m['실적지역']).filter(Boolean))].sort();
  const regions = allowed ? allRegions.filter(r => allowed.includes(r)) : allRegions;

  const cur = regMeetRegionFilter;
  sel.innerHTML = '<option value="">전체</option>' +
    regions.map(r => `<option${r === cur ? ' selected' : ''}>${r}</option>`).join('');
}

function setRegMeetRegion(val) {
  regMeetRegionFilter = val;
  renderRegMeetSummary();
  renderRegCalendar();
}

// ─── 허용 지역 필터 적용 ───
function _regMeetData() {
  const allowed = getAllowedRegions(); // null = 전체, 배열 = 허용 지역
  return (STATE.meets || []).filter(r => {
    if (regMeetRegionFilter && r['실적지역'] !== regMeetRegionFilter) return false;
    if (allowed && !allowed.includes(r['실적지역'])) return false;
    return true;
  });
}

// ─── 상단 요약 ───
function renderRegMeetSummary() {
  const meets = _regMeetData();
  const summaryEl = document.getElementById('reg-meet-summary');
  if (!summaryEl) return;

  const todayMeets    = meets.filter(r => dateDiff(r._date) === 0);
  const tomorrowMeets = meets.filter(r => dateDiff(r._date) === 1);
  const yesterdayMeets= meets.filter(r => dateDiff(r._date) === -1);
  const upcomingMeets = meets.filter(r => { const d = dateDiff(r._date); return d !== null && d > 1 && d <= 7; });

  const makeMiniChips = (list) => list.slice(0,6).map(r => {
    const result = r['만남결과'] || '';
    const emoji  = result || '•';
    const sc     = STAGE_COLORS[r['단계']] || {bg:'#f0f0f0',c:'#555'};
    return `<span style="display:inline-flex;align-items:center;gap:3px;font-size:11px;padding:2px 7px;border-radius:20px;background:${sc.bg};color:${sc.c};margin:2px;">
      ${emoji} ${r['섭외자']||'—'}
    </span>`;
  }).join('') + (list.length > 6 ? `<span style="font-size:11px;color:var(--text3);"> +${list.length-6}명</span>` : '');

  summaryEl.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px;">
      <div class="stat-card" style="background:var(--reg-light);border-color:var(--reg-mid);">
        <div class="stat-label">오늘 만남</div>
        <div class="stat-val reg" style="font-size:20px;">${todayMeets.length}건</div>
        <div style="margin-top:6px;">${makeMiniChips(todayMeets)}</div>
      </div>
      <div class="stat-card base">
        <div class="stat-label">내일 만남</div>
        <div class="stat-val" style="font-size:20px;color:var(--text2);">${tomorrowMeets.length}건</div>
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

// ─── 캘린더 ───
function renderRegCalendar() {
  const monthEl = document.getElementById('reg-cal-month-label');
  if (monthEl) monthEl.textContent = `${regCalYear}년 ${regCalMonth+1}월`;

  const meets   = _regMeetData();
  const firstDay = new Date(regCalYear, regCalMonth, 1);
  const lastDay  = new Date(regCalYear, regCalMonth+1, 0);
  const startDow = firstDay.getDay();

  const byDate = {};
  meets.forEach(r => {
    if (!r._date) return;
    if (r._date.getFullYear() !== regCalYear || r._date.getMonth() !== regCalMonth) return;
    const key = r._date.getDate();
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(r);
  });

  const today = new Date(); today.setHours(0,0,0,0);

  let html = `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:2px;">`;

  ['일','월','화','수','목','금','토'].forEach((d,i) => {
    const color = i===0?'var(--red)':i===6?'var(--reg2)':'var(--text2)';
    html += `<div style="text-align:center;font-size:11px;font-weight:700;color:${color};padding:6px 0;background:var(--surface2);border-radius:6px;">${d}</div>`;
  });

  for (let i = 0; i < startDow; i++) {
    html += `<div style="min-height:80px;background:var(--surface2);border-radius:6px;opacity:.3;"></div>`;
  }

  for (let d = 1; d <= lastDay.getDate(); d++) {
    const cellDate = new Date(regCalYear, regCalMonth, d);
    const isToday  = cellDate.getTime() === today.getTime();
    const isPast   = cellDate < today;
    const dow      = cellDate.getDay();
    const dayMeets = byDate[d] || [];

    const borderStyle = isToday ? '2px solid var(--reg2)' : '1px solid var(--border)';
    const bgStyle     = isToday ? 'var(--reg-light)' : isPast ? '#FAFAFA' : '#fff';
    const numColor    = dow===0 ? 'var(--red)' : dow===6 ? 'var(--reg2)' : isToday ? 'var(--reg2)' : 'var(--text1)';

    const chips = dayMeets.slice(0,4).map(r => {
      const result    = r['만남결과'] || '';
      const hasReport = _hasMeetingReport(r);
      const sc        = STAGE_COLORS[r['단계']] || {bg:'#f0f0f0',c:'#555'};
      const dot       = hasReport ? '✅' : '📝';
      const targetTab = hasReport ? 'meets' : 'basic';
      return `<div onclick="openPersonDetailFromCalendar('${encodeURIComponent(r['섭외자']||'')}','${encodeURIComponent(r['인도자']||'')}','reg-meet','${targetTab}')"
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
        ${dayMeets.length ? `<span style="font-size:10px;background:var(--reg2);color:#fff;border-radius:10px;padding:1px 5px;font-weight:600;">${dayMeets.length}</span>` : ''}
      </div>
      ${chips}${moreTxt}
    </div>`;
  }

  const remainder = (startDow + lastDay.getDate()) % 7;
  if (remainder > 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      html += `<div style="min-height:80px;background:var(--surface2);border-radius:6px;opacity:.3;"></div>`;
    }
  }

  html += `</div>`;
  const calEl = document.getElementById('reg-cal-grid');
  if (calEl) calEl.innerHTML = html;
}

// ─── 월 이동 ───
function regCalPrev() {
  regCalMonth--;
  if (regCalMonth < 0) { regCalMonth = 11; regCalYear--; }
  renderRegCalendar();
}
function regCalNext() {
  regCalMonth++;
  if (regCalMonth > 11) { regCalMonth = 0; regCalYear++; }
  renderRegCalendar();
}
function regCalToday() {
  regCalYear  = new Date().getFullYear();
  regCalMonth = new Date().getMonth();
  renderRegCalendar();
}
