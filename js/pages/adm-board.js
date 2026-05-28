// ══════════════════════════════════════════════════════
//  pages/adm-board.js — 청년회 전지역 보유현황 (NotionTable)
// ══════════════════════════════════════════════════════

function renderBoardTable() {
  const findingRows = (STATE.dbFindings || [])
    .filter(r => r['구분'] === '찾기')
    .map(r => ({ ...r, '단계': '찾기', _isDbFinding: true }));

  const data = [...(STATE.nujeok || []), ...findingRows];

  if (window.NotionTableApp) {
    window.NotionTableApp.mountBoardTable('adm-board-notion-root', data, {
      source: 'adm-board',
      onRefresh: () => { if (typeof loadData === 'function') loadData().then(renderBoardTable); },
    });
  }
}
