// ══════════════════════════════════════════════════════
//  pages/adm-dash.js — 종합 대시보드 (청년회 + 지역 공통)
// ══════════════════════════════════════════════════════

// 공통 체크 현황 HTML
function _buildCheckSummaryHtml(checks, activeCount, accentClass) {
  if (!STATE.checkItems.length) {
    return '<div style="color:var(--text3);font-size:12px;padding:10px;">체크 항목을 설정탭에서 추가해주세요</div>';
  }
  const cols = Math.min(STATE.checkItems.length, 4);
  return `<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;">
    ${STATE.checkItems.map(item => {
      const doneCount = checks.filter(c => c['항목명'] === item && c['체크여부'] === 'Y').length;
      const pct       = activeCount ? Math.round(doneCount / activeCount * 100) : 0;
      const cardCls   = pct >= 100 ? accentClass : pct >= 50 ? 'base' : '';
      const color     = pct >= 100
        ? (accentClass === 'reg-c' ? 'var(--reg2)' : 'var(--adm2)')
        : pct >= 50 ? 'var(--amber)' : 'var(--red)';
      return `<div class="stat-card ${cardCls}">
        <div class="stat-label">${item}</div>
        <div class="stat-val" style="font-size:18px;color:${color};">${doneCount}명</div>
        <div class="stat-sub">${pct}% 완료</div>
      </div>`;
    }).join('')}
  </div>`;
}

// ─── 청년회 종합 대시보드 ───
function renderAdmDash() {
  const active = STATE.nujeok.filter(r => !isTallag(r));

  document.getElementById('ds-total').textContent  = STATE.nujeok.length;
  document.getElementById('ds-tallag').textContent = STATE.tallag.length;
  document.getElementById('ds-active').textContent = active.length;

  const totalChecks = STATE.checks.length;
  const doneChecks  = STATE.checks.filter(c => c['체크여부'] === 'Y').length;
  document.getElementById('ds-check-rate').textContent = totalChecks
    ? Math.round(doneChecks / totalChecks * 100) + '%' : '—';

  const activePeopleN = [...new Set(active.map(r => makeKey(r)))].length;
  document.getElementById('dash-check-summary').innerHTML =
    _buildCheckSummaryHtml(STATE.checks, activePeopleN, 'adm-c');

  _asyncFillLd('ld-adm-stage-wrap', 'ld-adm-meet-wrap', 'ld-adm-filter-wrap', null, null);
}

// ─── 지역 종합 현황 ───
function renderRegDash() {
  const el = document.getElementById('reg-dash-content');
  if (!el) return;

  const allowed   = getAllowedRegions(); // null=전체관리자, 배열=지역담당자
  const myRegions = allowed || [];

  // 전지역 데이터 (필터 없음)
  const active      = STATE.nujeok.filter(r => !isTallag(r));
  const totalChecks = STATE.checks.length;
  const doneChecks  = STATE.checks.filter(c => c['체크여부'] === 'Y').length;
  const checkRate   = totalChecks ? Math.round(doneChecks / totalChecks * 100) + '%' : '—';
  const activePeopleN = [...new Set(active.map(r => makeKey(r)))].length;
  const checkSummaryHtml = _buildCheckSummaryHtml(STATE.checks, activePeopleN, 'reg-c');

  const myRegionBadge = myRegions.length
    ? `<div style="font-size:12px;color:var(--reg2);margin-bottom:12px;font-weight:700;">
        내 지역: ${myRegions.map(r => `<span style="background:var(--reg-light);padding:2px 8px;border-radius:10px;margin-right:4px;">★ ${r}</span>`).join('')}
      </div>`
    : '';

  el.innerHTML = `
    <div class="stat-row c4" style="margin-bottom:20px;">
      <div class="stat-card adm-c" style="text-align:center;">
        <div class="stat-label">전체 인원</div>
        <div class="stat-val adm" style="font-size:22px;">${STATE.nujeok.length}</div>
        <div class="stat-sub">청년누적 전체</div>
      </div>
      <div class="stat-card base" style="text-align:center;">
        <div class="stat-label">탈락 인원</div>
        <div class="stat-val" style="font-size:22px;color:var(--red);">${STATE.tallag.length}</div>
        <div class="stat-sub">청년탈락 시트</div>
      </div>
      <div class="stat-card reg-c" style="text-align:center;">
        <div class="stat-label">활성 인원</div>
        <div class="stat-val reg" style="font-size:22px;">${active.length}</div>
        <div class="stat-sub">누적 − 탈락</div>
      </div>
      <div class="stat-card base" style="text-align:center;">
        <div class="stat-label">체크 완료율</div>
        <div class="stat-val" style="font-size:22px;color:var(--amber);">${checkRate}</div>
        <div class="stat-sub">개강체크 기준</div>
      </div>
    </div>

    ${myRegionBadge}

    <div style="display:flex;align-items:center;gap:10px;">
      <div class="sl" style="margin:0;flex:1;">단계별 보유현황 (만남캘린더)</div>
      <div id="ld-reg-filter-wrap" style="display:flex;gap:4px;flex-wrap:wrap;"></div>
    </div>
    <div id="ld-reg-stage-wrap" style="margin-top:8px;"><div class="loading-box">로딩 중...</div></div>

    <div class="sl" style="margin-top:20px;">만남 현황 (단계별 · 오늘/내일/모레/이후)</div>
    <div id="ld-reg-meet-wrap"><div class="loading-box">로딩 중...</div></div>

    <div class="sl" style="margin-top:20px;">개강 준비 체크 현황</div>
    ${checkSummaryHtml}
  `;

  _asyncFillLd('ld-reg-stage-wrap', 'ld-reg-meet-wrap', 'ld-reg-filter-wrap', null, myRegions.length ? myRegions : null);
}

// ══════════════════════════════════════════════════════
//  보유현황 + 만남현황 (STATE 기반)
// ══════════════════════════════════════════════════════

const _LD_PUR_ORDER = ['상담', '육따기', '육따기 굳히기', '영따기', '전도의장', '복음방', '기타'];
const _LD_DOW       = ['일', '월', '화', '수', '목', '금', '토'];

let _ldKaigang = '전체';

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
    if (_ldKaigang === '전체') return true;
    return r['목표개강(연도/월)'] === _ldKaigang || r['이전개강'] === _ldKaigang;
  });
}

function _ldRegions(people) {
  return sortRegions([...new Set(people.map(r => r['실적지역']).filter(Boolean))]);
}

// meetMap: (섭외자|인도자) → 최신 만남 row
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
  const regions = _ldRegions(people);
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

  function getGoal(region, stage) {
    return Object.entries(STATE.goals)
      .filter(([k]) => {
        if (!k.endsWith('|' + stage + '|' + region)) return false;
        if (_ldKaigang === '전체') return true;
        return k.startsWith(_ldKaigang + '|');
      })
      .reduce((acc, [, v]) => acc + v, 0);
  }

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
  const regions = _ldRegions(people);
  const meetMap = _ldMeetMap();
  if (!people.length) return '<div style="color:var(--text3);font-size:12px;padding:10px;">만남 데이터가 없습니다</div>';

  function grpKey(date) {
    if (!date) return 'none';
    const d = new Date(date); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - tod) / 86400000);
    if (diff < 0)  return 'none';
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
    const sp = people.filter(r => r['단계'] === stage);
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
        const list = buckets[c.key] || [];
        const bgSt = c.cellBg ? `background:${c.cellBg};` : '';
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

// ─── 개강 필터 UI ───
function _buildLdFilterHtml(filterId, stageId, meetId, myRegions) {
  const wrap = document.getElementById(filterId);
  if (!wrap) return;
  const kaigangs = ['전체', ...[...new Set(
    STATE.nujeok.map(r => r['목표개강(연도/월)']).filter(Boolean)
  )].sort()];

  wrap.innerHTML = `<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">
    <span style="font-size:10px;color:var(--text3);font-weight:700;">개강</span>
    ${kaigangs.map(k =>
      `<button onclick="_ldSetKaigang('${k}','${filterId}','${stageId}','${meetId}',${JSON.stringify(myRegions || null)})"
        style="padding:3px 10px;border-radius:12px;border:1px solid var(--border);font-size:11px;cursor:pointer;font-family:inherit;
               background:${_ldKaigang===k?'var(--adm2)':'var(--surface2)'};color:${_ldKaigang===k?'#fff':'var(--text2)'};">${k}</button>`
    ).join('')}
  </div>`;
}

function _ldSetKaigang(val, filterId, stageId, meetId, myRegions) {
  _ldKaigang = val;
  const sw = document.getElementById(stageId);
  const mw = document.getElementById(meetId);
  if (sw) sw.innerHTML = _buildLdStageHtml(myRegions);
  if (mw) mw.innerHTML = _buildLdMeetHtml(myRegions);
  _buildLdFilterHtml(filterId, stageId, meetId, myRegions);
}

// ─── 렌더링 진입점 (STATE 기반, 동기) ───
function _asyncFillLd(stageId, meetId, filterId, _unused, myRegions) {
  const sw = document.getElementById(stageId);
  const mw = document.getElementById(meetId);
  if (sw) sw.innerHTML = _buildLdStageHtml(myRegions);
  if (mw) mw.innerHTML = _buildLdMeetHtml(myRegions);
  _buildLdFilterHtml(filterId, stageId, meetId, myRegions);
}
