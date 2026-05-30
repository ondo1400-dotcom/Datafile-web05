// ══════════════════════════════════════════════════════
//  pages/adm-dash.js — 종합 대시보드 (청년회 + 지역 공통)
// ══════════════════════════════════════════════════════

// ─── 서브탭 상태 ───
let _admDashTab = 'all'; // 'all' | 'reg'
let _regDashTab = 'all';

// ─── 내부탭 상태 (누적 / 일일 / 보유) ───
let _admInnerTab = 'nujeok'; // 'nujeok' | 'daily' | 'boyoo'
let _regInnerTab = 'nujeok';

// ─── 일일·주간 날짜 상태 ───
let _dailyDate = new Date().toISOString().slice(0, 10);
let _weekStart = (() => {
  const d = new Date(); const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return d.toISOString().slice(0, 10);
})();

// ─── 공통 체크 현황 HTML ───
function _buildCheckSummaryHtml(checks, activeCount, accentClass) {
  if (!STATE.checkItems.length) {
    return '<div style="color:var(--text3);font-size:12px;padding:10px;">체크 항목을 설정탭에서 추가해주세요</div>';
  }
  const cols   = Math.min(STATE.checkItems.length, 4);
  const colCls = cols === 4 ? 'c4' : 'c3';
  return `<div class="stat-row ${colCls}" style="margin-bottom:0;">
    ${STATE.checkItems.map(item => {
      const doneCount = checks.filter(c => c['항목명'] === item && c['체크여부'] === 'Y').length;
      const pct       = activeCount ? Math.round(doneCount / activeCount * 100) : 0;
      const cardCls   = pct >= 100 ? accentClass : pct >= 50 ? 'base' : '';
      const color     = pct >= 100
        ? (accentClass === 'reg-c' ? 'var(--reg2)' : 'var(--adm2)')
        : pct >= 50 ? 'var(--amber)' : 'var(--red)';
      return `<div class="stat-card ${cardCls}">
        <div class="stat-label" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${item}">${item}</div>
        <div class="stat-val" style="font-size:18px;color:${color};">${doneCount}명</div>
        <div class="stat-sub">${pct}% 완료</div>
      </div>`;
    }).join('')}
  </div>`;
}

// ─── 서브탭 전환 ───
function switchAdmDashTab(tab) {
  _admDashTab   = tab;
  _admInnerTab  = 'nujeok';
  document.getElementById('adm-stab-all')?.classList.toggle('active', tab === 'all');
  document.getElementById('adm-stab-reg')?.classList.toggle('active', tab === 'reg');
  _renderDashContent('adm');
}

function switchRegDashTab(tab) {
  _regDashTab   = tab;
  _regInnerTab  = 'nujeok';
  document.getElementById('reg-stab-all')?.classList.toggle('active', tab === 'all');
  document.getElementById('reg-stab-reg')?.classList.toggle('active', tab === 'reg');
  _renderDashContent('reg');
}

// ─── 내부탭 전환 (누적 / 보유) ───
function switchDashInnerTab(role, tab) {
  if (role === 'adm') _admInnerTab = tab;
  else                _regInnerTab = tab;
  _renderDashContent(role);
}

// ─── 진입점 ───
function renderAdmDash() {
  _admDashTab  = 'all';
  _admInnerTab = 'nujeok';
  document.getElementById('adm-stab-all')?.classList.add('active');
  document.getElementById('adm-stab-reg')?.classList.remove('active');
  _renderDashContent('adm');
}

function renderRegDash() {
  _regDashTab  = 'all';
  _regInnerTab = 'nujeok';
  document.getElementById('reg-stab-all')?.classList.add('active');
  document.getElementById('reg-stab-reg')?.classList.remove('active');
  _renderDashContent('reg');
}

// ─── 필터 지역 결정 ───
function _getDashFilterRegions(role) {
  if (role === 'reg') {
    return _regDashTab === 'all' ? null : getAllowedRegions();
  }
  const tab = _admDashTab;
  if (tab === 'all') return ADM_VIEW_REGION ? [ADM_VIEW_REGION] : null;
  return ADM_VIEW_REGION ? [ADM_VIEW_REGION] : getAllowedRegions();
}

// ─── 공통 대시보드 렌더 ───
function _renderDashContent(role) {
  const isAdm = role === 'adm';
  const el    = document.getElementById(role + '-dash-content');
  if (!el) return;

  const isAdmin       = !!(USER_AUTH && USER_AUTH.role === 'admin');
  const filterRegions = _getDashFilterRegions(role);
  const accent        = isAdm ? 'adm' : 'reg';
  const pfx           = role + 'd'; // admd | regd  (고유 ID 접두사)
  const showFunnel    = isAdm || (!isAdm && _regDashTab === 'all');
  const innerTab      = isAdm ? _admInnerTab : _regInnerTab;

  // ── 데이터 필터링 ──
  const nujeokAll = filterRegions
    ? STATE.nujeok.filter(r => filterRegions.includes(r['실적지역']))
    : STATE.nujeok;
  const active = nujeokAll.filter(r => !isTallag(r));
  const checks = filterRegions
    ? STATE.checks.filter(r => filterRegions.includes(r['실적지역']))
    : STATE.checks;

  const activePeopleN    = [...new Set(active.map(r => makeKey(r)))].length;
  const checkSummaryHtml = _buildCheckSummaryHtml(checks, activePeopleN, accent + '-c');

  // ── 지역 배지 ──
  const regionBadge = filterRegions && filterRegions.length
    ? `<div style="font-size:12px;color:var(--${accent}2);margin-bottom:12px;font-weight:700;">
        내 지역:&nbsp;${filterRegions.map(r =>
          `<span style="background:var(--${accent}-light);padding:2px 8px;border-radius:10px;margin-right:4px;">★ ${r}</span>`
        ).join('')}
      </div>`
    : '';

  // ── 섹션 전송 버튼 헬퍼 ──
  const _tgBtn = (ids, type, label) => isAdmin
    ? `<button onclick="sendSectionTg(event,'${ids}','${type}')" style="padding:2px 10px;border-radius:10px;border:none;background:#229ED9;color:#fff;font-size:11px;cursor:pointer;font-weight:700;flex-shrink:0;">📤 ${label}</button>`
    : '';
  const _slRow = (title, btn, mt = '0 0 8px') =>
    `<div class="sl" style="margin:${mt};display:flex;align-items:center;justify-content:space-between;">${title}${btn}</div>`;

  // ── 내부탭별 컨텐츠 ──
  const nujeokContent = `
    ${(isAdm || _regDashTab === 'all') ? `
    ${_slRow('청년회 전체 목표 대비 현황', _tgBtn(pfx+'-yw-cards-wrap', 'weekly', '주간달성'))}
    <div id="${pfx}-yw-cards-wrap" style="margin-bottom:18px;"><div class="loading-box">로딩 중...</div></div>
    ` : `
    ${_slRow('내 지역 단계별 목표 대비 현황', _tgBtn(pfx+'-cards-wrap', 'weekly', '주간달성'))}
    <div id="${pfx}-cards-wrap" style="margin-bottom:18px;"><div class="loading-box">로딩 중...</div></div>
    `}
    ${showFunnel ? `
    ${_slRow('지역별 누적 달성 현황', _tgBtn(pfx+'-funnel-wrap', 'nujeok', '누적달성'))}
    <div id="${pfx}-funnel-wrap"><div class="loading-box">로딩 중...</div></div>
    ` : ''}
  `;

  const boyooContent = `
    ${_slRow(`오늘 일일 결과 (${new Date().toISOString().slice(0,10)})`, _tgBtn(pfx+'-daily-wrap', 'daily', '일일달성'))}
    <div id="${pfx}-daily-wrap" style="margin-bottom:18px;"><div class="loading-box">로딩 중...</div></div>

    ${_slRow('단계별 보유현황 (만남캘린더)', _tgBtn(pfx+'-stage-wrap,'+pfx+'-meet-wrap', 'boyoo', '보유현황'))}
    <div id="${pfx}-stage-wrap"><div class="loading-box">로딩 중...</div></div>

    <div class="sl" style="margin-top:20px;">만남 현황 (단계별 · 오늘/내일/모레/이후)</div>
    <div id="${pfx}-meet-wrap"><div class="loading-box">로딩 중...</div></div>

    <div class="sl" style="margin-top:20px;">개강 준비 체크 현황</div>
    ${checkSummaryHtml}
  `;

  // 주간-일일 탭: 지역 담당자의 청년회 종합(all) 탭에서는 읽기전용
  const outerTab   = isAdm ? _admDashTab : _regDashTab;
  const isReadOnly = !isAdm && outerTab === 'all';

  el.innerHTML = `
    ${regionBadge}

    <div id="${pfx}-filter-wrap" style="margin-bottom:6px;"></div>

    <div class="dash-inner-tab-bar">
      <button class="dash-inner-tab ${accent} ${innerTab === 'nujeok' ? 'active' : ''}"
        onclick="switchDashInnerTab('${role}', 'nujeok')">누적 현황</button>
      <button class="dash-inner-tab ${accent} ${innerTab === 'daily' ? 'active' : ''}"
        onclick="switchDashInnerTab('${role}', 'daily')">주간-일일 현황</button>
      <button class="dash-inner-tab ${accent} ${innerTab === 'boyoo' ? 'active' : ''}"
        onclick="switchDashInnerTab('${role}', 'boyoo')">보유 현황</button>
    </div>

    ${innerTab === 'nujeok' ? nujeokContent
      : innerTab === 'daily' ? _buildDailyTabHtml(filterRegions, isReadOnly)
      : boyooContent}
  `;

  const _showYwCards = isAdm || _regDashTab === 'all';
  if (innerTab !== 'daily') {
    _asyncFillLd(
      pfx + '-stage-wrap',
      pfx + '-meet-wrap',
      pfx + '-filter-wrap',
      showFunnel ? pfx + '-funnel-wrap' : null,
      filterRegions,
      isAdm && isAdmin,
      _showYwCards ? null : pfx + '-cards-wrap',
      _showYwCards ? pfx + '-yw-cards-wrap' : null
    );
  }

  if (innerTab === 'boyoo') {
    const dw = document.getElementById(pfx + '-daily-wrap');
    if (dw) dw.innerHTML = _buildTodayHtml(filterRegions);
  }
}

// ══════════════════════════════════════════════════════
//  누적현황 퍼널 (단계별 목표 대비)
// ══════════════════════════════════════════════════════

function _buildFunnelHtml(myRegions, useYwGoal = false) {
  const effectiveRegions = useYwGoal ? null : myRegions;
  const allPeople = _ldAllPeople().filter(r => {
    if (effectiveRegions && !effectiveRegions.includes(r['실적지역'])) return false;
    if (_ldKaigang !== '전체' && normalizeKaigang(r['목표개강(연도/월)']) !== _ldKaigang && normalizeKaigang(r['이전개강']) !== _ldKaigang) return false;
    if (_ldCenter  !== '전체' && r['목표센터'] !== _ldCenter) return false;
    return true;
  });

  const regions = effectiveRegions || [...new Set(allPeople.map(r => r['실적지역']).filter(Boolean))];

  const counts = {};
  STAGE_ORDER.forEach(s => counts[s] = 0);
  allPeople.forEach(r => { if (STAGE_ORDER.includes(r['단계'])) counts[r['단계']]++; });

  const cards = STAGE_ORDER.map(stage => {
    const cnt  = counts[stage] || 0;
    const goal = useYwGoal
      ? _ldGetGoal('청년회', stage)
      : regions.reduce((sum, r) => sum + _ldGetGoal(r, stage), 0);
    const pct  = goal ? Math.round(cnt / goal * 100) : null;
    const sc   = STAGE_COLORS[stage] || { bg: '#f0f0f0', c: '#555' };
    const barW = pct !== null ? Math.min(pct, 100) : 0;
    const barColor = pct === null ? '#ccc' : pct >= 100 ? '#16a34a' : pct >= 70 ? '#d97706' : pct >= 40 ? '#ea580c' : '#dc2626';

    return `<div style="flex:1;min-width:90px;background:var(--surface);border:2px solid ${sc.bg};border-radius:10px;padding:12px 8px;text-align:center;">
      <div style="font-size:11px;font-weight:800;color:${sc.c};background:${sc.bg};border-radius:6px;padding:3px 8px;display:inline-block;margin-bottom:8px;">${stage}</div>
      <div style="font-size:22px;font-weight:800;color:var(--text1);line-height:1.1;">${cnt}</div>
      <div style="font-size:11px;color:var(--text3);margin-bottom:6px;">/ ${goal || '—'}</div>
      ${goal ? `
        <div style="background:var(--border);border-radius:4px;height:5px;margin-bottom:4px;">
          <div style="width:${barW}%;height:5px;border-radius:4px;background:${barColor};"></div>
        </div>
        <div style="font-size:11px;font-weight:700;color:${barColor};">${pct}%</div>
      ` : '<div style="font-size:10px;color:var(--text3);">목표미설정</div>'}
    </div>`;
  }).join('');

  return `<div style="display:flex;gap:6px;flex-wrap:wrap;">${cards}</div>`;
}

// ══════════════════════════════════════════════════════
//  누적 달성 현황 테이블
// ══════════════════════════════════════════════════════

function _buildNujeokAchHtml(myRegions) {
  const SHOW_STAGES = ['찾기', '합자', '육따기', '영따기', '복음방', '센확'];
  const STAGE_ABBR  = { '찾기': '찾기', '합자': '합자', '육따기': '육따', '영따기': '영따', '복음방': '복음방', '센확': '센확' };

  const people  = _ldFiltered();
  const regions = myRegions
    ? sortRegions(myRegions.filter(r => people.some(p => p['실적지역'] === r)))
    : _ldRegions(people);

  if (!people.length) return '<div style="color:var(--text3);font-size:12px;padding:10px;">데이터가 없습니다</div>';

  const countMap = {}, totRow = {};
  STAGE_ORDER.forEach(s => { totRow[s] = 0; });
  regions.forEach(r => { countMap[r] = {}; STAGE_ORDER.forEach(s => { countMap[r][s] = 0; }); });
  people.forEach(p => {
    const reg = p['실적지역'], stg = p['단계'];
    if (!reg || !countMap[reg] || !STAGE_ORDER.includes(stg)) return;
    countMap[reg][stg]++;
    totRow[stg]++;
  });

  function cumul(map, fromStage) {
    const fi = STAGE_ORDER.indexOf(fromStage);
    return STAGE_ORDER.slice(fi).reduce((s, st) => s + (map[st] || 0), 0);
  }

  function rateStyle(rv) {
    if (rv === 0)  return 'background:#dc2626;color:#fff;';
    if (rv >= 100) return 'background:#dcfce7;color:#15803d;';
    if (rv >= 70)  return 'background:#bbf7d0;color:#166534;';
    if (rv >= 50)  return 'background:#ffedd5;color:#c2410c;';
    return 'background:#fee2e2;color:#dc2626;';
  }

  function rateCell(cnt, goal) {
    if (!goal) return `<td style="border:1px solid var(--border);text-align:center;">—</td>`;
    const rv = Math.round(cnt / goal * 100);
    return `<td style="border:1px solid var(--border);text-align:center;font-weight:700;${rateStyle(rv)}">${rv}%</td>`;
  }

  const COLS   = 2 + SHOW_STAGES.length * 3;
  const kLabel = _ldKaigang !== '전체' ? _ldKaigang : '전체';

  const hdr1 = SHOW_STAGES.map(s =>
    `<th colspan="3" style="padding:5px 8px;background:#dbeafe;color:#1e40af;border:1px solid var(--border);text-align:center;">${STAGE_ABBR[s]}</th>`
  ).join('');
  const hdr2 = SHOW_STAGES.flatMap(() => [
    `<th style="padding:3px;background:#f0f9ff;color:#0369a1;border:1px solid var(--border);text-align:center;font-size:10px;">목표</th>`,
    `<th style="padding:3px;background:#f0f9ff;color:#0369a1;border:1px solid var(--border);text-align:center;font-size:10px;">달성</th>`,
    `<th style="padding:3px;background:#fef9c3;color:#854d0e;border:1px solid var(--border);text-align:center;font-size:10px;">%</th>`,
  ]).join('');

  const regionRows = regions.map(region => {
    const c = countMap[region];
    if (!c) return '';
    const isMine  = myRegions && myRegions.includes(region);
    const rowBg   = isMine ? 'background:var(--reg-light,#f0fdf4);' : '';
    const label   = isMine ? `<span style="color:var(--reg2);font-weight:700;">★ ${region}</span>` : region;
    const senGoal = _ldGetGoal(region, '센등');

    const cells = SHOW_STAGES.flatMap(s => {
      const goal = _ldGetGoal(region, s);
      const ach  = cumul(c, s);
      return [
        `<td style="border:1px solid var(--border);text-align:center;background:#eef6ff;font-size:11px;">${goal || '—'}</td>`,
        `<td style="border:1px solid var(--border);text-align:center;font-weight:700;font-family:monospace;">${ach}</td>`,
        rateCell(ach, goal),
      ];
    }).join('');

    return `<tr style="${rowBg}">
      <td style="font-weight:700;padding:8px 12px;border:1px solid var(--border);text-align:center;${rowBg}">${label}</td>
      <td style="border:1px solid var(--border);text-align:center;font-weight:700;">${senGoal || '—'}</td>
      ${cells}
    </tr>`;
  }).join('');

  const totCells = SHOW_STAGES.flatMap(s => {
    const goal = regions.reduce((sum, r) => sum + _ldGetGoal(r, s), 0);
    const ach  = cumul(totRow, s);
    return [
      `<td style="border:1px solid var(--border);text-align:center;background:#fef9c3;font-size:11px;">${goal || '—'}</td>`,
      `<td style="border:1px solid var(--border);text-align:center;font-weight:700;font-family:monospace;background:#fef9c3;">${ach}</td>`,
      rateCell(ach, goal),
    ];
  }).join('');
  const totSenGoal = regions.reduce((sum, r) => sum + (_ldGetGoal(r, '센등') || 0), 0);

  const ywCells = SHOW_STAGES.flatMap(s => {
    const goal = _ldGetGoal('청년회', s);
    const ach  = cumul(totRow, s);
    return [
      `<td style="border:1px solid var(--border);text-align:center;background:#fef9c3;font-size:11px;">${goal || '—'}</td>`,
      `<td style="border:1px solid var(--border);text-align:center;font-weight:700;font-family:monospace;background:#fef9c3;">${ach}</td>`,
      rateCell(ach, goal),
    ];
  }).join('');
  const ywSenGoal = _ldGetGoal('청년회', '센등') || '—';

  return `<div class="dash-tbl-wrap">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr>
          <td colspan="${COLS}" style="text-align:center;padding:8px 12px;background:#FEF08A;color:#1a1400;font-weight:700;font-size:14px;border:1px solid var(--border);">${kLabel} 청년개강 누적 달성 현황</td>
        </tr>
        <tr>
          <th rowspan="2" style="padding:8px 12px;background:#bde0f5;color:#0c2d42;border:1px solid var(--border);text-align:center;">단계<br>지역</th>
          <th rowspan="2" style="padding:6px 4px;background:#bde0f5;color:#0c2d42;border:1px solid var(--border);text-align:center;font-size:11px;">센등<br>목표</th>
          ${hdr1}
        </tr>
        <tr>${hdr2}</tr>
      </thead>
      <tbody>
        ${regionRows}
        <tr>
          <td style="font-weight:700;background:#FAC608;color:#1a1400;padding:8px 12px;border:1px solid var(--border);text-align:center;">합계</td>
          <td style="border:1px solid var(--border);text-align:center;font-weight:700;background:#FAC608;color:#1a1400;">${totSenGoal || '—'}</td>
          ${totCells}
        </tr>
        <tr>
          <td style="font-weight:700;background:#FAC608;color:#1a1400;padding:8px 12px;border:1px solid var(--border);text-align:center;">청년회</td>
          <td style="border:1px solid var(--border);text-align:center;font-weight:700;background:#FAC608;color:#1a1400;">${ywSenGoal}</td>
          ${ywCells}
        </tr>
      </tbody>
    </table>
  </div>`;
}

// ══════════════════════════════════════════════════════
//  보유현황 + 만남현황 (STATE 기반)
// ══════════════════════════════════════════════════════

const _LD_PUR_ORDER = ['상담', '육따기', '육따기 굳히기', '영따기', '전도의장', '복음방', '기타'];
const _LD_DOW       = ['일', '월', '화', '수', '목', '금', '토'];

let _ldKaigang = '전체';
let _ldCenter  = '전체';

// 활성 인원 (청년누적 + 찾기) — 전지역
function _ldAllPeople() {
  const active = STATE.nujeok.filter(r => !isTallag(r));
  const mkKey = r => [normalizeKaigang(r['목표개강(연도/월)']), r['섭외자'] || '', r['인도자'] || ''].join('|');
  const activeKeys = new Set(active.map(mkKey));
  const finds  = (STATE.dbFindings || [])
    .filter(r => r['구분'] === '찾기' && !activeKeys.has(mkKey(r)))
    .map(r => ({ ...r, '단계': '찾기' }));
  return [...active, ...finds];
}

function _ldFiltered() {
  return _ldAllPeople().filter(r => {
    if (_ldKaigang !== '전체' && normalizeKaigang(r['목표개강(연도/월)']) !== _ldKaigang) return false;
    if (_ldCenter  !== '전체' && r['목표센터'] !== _ldCenter) return false;
    return true;
  });
}

function _ldGetGoal(region, stage) {
  return Object.entries(STATE.goals)
    .filter(([k]) => {
      if (!k.endsWith('|' + stage + '|' + region)) return false;
      if (_ldKaigang !== '전체' && !k.startsWith(_ldKaigang + '|')) return false;
      if (_ldCenter  !== '전체') {
        const parts = k.split('|');
        if (parts[1] !== _ldCenter) return false;
      }
      return true;
    })
    .reduce((acc, [, v]) => acc + v, 0);
}

function _ldRegions(people) {
  return sortRegions([...new Set(people.map(r => r['실적지역']).filter(Boolean))]);
}

function _ldMeetMap() {
  const map = {};
  (STATE.meets || []).forEach(m => {
    const key = (m['섭외자'] || '') + '|' + (m['인도자'] || '');
    if (!map[key] || (m._date && (!map[key]._date || m._date > map[key]._date))) {
      map[key] = m;
    }
  });
  return map;
}

function _ldNormPurpose(raw) {
  const p = (raw || '').trim();
  if (['상담', '상담 예정', '육상담'].includes(p))   return { label: '상담',         bg: '#ede9fe', color: '#6d28d9' };
  if (['육따기', '육따기 예정'].includes(p))         return { label: '육따기',        bg: '#fef9c3', color: '#854d0e' };
  if (p === '육따기 굳히기')                         return { label: '육따기 굳히기', bg: '#fef9c3', color: '#854d0e' };
  if (['영따기', '영따기 예정'].includes(p))         return { label: '영따기',        bg: '#fff7ed', color: '#c2410c' };
  if (p === '전도의장')                              return { label: '전도의장',      bg: '#f3f4f6', color: '#374151' };
  if (['복음', '복음방'].includes(p))                return { label: '복음방',        bg: '#dcfce7', color: '#166534' };
  return { label: p || '기타', bg: 'var(--surface2)', color: 'var(--text2)' };
}

// ─── 단계별 보유현황 (목표/달성%) ───
function _buildLdStageHtml(myRegions) {
  const people  = _ldFiltered();
  const regions = myRegions
    ? sortRegions(myRegions.filter(r => people.some(p => p['실적지역'] === r)))
    : _ldRegions(people);
  if (!people.length) return '<div style="color:var(--text3);font-size:12px;padding:10px;">데이터가 없습니다</div>';

  const countMap = {}, totRow = { total: 0 };
  STAGE_ORDER.forEach(s => totRow[s] = 0);
  regions.forEach(r => { countMap[r] = { total: 0 }; STAGE_ORDER.forEach(s => countMap[r][s] = 0); });
  people.forEach(r => {
    const reg = r['실적지역'], stg = r['단계'];
    if (!reg || !countMap[reg] || !STAGE_ORDER.includes(stg)) return;
    countMap[reg][stg]++;
    countMap[reg].total++;
    totRow[stg]++;
    totRow.total++;
  });

  function getGoal(region, stage) { return _ldGetGoal(region, stage); }

  function cumulCount(region, fromStage) {
    const fi = STAGE_ORDER.indexOf(fromStage);
    return STAGE_ORDER.slice(fi).reduce((s, st) => s + (countMap[region]?.[st] || 0), 0);
  }
  function cumulTotCount(fromStage) {
    const fi = STAGE_ORDER.indexOf(fromStage);
    return STAGE_ORDER.slice(fi).reduce((s, st) => s + (totRow[st] || 0), 0);
  }

  function rateStyle(rv) {
    if (rv >= 100) return 'background:#dcfce7;color:#15803d;';
    if (rv >= 70)  return 'background:#fef9c3;color:#854d0e;';
    if (rv >= 50)  return 'background:#ffedd5;color:#c2410c;';
    return 'background:#fee2e2;color:#dc2626;';
  }
  function rateCell(cnt, goal) {
    if (!goal) return `<td style="border:1px solid var(--border);text-align:center;color:var(--text3);">—</td>`;
    const rv = Math.round(cnt / goal * 100);
    return `<td style="border:1px solid var(--border);text-align:center;font-weight:700;font-size:12px;${rateStyle(rv)}">${rv}%</td>`;
  }

  const RATE_STAGES = ['합자', '육따기', '영따기'];

  const regionRows = regions.map(region => {
    const c = countMap[region];
    if (!c) return '';
    const isMine = myRegions && myRegions.includes(region);
    const rowBg  = isMine ? 'background:var(--reg-light,#f0fdf4);' : '';
    const regionLabel = isMine
      ? `<span style="color:var(--reg2);font-weight:700;">★ ${region}</span>`
      : region;

    const goalCells = RATE_STAGES.map(s =>
      `<td style="border:1px solid var(--border);text-align:center;background:#eef6ff;font-size:11px;">${getGoal(region, s) || '—'}</td>`
    ).join('');
    const stageCells = STAGE_ORDER.map(s => {
      const sc = STAGE_COLORS[s] || { bg: '#f0f0f0', c: '#555' };
      return `<td style="border:1px solid var(--border);text-align:center;font-family:monospace;font-size:13px;background:${sc.bg};color:${sc.c};">${c[s] || 0}</td>`;
    }).join('');
    const rateCells = RATE_STAGES.map(s => rateCell(cumulCount(region, s), getGoal(region, s))).join('');

    return `<tr style="${rowBg}">
      <td style="font-weight:700;background:#f0f9ff;padding:8px 12px;border:1px solid var(--border);text-align:center;${isMine?'background:var(--reg-light,#f0fdf4);':''}">${regionLabel}</td>
      ${goalCells}${stageCells}
      <td style="border:1px solid var(--border);text-align:center;font-weight:700;font-family:monospace;background:var(--adm-light);color:var(--adm2);">${c.total}</td>
      ${rateCells}
    </tr>`;
  }).join('');

  const totGoalCells = RATE_STAGES.map(s => {
    const g = regions.reduce((sum, r) => sum + getGoal(r, s), 0);
    return `<td style="border:1px solid var(--border);text-align:center;background:#fef9c3;font-size:11px;">${g || '—'}</td>`;
  }).join('');
  const totStageCells = STAGE_ORDER.map(s =>
    `<td style="border:1px solid var(--border);text-align:center;font-weight:700;font-family:monospace;background:#fef9c3;">${totRow[s] || 0}</td>`
  ).join('');
  const totRateCells = RATE_STAGES.map(s => {
    const g = regions.reduce((sum, r) => sum + getGoal(r, s), 0);
    return rateCell(cumulTotCount(s), g);
  }).join('');

  const totRowHtml = `<tr>
    <td style="font-weight:700;background:#FAC608;color:#1a1400;padding:8px 12px;border:1px solid var(--border);text-align:center;">합계</td>
    ${totGoalCells}${totStageCells}
    <td style="border:1px solid var(--border);text-align:center;font-weight:700;background:#FAC608;color:#1a1400;font-family:monospace;">${totRow.total}</td>
    ${totRateCells}
  </tr>`;

  const goalHeaders = RATE_STAGES.map(s =>
    `<th style="padding:4px;background:#dbeafe;color:#1e40af;border:1px solid var(--border);text-align:center;font-size:10px;">${s}</th>`
  ).join('');
  const stageHeaders = STAGE_ORDER.map(s => {
    const sc = STAGE_COLORS[s] || { bg: '#e0f2fe', c: '#0369a1' };
    return `<th rowspan="2" style="padding:6px 8px;background:${sc.bg};color:${sc.c};border:1px solid var(--border);text-align:center;">${s}</th>`;
  }).join('');
  const rateHeaders = RATE_STAGES.map(s =>
    `<th style="padding:4px;background:#fef9c3;color:#854d0e;border:1px solid var(--border);text-align:center;font-size:10px;">${s}%</th>`
  ).join('');

  return `<div class="dash-tbl-wrap">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr>
          <th rowspan="2" style="padding:8px 12px;background:#bde0f5;color:#0c2d42;border:1px solid var(--border);text-align:center;">지역</th>
          <th colspan="${RATE_STAGES.length}" style="padding:5px 8px;background:#dbeafe;color:#1e40af;border:1px solid var(--border);text-align:center;font-size:11px;">목표</th>
          ${stageHeaders}
          <th rowspan="2" style="padding:6px;background:var(--adm-light);color:var(--adm2);border:1px solid var(--border);text-align:center;font-weight:700;">합계</th>
          <th colspan="${RATE_STAGES.length}" style="padding:5px 8px;background:#fef9c3;color:#854d0e;border:1px solid var(--border);text-align:center;font-size:11px;">달성%</th>
        </tr>
        <tr>${goalHeaders}${rateHeaders}</tr>
      </thead>
      <tbody>${regionRows}${myRegions ? '' : totRowHtml}</tbody>
    </table>
  </div>`;
}

// ─── 만남 현황 (단계별 × 날짜 × 목적) ───
function _buildLdMeetHtml(myRegions) {
  const tod    = new Date(); tod.setHours(0, 0, 0, 0);
  const todStr = tod.toISOString().slice(0, 10);
  function addDays(n) { const d = new Date(tod); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  function fmtMD2(s) { const d = new Date(s + 'T00:00:00'); return `${d.getMonth()+1}/${d.getDate()}`; }
  function getDow2(s) { return _LD_DOW[new Date(s + 'T00:00:00').getDay()]; }

  const d1 = addDays(1), d2 = addDays(2);
  const people  = _ldFiltered();
  const regions = myRegions
    ? sortRegions(myRegions.filter(r => people.some(p => p['실적지역'] === r)))
    : _ldRegions(people);
  const meetMap = _ldMeetMap();
  if (!people.length) return '<div style="color:var(--text3);font-size:12px;padding:10px;">만남 데이터가 없습니다</div>';

  function grpKey(date) {
    if (!date) return 'none';
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - tod) / 86400000);
    if (diff < 0)   return 'none';
    if (diff === 0) return 'today';
    if (diff === 1) return 'd1';
    if (diff === 2) return 'd2';
    return 'after';
  }

  const GRP_DEFS = [
    { key: 'today', label: '오늘',   date: todStr, hdrBg: '#fef9c3',         hdrColor: '#92400e', cellBg: '#fffde7' },
    { key: 'd1',    label: '내일',   date: d1,     hdrBg: 'var(--surface2)', hdrColor: 'var(--text2)', cellBg: '' },
    { key: 'd2',    label: '모레',   date: d2,     hdrBg: 'var(--surface2)', hdrColor: 'var(--text2)', cellBg: '' },
    { key: 'after', label: '그이후', date: null,   hdrBg: 'var(--surface2)', hdrColor: 'var(--text2)', cellBg: '' },
  ];

  const sections = STAGE_ORDER.map(stage => {
    const sp = people.filter(r => r['단계'] === stage && (!myRegions || myRegions.includes(r['실적지역'])));
    if (!sp.length) return '';
    const sc = STAGE_COLORS[stage] || { bg: '#e0f2fe', c: '#0369a1' };

    function getMeet(r) {
      return meetMap[(r['섭외자'] || '') + '|' + (r['인도자'] || '')] || null;
    }

    const grps = GRP_DEFS.map(g => {
      const inGrp = sp.filter(r => grpKey(getMeet(r)?._date) === g.key);
      const purSet = new Set(inGrp.map(r => _ldNormPurpose(getMeet(r)?.['다음만남목적']).label));
      const purs   = _LD_PUR_ORDER.filter(k => purSet.has(k));
      const cols   = purs.length
        ? purs.map(pur => ({ key: `${g.key}-${pur}`, gKey: g.key, label: pur, purpose: pur, cellBg: g.cellBg }))
        : [{ key: g.key, gKey: g.key, label: g.label, singleCol: true, cellBg: g.cellBg }];
      return { ...g, purs, cols };
    });
    const ALL_COLS = [...grps.flatMap(g => g.cols), { key: 'none', gKey: 'none', label: '만남미정' }];

    const colTots = { none: 0 };
    ALL_COLS.forEach(c => { if (c.key !== 'none') colTots[c.key] = 0; });
    sp.forEach(r => {
      const meet = getMeet(r);
      const gk   = grpKey(meet?._date);
      if (gk === 'none') { colTots.none++; return; }
      const nm = _ldNormPurpose(meet?.['다음만남목적']);
      const k  = `${gk}-${nm.label}`;
      if (colTots[k] !== undefined) colTots[k]++;
      else if (colTots[gk] !== undefined) colTots[gk]++;
    });

    const row1 = grps.map(g => {
      const ds = g.date ? `<span style="font-size:10px;margin-left:3px;opacity:.8">${fmtMD2(g.date)}(${getDow2(g.date)})</span>` : '';
      if (!g.purs.length) {
        return `<th rowspan="2" style="background:${g.hdrBg};color:${g.hdrColor};border:1px solid var(--border);padding:6px 8px;white-space:nowrap;">${g.label}${ds}</th>`;
      }
      return `<th colspan="${g.cols.length}" style="background:${g.hdrBg};color:${g.hdrColor};border:1px solid var(--border);padding:6px 8px;">${g.label}${ds}</th>`;
    }).join('');
    const row2 = grps.flatMap(g => {
      if (!g.purs.length) return [];
      return g.cols.map(c => {
        const nm = _ldNormPurpose(c.purpose || c.label);
        return `<th style="background:${g.key==='today'?'#fffde7':'var(--surface2)'};color:${nm.color};border:1px solid var(--border);padding:4px 6px;font-size:10px;white-space:nowrap;">${c.label}</th>`;
      });
    }).join('');
    const thead = `<tr>
      <th rowspan="2" style="background:#bde0f5;color:#0c2d42;border:1px solid var(--border);padding:6px 12px;text-align:center;width:88px;">지역</th>
      ${row1}
      <th rowspan="2" style="background:var(--surface2);color:var(--text2);border:1px solid var(--border);padding:6px 8px;text-align:center;width:40%;">만남미정</th>
    </tr><tr>${row2}</tr>`;

    const regionRows = regions.map(region => {
      const rp = sp.filter(r => r['실적지역'] === region);
      if (!rp.length) return '';
      const isMine = myRegions && myRegions.includes(region);

      const buckets = { none: [] };
      ALL_COLS.forEach(c => { if (c.key !== 'none') buckets[c.key] = []; });
      rp.forEach(r => {
        const meet = getMeet(r);
        const gk   = grpKey(meet?._date);
        if (gk === 'none') { buckets.none.push(r); return; }
        const nm = _ldNormPurpose(meet?.['다음만남목적']);
        const k  = `${gk}-${nm.label}`;
        if (buckets[k]) buckets[k].push(r);
        else if (buckets[gk]) buckets[gk].push(r);
      });

      const cells = ALL_COLS.map(c => {
        const list  = buckets[c.key] || [];
        const bgSt  = c.cellBg ? `background:${c.cellBg};` : '';
        if (!list.length) return `<td style="${bgSt}border:1px solid var(--border);padding:5px;text-align:center;"><span style="color:var(--text3)">—</span></td>`;

        if (c.key === 'none') {
          const groups = {};
          list.forEach(r => {
            const nm = _ldNormPurpose(getMeet(r)?.['다음만남목적']);
            if (!groups[nm.label]) groups[nm.label] = { bg: nm.bg, color: nm.color, names: [] };
            groups[nm.label].names.push(r['섭외자'] || '?');
          });
          const chips = _LD_PUR_ORDER.filter(k => groups[k]).map(k => {
            const g = groups[k];
            return `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:2px;margin-bottom:2px;">
              <span style="font-size:9px;font-weight:700;color:${g.color};">${k}</span>
              ${g.names.map(n => `<span style="font-size:10px;padding:1px 5px;border-radius:8px;border:1px solid ${g.color}20;background:${g.bg};color:${g.color};">${n}</span>`).join('')}
            </div>`;
          }).join('');
          return `<td style="border:1px solid var(--border);padding:5px;overflow:hidden;"><div style="overflow-wrap:break-word;word-break:break-word;">${chips || '<span style="color:var(--text3)">—</span>'}</div></td>`;
        }

        const nm    = _ldNormPurpose(c.purpose || c.label);
        const chips = list.map(r => {
          let name = r['섭외자'] || '?';
          if (c.gKey === 'after') {
            const meet = getMeet(r);
            if (meet?._date) name += `/${meet._date.getMonth()+1}.${meet._date.getDate()}(${_LD_DOW[meet._date.getDay()]})`;
          }
          return `<span style="font-size:10px;padding:1px 5px;border-radius:8px;border:1px solid ${nm.color}30;background:${nm.bg};color:${nm.color};">${name}</span>`;
        }).join(' ');
        return `<td style="${bgSt}border:1px solid var(--border);padding:5px;text-align:center;"><div style="display:flex;flex-wrap:wrap;gap:2px;justify-content:center;">${chips}</div></td>`;
      }).join('');

      const regionTdStyle = isMine
        ? 'font-weight:700;background:var(--reg-light,#f0fdf4);color:var(--reg2);padding:8px 12px;border:1px solid var(--border);text-align:center;'
        : 'font-weight:700;background:#f0f9ff;padding:8px 12px;border:1px solid var(--border);text-align:center;';
      const regionName = isMine ? `★ ${region}` : region;

      return `<tr>
        <td style="${regionTdStyle}">${regionName}<div style="font-size:10px;color:var(--text3);font-weight:400;">${rp.length}명</div></td>
        ${cells}
      </tr>`;
    }).filter(Boolean).join('');

    if (!regionRows) return '';
    const totCells = ALL_COLS.map(c =>
      `<td style="border:1px solid var(--border);text-align:center;font-weight:700;background:#fef9c3;font-family:monospace;">${colTots[c.key] || 0}</td>`
    ).join('');

    return `<div style="margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:8px;padding:10px 16px;border-radius:8px 8px 0 0;background:${sc.bg};cursor:pointer;user-select:none;"
           onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'':'none';this.querySelector('.ld-tog').textContent=this.nextElementSibling.style.display==='none'?'▼':'▲'">
        <span style="font-size:13px;font-weight:700;color:${sc.c};">${stage}</span>
        <span style="font-family:monospace;font-size:11px;padding:2px 8px;border-radius:10px;background:${sc.c}22;color:${sc.c};">${sp.length}명</span>
        <span class="ld-tog" style="margin-left:auto;font-size:11px;color:${sc.c};opacity:.7;">▲</span>
      </div>
      <div class="dash-tbl-wrap" style="border-radius:0 0 8px 8px;margin-bottom:0;border-top:none;">
        <table style="width:100%;border-collapse:collapse;font-size:12px;table-layout:fixed;">
          <thead>${thead}</thead>
          <tbody>
            ${regionRows}
            <tr>
              <td style="font-weight:700;background:#FAC608;color:#1a1400;padding:8px 12px;border:1px solid var(--border);text-align:center;">합계</td>
              ${totCells}
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
  }).filter(Boolean).join('');

  return sections || '<div style="color:var(--text3);font-size:12px;padding:10px;">만남 데이터가 없습니다</div>';
}

// ─── 개강 + 센터 필터 UI ───
function _buildLdFilterHtml(filterId, stageId, meetId, funnelId, myRegions, isAdmin, cardsId, ywCardsId) {
  const wrap = document.getElementById(filterId);
  if (!wrap) return;

  // 전체 버튼 제거 — 실제 개강 값만 표시, 선택된 버튼 재클릭 시 해제
  const kaigangs = [...new Set(
    STATE.nujeok.map(r => normalizeKaigang(r['목표개강(연도/월)'])).filter(Boolean)
  )].sort();

  const relevantNujeok = _ldKaigang === '전체'
    ? STATE.nujeok
    : STATE.nujeok.filter(r => normalizeKaigang(r['목표개강(연도/월)']) === _ldKaigang);
  const centerSet = [...new Set(relevantNujeok.map(r => r['목표센터']).filter(Boolean))].sort();
  const centers = centerSet;

  const mrJson    = JSON.stringify(myRegions  || null).replace(/"/g, '&quot;');
  const cidJson   = JSON.stringify(cardsId    || null).replace(/"/g, '&quot;');
  const ywCidJson = JSON.stringify(ywCardsId  || null).replace(/"/g, '&quot;');

  const kBtn = k => {
    const active  = _ldKaigang === k;
    const nextVal = active ? '전체' : k;
    return `<button onclick="_ldSetKaigang('${nextVal}','${filterId}','${stageId}','${meetId}','${funnelId}',${mrJson},${!!isAdmin},${cidJson},${ywCidJson})"
      style="padding:4px 14px;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:${active?700:500};
      border:1.5px solid ${active?'var(--adm2)':'var(--border2)'};
      background:${active?'var(--adm2)':'var(--surface)'};
      color:${active?'#fff':'var(--text2)'};white-space:nowrap;">${k}</button>`;
  };

  const cBtn = c => {
    const active  = _ldCenter === c;
    const nextVal = active ? '전체' : c;
    return `<button onclick="_ldSetCenter('${nextVal}','${filterId}','${stageId}','${meetId}','${funnelId}',${mrJson},${!!isAdmin},${cidJson},${ywCidJson})"
      style="padding:4px 14px;border-radius:20px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:${active?700:500};
      border:1.5px solid ${active?'var(--adm2)':'var(--border2)'};
      background:${active?'var(--adm2)':'var(--surface)'};
      color:${active?'#fff':'var(--text2)'};white-space:nowrap;">${c}</button>`;
  };

  const centerRow = centers.length > 1 ? `
    <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
      <span style="font-size:11px;font-weight:700;color:var(--text3);min-width:26px;">센터</span>
      ${centers.map(c => cBtn(c)).join('')}
    </div>` : '';

  wrap.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:8px;padding:10px 14px;background:var(--surface2);border-radius:12px;margin-bottom:2px;">
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:700;color:var(--text3);min-width:26px;">개강</span>
        ${kaigangs.map(k => kBtn(k)).join('')}
      </div>
      ${centerRow}
    </div>
  `;
}

function _ldSetKaigang(val, filterId, stageId, meetId, funnelId, myRegions, isAdmin, cardsId, ywCardsId) {
  _ldKaigang = val === '전체' ? '전체' : normalizeKaigang(val);
  _ldCenter  = '전체';
  const sw = document.getElementById(stageId);
  const mw = document.getElementById(meetId);
  const fw = document.getElementById(funnelId);
  const cw = cardsId   ? document.getElementById(cardsId)   : null;
  const yw = ywCardsId ? document.getElementById(ywCardsId) : null;
  if (sw) sw.innerHTML = _buildLdStageHtml(myRegions);
  if (mw) mw.innerHTML = _buildLdMeetHtml(myRegions);
  if (fw) fw.innerHTML = _buildNujeokAchHtml(myRegions);
  if (cw) cw.innerHTML = _buildFunnelHtml(myRegions);
  if (yw) yw.innerHTML = _buildFunnelHtml(null, true);
  _buildLdFilterHtml(filterId, stageId, meetId, funnelId, myRegions, isAdmin, cardsId, ywCardsId);
}

function _ldSetCenter(val, filterId, stageId, meetId, funnelId, myRegions, isAdmin, cardsId, ywCardsId) {
  _ldCenter = val;
  const sw = document.getElementById(stageId);
  const mw = document.getElementById(meetId);
  const fw = document.getElementById(funnelId);
  const cw = cardsId   ? document.getElementById(cardsId)   : null;
  const yw = ywCardsId ? document.getElementById(ywCardsId) : null;
  if (sw) sw.innerHTML = _buildLdStageHtml(myRegions);
  if (mw) mw.innerHTML = _buildLdMeetHtml(myRegions);
  if (fw) fw.innerHTML = _buildNujeokAchHtml(myRegions);
  if (cw) cw.innerHTML = _buildFunnelHtml(myRegions);
  if (yw) yw.innerHTML = _buildFunnelHtml(null, true);
  _buildLdFilterHtml(filterId, stageId, meetId, funnelId, myRegions, isAdmin, cardsId, ywCardsId);
}

// ══════════════════════════════════════════════════════
//  오늘의 현황 (찾기 완료 · 만남 예정 · 만남 완료)
// ══════════════════════════════════════════════════════

function _buildTodayHtml(myRegions) {
  const tod    = new Date(); tod.setHours(0, 0, 0, 0);
  const todStr = tod.toISOString().slice(0, 10);

  // ── 오늘 찾기 (등록일시 기준) ──
  const todayFinds = (STATE.dbFindings || []).filter(r => {
    if (r['구분'] !== '찾기') return false;
    if (myRegions && !myRegions.includes(r['실적지역'])) return false;
    return (r['등록일시'] || '').startsWith(todStr);
  });

  // ── 오늘 만남 ──
  const todayMeets = (STATE.meets || []).filter(r => {
    if (myRegions && !myRegions.includes(r['실적지역'])) return false;
    if (!r._date) return false;
    const d = new Date(r._date); d.setHours(0, 0, 0, 0);
    return d.getTime() === tod.getTime();
  });
  const todaySchd = todayMeets.filter(r => !r['만남결과']);
  const todayDone = todayMeets.filter(r =>  r['만남결과']);
  const cntGood   = todayDone.filter(r => r['만남결과'] === '🎉').length;
  const cntOk     = todayDone.filter(r => r['만남결과'] === '⭕️').length;
  const cntNo     = todayDone.filter(r => r['만남결과'] === '❌').length;

  // ── 요약 카드 3개 ──
  const summaryCards = `
    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <div style="flex:1;background:var(--adm-light);border-radius:var(--radius);padding:12px 14px;border:1px solid var(--adm-mid);">
        <div class="stat-label">오늘 찾기</div>
        <div style="font-size:22px;font-weight:700;color:var(--adm2);">${todayFinds.length}명</div>
        <div class="stat-sub">${todStr}</div>
      </div>
      <div style="flex:1;background:var(--reg-light);border-radius:var(--radius);padding:12px 14px;border:1px solid var(--reg-mid);">
        <div class="stat-label">오늘 만남 예정</div>
        <div style="font-size:22px;font-weight:700;color:var(--reg2);">${todaySchd.length}명</div>
        <div class="stat-sub">${todStr}</div>
      </div>
      <div style="flex:1;background:var(--amber-light);border-radius:var(--radius);padding:12px 14px;border:1px solid var(--border);">
        <div class="stat-label">오늘 만남 완료</div>
        <div style="font-size:22px;font-weight:700;color:var(--amber);">${todayDone.length}명</div>
        <div class="stat-sub">🎉 ${cntGood} &nbsp;⭕️ ${cntOk} &nbsp;❌ ${cntNo}</div>
      </div>
    </div>`;

  // ── 찾기 완료 목록 ──
  const findList = todayFinds.length
    ? todayFinds.map(r => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 10px;background:var(--adm-light);border-radius:8px;border:1px solid var(--adm-mid);">
        <span style="font-weight:700;color:var(--adm2);">${r['섭외자'] || '?'}</span>
        <span style="font-size:10px;color:var(--text3);">${r['인도자'] || ''}</span>
      </div>`).join('')
    : '<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px 0;">오늘 찾기 완료 없음</div>';

  // ── 만남 예정 목록 ──
  const schdList = todaySchd.length
    ? todaySchd.map(r => {
      const sc = STAGE_COLORS[r['단계']] || { bg: '#f0f0f0', c: '#555' };
      return `
        <div style="padding:7px 10px;background:var(--surface);border-radius:8px;border:1px solid var(--border);margin-bottom:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:700;">${r['섭외자'] || '?'}</span>
            <span style="font-size:11px;color:var(--text3);font-weight:600;">${r['다음만남시간'] || ''}</span>
          </div>
          <div style="display:flex;gap:4px;margin-top:3px;align-items:center;">
            <span style="font-size:9px;font-weight:800;background:${sc.bg};color:${sc.c};border-radius:4px;padding:1px 6px;">${r['단계'] || ''}</span>
            <span style="font-size:11px;color:var(--text2);">${r['다음만남목적'] || ''}</span>
          </div>
          <div style="font-size:10px;color:var(--text3);margin-top:2px;">인도자 ${r['인도자'] || ''}</div>
        </div>`;
    }).join('')
    : '<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px 0;">오늘 만남 예정 없음</div>';

  // ── 만남 완료 결과 목록 ──
  const doneList = todayDone.length
    ? todayDone.map(r => {
      const sc  = STAGE_COLORS[r['단계']] || { bg: '#f0f0f0', c: '#555' };
      const res = r['만남결과'] || '?';
      return `
        <div style="padding:7px 10px;background:var(--surface);border-radius:8px;border:1px solid var(--border);margin-bottom:4px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:700;">${r['섭외자'] || '?'}</span>
            <span style="font-size:20px;">${res}</span>
          </div>
          <div style="display:flex;gap:4px;margin-top:3px;align-items:center;">
            <span style="font-size:9px;font-weight:800;background:${sc.bg};color:${sc.c};border-radius:4px;padding:1px 6px;">${r['단계'] || ''}</span>
            <span style="font-size:10px;color:var(--text3);">인도자 ${r['인도자'] || ''}</span>
          </div>
        </div>`;
    }).join('')
    : '<div style="color:var(--text3);font-size:12px;text-align:center;padding:16px 0;">오늘 만남 완료 없음</div>';

  return `
    ${summaryCards}
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--adm2);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;">찾기 완료 ${todayFinds.length}명</div>
        <div style="display:flex;flex-direction:column;gap:4px;">${findList}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--reg2);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;">만남 예정 ${todaySchd.length}명</div>
        ${schdList}
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--amber);letter-spacing:.06em;text-transform:uppercase;margin-bottom:6px;">만남 완료 결과 ${todayDone.length}명</div>
        ${doneList}
      </div>
    </div>`;
}

// ─── 렌더링 진입점 ───
function _asyncFillLd(stageId, meetId, filterId, funnelId, myRegions, isAdmin, cardsId, ywCardsId) {
  const sw = document.getElementById(stageId);
  const mw = document.getElementById(meetId);
  const fw = document.getElementById(funnelId);
  const cw = cardsId   ? document.getElementById(cardsId)   : null;
  const yw = ywCardsId ? document.getElementById(ywCardsId) : null;
  if (sw) sw.innerHTML = _buildLdStageHtml(myRegions);
  if (mw) mw.innerHTML = _buildLdMeetHtml(myRegions);
  if (fw) fw.innerHTML = _buildNujeokAchHtml(myRegions);
  if (cw) cw.innerHTML = _buildFunnelHtml(myRegions);
  if (yw) yw.innerHTML = _buildFunnelHtml(null, true);
  _buildLdFilterHtml(filterId, stageId, meetId, funnelId, myRegions, isAdmin, cardsId, ywCardsId);
}

// ─── 텔레그램 전송용 표 텍스트 빌더 ───
function _buildDashSummaryText() {
  const people  = _ldFiltered();
  const meetMap = _ldMeetMap();
  const now     = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const kLabel  = _ldKaigang !== '전체' ? _ldKaigang : '전체';
  const cLabel  = _ldCenter  !== '전체' ? _ldCenter  : '청년';

  const tod = new Date(); tod.setHours(0, 0, 0, 0);
  function addDays(n) { const d = new Date(tod); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }
  const d1 = addDays(1), d2 = addDays(2);

  function grpKey(date) {
    if (!date) return 'none';
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - tod) / 86400000);
    if (diff < 0)   return 'none';
    if (diff === 0) return 'today';
    if (diff === 1) return 'd1';
    if (diff === 2) return 'd2';
    return 'after';
  }

  function getMeet(r) {
    return meetMap[(r['섭외자'] || '') + '|' + (r['인도자'] || '')] || null;
  }

  const SHOW = ['찾기', '합자', '육따기', '영따기', '복음방'];
  const ABBR = { '찾기': '찾기', '합자': '합자', '육따기': '육따', '영따기': '영따', '복음방': '복음방' };
  const total = people.filter(p => SHOW.includes(p['단계'])).length;

  const lines = [
    `📊 보유데이터 현황 ${dateStr}`,
    '',
    `📈 단계별 보유현황 (${kLabel}/${cLabel})`,
    `📌 총 인원: ${total}명`,
  ];

  SHOW.forEach(stage => {
    const sp = people.filter(p => p['단계'] === stage);
    const c  = { today: 0, d1: 0, d2: 0, after: 0, none: 0 };
    sp.forEach(r => { c[grpKey(getMeet(r)?._date)]++; });
    lines.push('');
    lines.push(`■${ABBR[stage]} : ${sp.length}명`);
    lines.push(`오늘 ${c.today} | 내일 ${c.d1} | 모레 ${c.d2}`);
    lines.push(`이후 ${c.after} | 미정 ${c.none}`);
  });

  return lines.join('\n');
}

// ─── 섹션별 이미지 + 텍스트 전송 ───
async function sendSectionTg(e, idsStr, type) {
  const btn = e.target;
  const origText = btn.textContent;
  btn.disabled = true;

  try {
    if (!TELEGRAM_BOT_TOKEN) throw new Error('텔레그램 토큰 미설정 (config.js)');
    if (typeof html2canvas === 'undefined') throw new Error('html2canvas 라이브러리 로드 실패');

    btn.textContent = '캡처 중...';
    const ids = idsStr.split(',').map(s => s.trim());
    const els = ids.map(id => document.getElementById(id));
    if (els.some(el => !el)) throw new Error('캡처 대상 요소 없음');

    const opts = { scale: 1.5, backgroundColor: '#ffffff', useCORS: true, logging: false };
    const canvases = await Promise.all(els.map(el => html2canvas(el, opts)));

    const pad = 16;
    const combined = document.createElement('canvas');
    combined.width  = Math.max(...canvases.map(c => c.width)) + pad * 2;
    combined.height = canvases.reduce((h, c) => h + c.height, 0) + pad * (canvases.length + 1);
    const ctx = combined.getContext('2d');
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, combined.width, combined.height);
    let y = pad;
    canvases.forEach(c => { ctx.drawImage(c, pad, y); y += c.height + pad; });

    btn.textContent = '전송 중...';
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
    const captions = {
      daily  : `📅 일일달성 ${dateStr}`,
      weekly : `📊 주간달성 ${dateStr}`,
      nujeok : `📈 누적달성 ${dateStr}`,
      boyoo  : _buildDashSummaryText(),
    };
    const caption = captions[type] || `📤 현황 ${dateStr}`;

    const blob = await new Promise(resolve => combined.toBlob(resolve, 'image/jpeg', 0.85));
    const form = new FormData();
    form.append('chat_id', REVIEW_TELEGRAM_CHAT);
    form.append('photo', blob, 'dashboard.jpg');
    form.append('caption', caption);

    const res  = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, { method: 'POST', body: form });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || '전송 실패');
    showToast('📤 전송 완료!');
  } catch(err) {
    showToast('⚠️ 실패: ' + err.message, 'error');
  }
  btn.textContent = origText;
  btn.disabled = false;
}

// ══════════════════════════════════════════════════════
//  주간-일일 현황 탭
// ══════════════════════════════════════════════════════

const _DAILY_STAGES = ['찾기', '합자', '육따기', '영따기'];
const _DAILY_ABBR   = { '찾기': '찾기', '합자': '합자', '육따기': '육따', '영따기': '영따' };

// ─── 일일 달성 자동 계산 ───
function _calcDailyAch(date, region, stage) {
  if (stage === '찾기') {
    return (STATE.dbFindings || []).filter(r =>
      r['구분'] === '찾기' &&
      (!region || r['실적지역'] === region) &&
      (r['등록일시'] || '').startsWith(date)
    ).length;
  }
  const fieldMap = { '합자': '합자-보고일', '육따기': '육따기-보고일', '영따기': '따기-보고일' };
  const field = fieldMap[stage];
  if (!field) return 0;
  return (STATE.nujeok || []).filter(r =>
    (!region || r['실적지역'] === region) &&
    (r[field] || '').startsWith(date)
  ).length;
}

// ─── 주간 달성 (주간 내 날짜별 합산) ───
function _calcWeeklyAch(weekStart, region, stage) {
  const mon = new Date(weekStart + 'T00:00:00');
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(mon); d.setDate(mon.getDate() + i);
    total += _calcDailyAch(d.toISOString().slice(0, 10), region, stage);
  }
  return total;
}

// ─── STATE 기반 getter / Supabase upsert ───
function _getDailyGoal(date, region, stage) {
  return STATE.dailyGoals[`${date}|${region}|${stage}`] || 0;
}
function _getDailyReport(date, region, stage) {
  return STATE.dailyReports[`${date}|${region}|${stage}`] || 0;
}
function _getWeeklyGoal(weekStart, region, stage) {
  return STATE.weeklyGoals[`${weekStart}|${region}|${stage}`] || 0;
}

async function _saveDailyGoal(date, region, stage, val) {
  const n = parseInt(val) || 0;
  STATE.dailyGoals[`${date}|${region}|${stage}`] = n;
  if (USE_SAMPLE) return;
  try {
    await SUPA.from('daily_goals').upsert({ date, region, stage, target: n }, { onConflict: 'date,region,stage' });
  } catch(e) { showToast('⚠️ 저장 실패: ' + e.message, 'error'); }
}
async function _saveDailyReport(date, region, stage, val) {
  const n = parseInt(val) || 0;
  STATE.dailyReports[`${date}|${region}|${stage}`] = n;
  if (USE_SAMPLE) return;
  try {
    await SUPA.from('daily_reports').upsert({ date, region, stage, count: n }, { onConflict: 'date,region,stage' });
  } catch(e) { showToast('⚠️ 저장 실패: ' + e.message, 'error'); }
}
async function _saveWeeklyGoal(weekStart, region, stage, val) {
  const n = parseInt(val) || 0;
  STATE.weeklyGoals[`${weekStart}|${region}|${stage}`] = n;
  if (USE_SAMPLE) return;
  try {
    await SUPA.from('weekly_goals').upsert({ week_start: weekStart, region, stage, target: n }, { onConflict: 'week_start,region,stage' });
  } catch(e) { showToast('⚠️ 저장 실패: ' + e.message, 'error'); }
}

// HTML에서 직접 호출하는 저장 핸들러
function onDailyGoalChange(date, region, stage, val, wrapId) {
  _saveDailyGoal(date, region, stage, val);
  _refreshDailySection(wrapId);
}
function onDailyReportChange(date, region, stage, val, wrapId) {
  _saveDailyReport(date, region, stage, val);
  _refreshDailySection(wrapId);
}
function onWeeklyGoalChange(weekStart, region, stage, val, wrapId) {
  _saveWeeklyGoal(weekStart, region, stage, val);
  _refreshWeeklySection(wrapId);
}

function _refreshDailySection(wrapId) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const fr = wrap.dataset.regions ? JSON.parse(wrap.dataset.regions) : null;
  const ro = wrap.dataset.readonly === 'true';
  wrap.innerHTML = _buildDailySectionInner(fr, ro);
}
function _refreshWeeklySection(wrapId) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const fr = wrap.dataset.regions ? JSON.parse(wrap.dataset.regions) : null;
  const ro = wrap.dataset.readonly === 'true';
  wrap.innerHTML = _buildWeeklySectionInner(fr, ro);
}

// ─── 날짜 변경 핸들러 ───
function onDailyDateChange(val, wrapId) {
  _dailyDate = val;
  _refreshDailySection(wrapId);
}
function onWeekStartChange(val, wrapId) {
  // val = 주 안의 임의 날짜 → 해당 주의 월요일로 변환
  const d = new Date(val + 'T00:00:00'); const dow = d.getDay();
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  _weekStart = d.toISOString().slice(0, 10);
  _refreshWeeklySection(wrapId);
}

// ─── 지역 목록 헬퍼 ───
function _getDailyRegions(filterRegions) {
  const all = _ldAllPeople().filter(r => !filterRegions || filterRegions.includes(r['실적지역']));
  const finds = (STATE.dbFindings || []).filter(r => r['구분'] === '찾기' && (!filterRegions || filterRegions.includes(r['실적지역'])));
  const set = new Set([
    ...all.map(r => r['실적지역']).filter(Boolean),
    ...finds.map(r => r['실적지역']).filter(Boolean),
  ]);
  return sortRegions(filterRegions ? filterRegions.filter(r => set.has(r)) : [...set]);
}

// ─── % 색상 스타일 ───
function _pctStyle(pct) {
  if (pct === null) return '';
  if (pct === 0)   return 'background:#fee2e2;color:#dc2626;';
  if (pct >= 100)  return 'background:#dcfce7;color:#15803d;';
  if (pct >= 70)   return 'background:#bbf7d0;color:#166534;';
  if (pct >= 50)   return 'background:#ffedd5;color:#c2410c;';
  return 'background:#fee2e2;color:#dc2626;';
}

// ─── 일일달성 섹션 내부 HTML (단계별 테이블) ───
function _buildDailySectionInner(filterRegions, readOnly) {
  const date    = _dailyDate;
  const regions = _getDailyRegions(filterRegions);
  if (!regions.length) return '<div style="color:var(--text3);font-size:12px;padding:10px;">데이터가 없습니다</div>';

  const inpSt = 'width:38px;text-align:center;border:1px solid var(--border2);border-radius:3px;padding:2px 1px;font-size:12px;font-weight:700;font-family:inherit;';
  const safe  = s => String(s || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'");

  const sections = _DAILY_STAGES.map(stage => {
    const sc = STAGE_COLORS[stage] || { bg: '#e0f2fe', c: '#0369a1' };
    const wid = `daily-stg-${stage}-wrap`;
    const regionRows = regions.map(region => {
      const goal = _getDailyGoal(date, region, stage);
      const ach  = _calcDailyAch(date, region, stage);
      const rep  = _getDailyReport(date, region, stage);
      const pct  = goal > 0 ? Math.round(ach / goal * 100) : (ach > 0 ? null : 0);
      const pctTxt = pct === null ? '—' : pct + '%';
      const goalCell = readOnly
        ? `<td style="border:1px solid var(--border);text-align:center;font-weight:700;">${goal}</td>`
        : `<td style="border:1px solid var(--border);text-align:center;padding:3px 2px;"><input type="number" min="0" value="${goal||''}" placeholder="0" style="${inpSt}" onchange="onDailyGoalChange('${safe(date)}','${safe(region)}','${stage}',this.value,'daily-section-wrap')" onfocus="this.select()"></td>`;
      const repCell = readOnly
        ? `<td style="border:1px solid var(--border);text-align:center;color:#0284c7;font-weight:600;">${rep}</td>`
        : `<td style="border:1px solid var(--border);text-align:center;padding:3px 2px;"><input type="number" min="0" value="${rep||''}" placeholder="0" style="${inpSt};color:#0284c7;" onchange="onDailyReportChange('${safe(date)}','${safe(region)}','${stage}',this.value,'daily-section-wrap')" onfocus="this.select()"></td>`;
      return `<tr>
        <td style="font-weight:700;padding:6px 10px;border:1px solid var(--border);background:#f0f9ff;white-space:nowrap;">${region}</td>
        ${goalCell}
        <td style="border:1px solid var(--border);text-align:center;font-weight:700;font-family:monospace;">${ach}</td>
        ${repCell}
        <td style="border:1px solid var(--border);text-align:center;font-weight:700;font-size:11px;${_pctStyle(pct)}">${pctTxt}</td>
      </tr>`;
    }).join('');

    const totGoal = regions.reduce((s, r) => s + _getDailyGoal(date, r, stage), 0);
    const totAch  = regions.reduce((s, r) => s + _calcDailyAch(date, r, stage), 0);
    const totRep  = regions.reduce((s, r) => s + _getDailyReport(date, r, stage), 0);
    const totPct  = totGoal > 0 ? Math.round(totAch / totGoal * 100) : (totAch > 0 ? null : 0);
    const totTxt  = totPct === null ? '—' : totPct + '%';

    return `<div style="margin-bottom:14px;">
      <div style="display:inline-block;background:${sc.bg};color:${sc.c};font-size:12px;font-weight:700;padding:4px 14px;border-radius:6px;margin-bottom:6px;">${_DAILY_ABBR[stage]}</div>
      <div class="dash-tbl-wrap" style="margin-bottom:0;">
        <table style="width:auto;border-collapse:collapse;font-size:12px;">
          <thead><tr>
            <th style="padding:6px 10px;background:#bde0f5;color:#0c2d42;border:1px solid var(--border);text-align:center;min-width:80px;">지역</th>
            <th style="padding:4px 6px;background:#eef6ff;color:#0369a1;border:1px solid var(--border);text-align:center;min-width:52px;">일일목표</th>
            <th style="padding:4px 6px;background:#eef6ff;color:#0369a1;border:1px solid var(--border);text-align:center;min-width:44px;">달성</th>
            <th style="padding:4px 6px;background:#e0f2fe;color:#0284c7;border:1px solid var(--border);text-align:center;min-width:44px;">보고</th>
            <th style="padding:4px 6px;background:#fef9c3;color:#854d0e;border:1px solid var(--border);text-align:center;min-width:44px;">달성률</th>
          </tr></thead>
          <tbody>
            ${regionRows}
            <tr>
              <td style="font-weight:700;background:#FAC608;color:#1a1400;padding:6px 10px;border:1px solid var(--border);">청년회</td>
              <td style="border:1px solid var(--border);text-align:center;font-weight:700;background:#FAC608;color:#1a1400;">${totGoal}</td>
              <td style="border:1px solid var(--border);text-align:center;font-weight:700;font-family:monospace;background:#FAC608;color:#1a1400;">${totAch}</td>
              <td style="border:1px solid var(--border);text-align:center;font-weight:600;color:#0284c7;background:#FAC608;">${totRep}</td>
              <td style="border:1px solid var(--border);text-align:center;font-weight:700;font-size:11px;${_pctStyle(totPct)}background:#FAC608;">${totTxt}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>`;
  }).join('');

  return `<div style="display:flex;flex-wrap:wrap;gap:16px;">${sections}</div>`;
}

// ─── 주간달성 섹션 내부 HTML ───
function _buildWeeklySectionInner(filterRegions, readOnly) {
  const ws      = _weekStart;
  const mon     = new Date(ws + 'T00:00:00');
  const sun     = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt     = d => `${d.getMonth()+1}/${d.getDate()}`;
  const regions = _getDailyRegions(filterRegions);
  if (!regions.length) return '<div style="color:var(--text3);font-size:12px;padding:10px;">데이터가 없습니다</div>';

  const inpSt = 'width:40px;text-align:center;border:1px solid var(--border2);border-radius:3px;padding:2px 1px;font-size:12px;font-weight:700;font-family:inherit;';
  const safe  = s => String(s || '').replace(/\\/g,'\\\\').replace(/'/g,"\\'");

  const stageHdrs = _DAILY_STAGES.map(s => {
    const sc = STAGE_COLORS[s] || { bg: '#e0f2fe', c: '#0369a1' };
    return `<th colspan="3" style="padding:5px 4px;background:${sc.bg};color:${sc.c};border:1px solid var(--border);text-align:center;">${_DAILY_ABBR[s]}</th>`;
  }).join('');
  const subHdrs = _DAILY_STAGES.flatMap(() => [
    `<th style="padding:2px 3px;background:#eef6ff;color:#0369a1;border:1px solid var(--border);font-size:10px;text-align:center;min-width:44px;">주간목표</th>`,
    `<th style="padding:2px 3px;background:#eef6ff;color:#0369a1;border:1px solid var(--border);font-size:10px;text-align:center;min-width:44px;">달성</th>`,
    `<th style="padding:2px 3px;background:#fef9c3;color:#854d0e;border:1px solid var(--border);font-size:10px;text-align:center;min-width:40px;">달성률</th>`,
  ]).join('');

  const regionRows = regions.map(region => {
    const cells = _DAILY_STAGES.map(stage => {
      const goal = _getWeeklyGoal(ws, region, stage);
      const ach  = _calcWeeklyAch(ws, region, stage);
      const pct  = goal > 0 ? Math.round(ach / goal * 100) : (ach > 0 ? null : 0);
      const pctTxt = pct === null ? '—' : pct + '%';
      const goalCell = readOnly
        ? `<td style="border:1px solid var(--border);text-align:center;font-weight:700;">${goal}</td>`
        : `<td style="border:1px solid var(--border);text-align:center;padding:3px 2px;"><input type="number" min="0" value="${goal||''}" placeholder="0" style="${inpSt}" onchange="onWeeklyGoalChange('${safe(ws)}','${safe(region)}','${stage}',this.value,'weekly-section-wrap')" onfocus="this.select()"></td>`;
      return `${goalCell}
        <td style="border:1px solid var(--border);text-align:center;font-weight:700;font-family:monospace;">${ach}</td>
        <td style="border:1px solid var(--border);text-align:center;font-weight:700;font-size:11px;${_pctStyle(pct)}">${pctTxt}</td>`;
    }).join('');
    return `<tr>
      <td style="font-weight:700;padding:6px 10px;border:1px solid var(--border);background:#f0f9ff;white-space:nowrap;">${region}</td>
      ${cells}
    </tr>`;
  }).join('');

  const totCells = _DAILY_STAGES.map(stage => {
    const totGoal = regions.reduce((s, r) => s + _getWeeklyGoal(ws, r, stage), 0);
    const totAch  = regions.reduce((s, r) => s + _calcWeeklyAch(ws, r, stage), 0);
    const pct     = totGoal > 0 ? Math.round(totAch / totGoal * 100) : (totAch > 0 ? null : 0);
    const pctTxt  = pct === null ? '—' : pct + '%';
    return `<td style="border:1px solid var(--border);text-align:center;font-weight:700;background:#FAC608;color:#1a1400;">${totGoal}</td>
      <td style="border:1px solid var(--border);text-align:center;font-weight:700;font-family:monospace;background:#FAC608;color:#1a1400;">${totAch}</td>
      <td style="border:1px solid var(--border);text-align:center;font-weight:700;font-size:11px;${_pctStyle(pct)}background:#FAC608;">${pctTxt}</td>`;
  }).join('');

  return `<div class="dash-tbl-wrap">
    <table style="width:100%;border-collapse:collapse;font-size:12px;">
      <thead>
        <tr>
          <th rowspan="2" style="padding:8px 12px;background:#bde0f5;color:#0c2d42;border:1px solid var(--border);text-align:center;">지역</th>
          ${stageHdrs}
        </tr>
        <tr>${subHdrs}</tr>
      </thead>
      <tbody>
        ${regionRows}
        <tr>
          <td style="font-weight:700;background:#FAC608;color:#1a1400;padding:8px 12px;border:1px solid var(--border);text-align:center;">청년회</td>
          ${totCells}
        </tr>
      </tbody>
    </table>
  </div>`;
}

// ─── 주간-일일 현황 탭 전체 HTML ───
function _buildDailyTabHtml(filterRegions, readOnly) {
  const now = new Date();
  const dow = ['일','월','화','수','목','금','토'][now.getDay()];
  const mon = new Date(_weekStart + 'T00:00:00');
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  const fmt = d => `${d.getMonth()+1}/${d.getDate()}`;

  const frAttr = JSON.stringify(filterRegions || null).replace(/"/g, '&quot;');
  const roAttr = readOnly ? 'true' : 'false';
  const editNote = readOnly ? '' : `<span style="font-size:11px;color:var(--text3);margin-left:8px;">숫자 입력 시 자동 저장</span>`;

  return `
    <!-- ── 일일달성 섹션 ── -->
    <div style="margin-bottom:20px;">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
        <span style="font-size:13px;font-weight:700;">📅 일일달성 현황</span>
        <input type="date" value="${_dailyDate}"
          onchange="onDailyDateChange(this.value,'daily-section-wrap')"
          style="padding:3px 8px;border:1px solid var(--border);border-radius:4px;font-size:12px;cursor:pointer;">
        ${editNote}
      </div>
      <div id="daily-section-wrap" data-regions="${frAttr}" data-readonly="${roAttr}">
        ${_buildDailySectionInner(filterRegions, readOnly)}
      </div>
    </div>

    <div style="border-top:2px solid var(--border);margin-bottom:20px;"></div>

    <!-- ── 주간달성 섹션 ── -->
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;">
        <span style="font-size:13px;font-weight:700;">📊 주간달성 현황</span>
        <span style="font-size:12px;color:var(--text2);background:var(--surface2);padding:3px 10px;border-radius:10px;">
          ${fmt(mon)}(월) ~ ${fmt(sun)}(일)
        </span>
        <input type="date" value="${_weekStart}"
          onchange="onWeekStartChange(this.value,'weekly-section-wrap')"
          style="padding:3px 8px;border:1px solid var(--border);border-radius:4px;font-size:12px;cursor:pointer;">
        ${editNote}
      </div>
      <div id="weekly-section-wrap" data-regions="${frAttr}" data-readonly="${roAttr}">
        ${_buildWeeklySectionInner(filterRegions, readOnly)}
      </div>
    </div>
  `;
}
