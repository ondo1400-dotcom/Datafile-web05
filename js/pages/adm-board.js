// ══════════════════════════════════════════════════════
//  pages/adm-board.js — 청년회 전지역 보유현황 (NotionTable)
// ══════════════════════════════════════════════════════

let _admBoardShowTallag = false;

function toggleAdmTallag() {
  _admBoardShowTallag = !_admBoardShowTallag;
  const btn = document.getElementById('adm-tallag-toggle');
  if (btn) {
    btn.textContent = _admBoardShowTallag ? '탈락 숨기기' : '탈락 보기';
    btn.style.background = _admBoardShowTallag ? 'var(--red)' : '';
    btn.style.color      = _admBoardShowTallag ? '#fff' : '';
  }
  renderBoardTable();
}

function renderBoardTable() {
  const tallagRows = _admBoardShowTallag
    ? (STATE.tallag || []).map(r => ({ ...r, _isTallag: true }))
    : [];
  const allNujeok = [...(STATE.nujeok || []), ...tallagRows];
  const nujeokKeys = new Set(allNujeok.map(r => (r['실적지역']||'')+'|'+(r['섭외자']||'')+'|'+(r['인도자']||'')));
  const findingRows = (STATE.dbFindings || [])
    .filter(r => r['구분'] === '찾기')
    .filter(r => !nujeokKeys.has((r['실적지역']||'')+'|'+(r['섭외자']||'')+'|'+(r['인도자']||'')))
    .map(r => ({ ...r, '단계': '찾기', _isDbFinding: true }));

  const data = [...allNujeok, ...findingRows];

  if (window.NotionTableApp) {
    window.NotionTableApp.mountBoardTable('adm-board-notion-root', data, {
      source: 'adm-board',
      onRefresh: () => { if (typeof loadData === 'function') loadData().then(renderBoardTable); },
    });
  }
}
