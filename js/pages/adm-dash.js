// ══════════════════════════════════════════════════════
//  pages/adm-dash.js — 종합 대시보드 (청년회 + 지역 공통)
// ══════════════════════════════════════════════════════

// ─── 서브탭 상태 ───
let _admDashTab = 'all'; // 'all' | 'reg'
let _regDashTab = 'all';

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
  _admDashTab = tab;
  document.getElementById('adm-stab-all')?.classList.toggle('active', tab === 'all');
  document.getElementById('adm-stab-reg')?.classList.toggle('active', tab === 'reg');
  _renderDashContent('adm');
}

function switchRegDashTab(tab) {
  _regDashTab = tab;
  document.getElementById('reg-stab-all')?.classList.toggle('active', tab === 'all');
  document.getElementById('reg-stab-reg')?.classList.toggle('active', tab === 'reg');
  _renderDashContent('reg');
}

// ─── 진입점 ───
function renderAdmDash() {
  _admDashTab = 'all';
  document.getElementById('adm-stab-all')?.classList.add('active');
  document.getElementById('adm-stab-reg')?.classList.remove('active');
  _renderDashContent('adm');
}

function renderRegDash() {
  _regDashTab = 'all';
  document.getElementById('reg-stab-all')?.classList.add('active');
  document.getElementById('reg-stab-reg')?.classList.remove('active');
  _renderDashContent('reg');
}

// ─── 필터 지역 결정 ───
function _getDashFilterRegions(role) {
  const tab = role === 'adm' ? _admDashTab : _regDashTab;
  if (tab === 'all') return null;
  if (role === 'adm') {
    return ADM_VIEW_REGION ? [ADM_VIEW_REGION] : getAllowedRegions();
  }
  return getAllowedRegions(); // null이면 전체
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
  const tab           = isAdm ? _admDashTab : _regDashTab;
  const showFunnel    = isAdm || tab === 'reg';

  // ── 데이터 필터링 ──
  const nujeokAll = filterRegions
    ? STATE.nujeok.filter(r => filterRegions.includes(r['실적지역']))
    : STATE.nujeok;
  const active = nujeokAll.filter(r => !isTallag(r));
  const tallag = filterRegions
    ? (STATE.tallag || []).filter(r => filterRegions.includes(r['실적지역']))
    : (STATE.tallag || []);
  const checks = filterRegions
    ? STATE.checks.filter(r => filterRegions.includes(r['실적지역']))
    : STATE.checks;

  // ── 달성률 계산 (합자 목표 기준) ──
  const regions   = filterRegions || [...new Set(STATE.nujeok.map(r => r['실적지역']).filter(Boolean))];
  const goalTotal = regions.reduce((sum, r) => sum + _ldGetGoal(r, '합자'), 0);
  const achRate   = goalTotal ? Math.round(active.length / goalTotal * 100) + '%' : '—';

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

  el.innerHTML = `
    ${regionBadge}

    ${showFunnel ? `
    <div class="sl" style="margin:0 0 8px;">누적 달성 현황</div>
    <div id="${pfx}-funnel-wrap" style="margin-bottom:18px;"><div class="loading-box">로딩 중...</div></div>
    ` : ''}

    <div class="sl" style="margin:0 0 8px;">보유현황</div>
    <div class="stat-row c4" style="margin-bottom:18px;">
      <div class="stat-card ${accent}-c" style="text-align:center;">
        <div class="stat-label">전체 누적</div>
        <div class="stat-val ${accent}" style="font-size:22px;">${nujeokAll.length}</div>
        <div class="stat-sub">청년누적 인원</div>
      </div>
      <div class="stat-card base" style="text-align:center;">
        <div class="stat-label">탈락 인원</div>
        <div class="stat-val" style="font-size:22px;color:var(--red);">${tallag.length}</div>
        <div class="stat-sub">청년탈락</div>
      </div>
      <div class="stat-card ${accent}-c" style="text-align:center;">
        <div class="stat-label">보유 (생존)</div>
        <div class="stat-val ${accent}" style="font-size:22px;">${active.length}</div>
        <div class="stat-sub">누적 − 탈락</div>
      </div>
      <div class="stat-card base" style="text-align:center;">
        <div class="stat-label">달성률</div>
        <div class="stat-val" style="font-size:22px;color:var(--amber);">${achRate}</div>
        <div class="stat-sub">보유 / 합자목표</div>
      </div>
    </div>

    <div style="display:flex;align-items:center;gap:10px;margin-top:4px;">
      <div class="sl" style="margin:0;flex:1;">단계별 보유현황 (만남캘린더)</div>
      <div id="${pfx}-filter-wrap" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
    </div>
    <div id="${pfx}-stage-wrap" style="margin-top:8px;"><div class="loading-box">로딩 중...</div></div>

    <div class="sl" style="margin-top:20px;">만남 현황 (단계별 · 오늘/내일/모레/이후)</div>
    <div id="${pfx}-meet-wrap"><div class="loading-box">로딩 중...</div></div>

    <div class="sl" style="margin-top:20px;">개강 준비 체크 현황</div>
    ${checkSummaryHtml}
  `;

  _asyncFillLd(
    pfx + '-stage-wrap',
    pfx + '-meet-wrap',
    pfx + '-filter-wrap',
    showFunnel ? pfx + '-funnel-wrap' : null,
    filterRegions,
    isAdm && isAdmin
  );
}

// ══════════════════════════════════════════════════════
//  누적현황 퍼널 (단계별 목표 대비)
// ══════════════════════════════════════════════════════

function _buildFunnelHtml(myRegions) {
  const allPeople = _ldAllPeople().filter(r => {
    if (myRegions && !myRegions.includes(r['실적지역'])) return false;
    if (_ldKaigang !== '전체' && r['목표개강(연도/월)'] !== _ldKaigang && r['이전개강'] !== _ldKaigang) return false;
    if (_ldCenter  !== '전체' && r['목표센터'] !== _ldCenter) return false;
    return true;
  });

  const regions = myRegions || [...new Set(allPeople.map(r => r['실적지역']).filter(Boolean))];

  const counts = {};
  STAGE_ORDER.forEach(s => counts[s] = 0);
  allPeople.forEach(r => { if (STAGE_ORDER.includes(r['단계'])) counts[r['단계']]++; });

  const cards = STAGE_ORDER.map(stage => {
    const cnt  = counts[stage] || 0;
    const goal = regions.reduce((sum, r) => sum + _ldGetGoal(r, stage), 0);
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
  const finds  = (STATE.dbFindings || [])
    .filter(r => r['구분'] === '찾기')
    .map(r => ({ ...r, '단계': '찾기' }));
  return [...active, ...finds];
}

function _ldFiltered() {
  return _ldAllPeople().filter(r => {
    if (_ldKaigang !== '전체' && r['목표개강(연도/월)'] !== _ldKaigang && r['이전개강'] !== _ldKaigang) return false;
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
      <tbody>${regionRows}${totRowHtml}</tbody>
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
      <th rowspan="2" style="background:#bde0f5;color:#0c2d42;border:1px solid var(--border);padding:6px 12px;text-align:center;">지역</th>
      ${row1}
      <th rowspan="2" style="background:var(--surface2);color:var(--text2);border:1px solid var(--border);padding:6px 8px;text-align:center;white-space:nowrap;">만남미정</th>
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
          return `<td style="border:1px solid var(--border);padding:5px;text-align:left;min-width:80px;">${chips || '<span style="color:var(--text3)">—</span>'}</td>`;
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
        <table style="width:100%;border-collapse:collapse;font-size:12px;">
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
function _buildLdFilterHtml(filterId, stageId, meetId, funnelId, myRegions, isAdmin) {
  const wrap = document.getElementById(filterId);
  if (!wrap) return;

  const kaigangs = ['전체', ...[...new Set(
    STATE.nujeok.map(r => r['목표개강(연도/월)']).filter(Boolean)
  )].sort()];

  const relevantNujeok = _ldKaigang === '전체'
    ? STATE.nujeok
    : STATE.nujeok.filter(r => r['목표개강(연도/월)'] === _ldKaigang);
  const centerSet = [...new Set(relevantNujeok.map(r => r['목표센터']).filter(Boolean))].sort();
  const centers = centerSet.length > 1 ? ['전체', ...centerSet] : [];

  const btn = (label, active, onclick) =>
    `<button onclick="${onclick}" style="padding:3px 10px;border-radius:12px;border:1px solid var(--border);font-size:11px;cursor:pointer;font-family:inherit;background:${active?'var(--adm2)':'var(--surface2)'};color:${active?'#fff':'var(--text2)'};">${label}</button>`;

  const mrJson = JSON.stringify(myRegions || null);
  const kaigangBtns = kaigangs.map(k =>
    btn(k, _ldKaigang === k, `_ldSetKaigang('${k}','${filterId}','${stageId}','${meetId}','${funnelId}',${mrJson},${!!isAdmin})`)
  ).join('');

  const centerRow = centers.length ? `
    <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;margin-top:4px;">
      <span style="font-size:10px;color:var(--text3);font-weight:700;">센터</span>
      ${centers.map(c => btn(c, _ldCenter === c, `_ldSetCenter('${c}','${filterId}','${stageId}','${meetId}','${funnelId}',${mrJson},${!!isAdmin})`)).join('')}
    </div>` : '';

  const tgBtns = isAdmin ? `
    <button onclick="sendDashTg(event)" style="padding:3px 12px;border-radius:12px;border:none;background:#229ED9;color:#fff;font-size:11px;cursor:pointer;font-weight:700;margin-left:4px;">📊 현황 전송</button>` : '';

  wrap.innerHTML = `
    <div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
      <span style="font-size:10px;color:var(--text3);font-weight:700;">개강</span>
      ${kaigangBtns}${tgBtns}
    </div>
    ${centerRow}
  `;
}

function _ldSetKaigang(val, filterId, stageId, meetId, funnelId, myRegions, isAdmin) {
  _ldKaigang = val;
  _ldCenter  = '전체';
  const sw = document.getElementById(stageId);
  const mw = document.getElementById(meetId);
  const fw = document.getElementById(funnelId);
  if (sw) sw.innerHTML = _buildLdStageHtml(myRegions);
  if (mw) mw.innerHTML = _buildLdMeetHtml(myRegions);
  if (fw) fw.innerHTML = _buildNujeokAchHtml(myRegions);
  _buildLdFilterHtml(filterId, stageId, meetId, funnelId, myRegions, isAdmin);
}

function _ldSetCenter(val, filterId, stageId, meetId, funnelId, myRegions, isAdmin) {
  _ldCenter = val;
  const sw = document.getElementById(stageId);
  const mw = document.getElementById(meetId);
  const fw = document.getElementById(funnelId);
  if (sw) sw.innerHTML = _buildLdStageHtml(myRegions);
  if (mw) mw.innerHTML = _buildLdMeetHtml(myRegions);
  if (fw) fw.innerHTML = _buildNujeokAchHtml(myRegions);
  _buildLdFilterHtml(filterId, stageId, meetId, funnelId, myRegions, isAdmin);
}

// ─── 렌더링 진입점 ───
function _asyncFillLd(stageId, meetId, filterId, funnelId, myRegions, isAdmin) {
  const sw = document.getElementById(stageId);
  const mw = document.getElementById(meetId);
  const fw = document.getElementById(funnelId);
  if (sw) sw.innerHTML = _buildLdStageHtml(myRegions);
  if (mw) mw.innerHTML = _buildLdMeetHtml(myRegions);
  if (fw) fw.innerHTML = _buildNujeokAchHtml(myRegions);
  _buildLdFilterHtml(filterId, stageId, meetId, funnelId, myRegions, isAdmin);
}

// ─── 텔레그램 전송용 표 텍스트 빌더 ───
function _buildDashSummaryText() {
  const people  = _ldFiltered();
  const regions = _ldRegions(people);
  const now     = new Date();
  const dateStr = `${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const kLabel  = _ldKaigang !== '전체' ? _ldKaigang : '전체';
  const cLabel  = _ldCenter  !== '전체' ? _ldCenter  : '청년';

  const countMap = {}, totRow = { total: 0 };
  STAGE_ORDER.forEach(s => totRow[s] = 0);
  regions.forEach(r => { countMap[r] = { total: 0 }; STAGE_ORDER.forEach(s => countMap[r][s] = 0); });
  people.forEach(p => {
    const reg = p['실적지역'], stg = p['단계'];
    if (!reg || !countMap[reg] || !STAGE_ORDER.includes(stg)) return;
    countMap[reg][stg]++; countMap[reg].total++;
    totRow[stg]++;        totRow.total++;
  });

  const RATE_STAGES = ['합자', '육따기', '영따기'];
  const cumul    = (region, stage) => { const fi = STAGE_ORDER.indexOf(stage); return STAGE_ORDER.slice(fi).reduce((s, st) => s + (countMap[region]?.[st]||0), 0); };
  const cumulTot = stage           => { const fi = STAGE_ORDER.indexOf(stage); return STAGE_ORDER.slice(fi).reduce((s, st) => s + (totRow[st]||0), 0); };
  const goalSum  = s => regions.reduce((sum, r) => sum + _ldGetGoal(r, s), 0);
  const pct      = (cnt, goal) => goal ? Math.round(cnt / goal * 100) + '%' : '—';
  const totGoals = RATE_STAGES.map(goalSum);

  const ABBR = ['찾', '합', '육', '영', '복', '센', '수'];
  const SEP  = '────────────────────────────────────';

  const hdr = `지역 | ${ABBR.join('│')} | 합 | 합%│육%│영%`;

  const mkRow = (label, c, cumulFn) => {
    const sv = STAGE_ORDER.map(s => c[s] || 0).join('│');
    const rs = RATE_STAGES.map(s => pct(cumulFn(s), goalSum(s))).join('│');
    return `${label} | ${sv} | ${c.total || 0} | ${rs}`;
  };

  const regionRows = regions.map(r => mkRow(r, countMap[r], s => cumul(r, s)));
  const totLine    = (() => {
    const sv = STAGE_ORDER.map(s => totRow[s] || 0).join('│');
    return `합계 | ${sv} | ${totRow.total} | ${RATE_STAGES.map(s => pct(cumulTot(s), goalSum(s))).join('│')}`;
  })();

  return [
    `📊 단계별 보유현황 (${kLabel} · ${cLabel})`,
    `📅 ${dateStr}`,
    `목표 합자:${totGoals[0]} | 육따기:${totGoals[1]} | 영따기:${totGoals[2]}`,
    '',
    hdr,
    SEP,
    ...regionRows,
    SEP,
    totLine,
  ].join('\n');
}

// ─── 보유현황 텍스트 직접 전송 ───
async function sendDashTg(e) {
  const btn = e.target;
  const origText = btn.textContent;
  btn.disabled = true;
  btn.textContent = '전송 중...';

  try {
    if (!TELEGRAM_BOT_TOKEN) throw new Error('텔레그램 토큰 미설정 (config.js)');
    const text = _buildDashSummaryText();
    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: LIVEDATA_TELEGRAM_CHAT, text }),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(data.description || '전송 실패');
    showToast('📊 현황 전송 완료!');
  } catch(err) {
    showToast('⚠️ 실패: ' + err.message, 'error');
  }
  btn.textContent = origText;
  btn.disabled = false;
}
