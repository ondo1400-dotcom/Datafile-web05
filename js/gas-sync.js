// ═══════════════════════════════════════════════════════
//  gas-sync.js — 화정-청년시트 → Supabase sync
//  Google Apps Script에 붙여넣기용 (별도 .gs 파일로 추가)
// ═══════════════════════════════════════════════════════

const SUPABASE_URL      = 'https://chxixthkinagqfjwhoar.supabase.co';
const NUJEOK_SHEET_NAME = '청년누적';
const TALLAG_SHEET_NAME = '청년탈락';

function getSupabaseKey() {
  // Supabase service_role key를 Script Properties에 저장
  // Apps Script 에디터 > 프로젝트 설정 > 스크립트 속성 > SUPABASE_SERVICE_KEY 추가
  return PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_KEY');
}

// ── 메인 sync 함수 (트리거로 1분마다 실행) ──────────────
function syncSheetToSupabase() {
  const ss = SpreadsheetApp.openById(SS_ID);

  _syncSheet(ss, NUJEOK_SHEET_NAME, 'nujeok');
  _syncSheet(ss, TALLAG_SHEET_NAME, 'tallag');

  Logger.log('Supabase sync 완료: ' + new Date().toLocaleString('ko-KR'));
}

function _syncSheet(ss, sheetName, table) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('시트 없음: ' + sheetName);
    return;
  }

  const allData = sheet.getDataRange().getValues();
  if (allData.length < 2) return;

  const headers = allData[0].map(h => String(h).trim());
  const rows = allData.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map((row, i) => {
      const obj = { synced_at: new Date().toISOString() };
      headers.forEach((h, j) => {
        if (!h) return;
        const val = row[j];
        // Date 객체 처리
        if (val instanceof Date && !isNaN(val)) {
          obj[h] = Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd');
        } else {
          obj[h] = val !== null && val !== undefined ? String(val) : '';
        }
      });
      return obj;
    })
    .filter(r => r['섭외자']); // 섭외자 없는 행 제외

  if (!rows.length) return;

  // Supabase REST API upsert (실적지역+섭외자+인도자 기준)
  const key   = getSupabaseKey();
  const url   = SUPABASE_URL + '/rest/v1/' + table + '?on_conflict=' + encodeURIComponent('실적지역,섭외자,인도자');

  // 500행씩 배치 처리
  const BATCH = 500;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Prefer': 'resolution=merge-duplicates',
      },
      payload: JSON.stringify(batch),
      muteHttpExceptions: true,
    });

    const code = res.getResponseCode();
    if (code < 200 || code >= 300) {
      Logger.log(table + ' sync 오류 (' + code + '): ' + res.getContentText().substring(0, 200));
    } else {
      Logger.log(table + ' batch ' + (i/BATCH+1) + ' sync 완료 (' + batch.length + '행)');
    }
  }
}

// ── pending_updates 자동 reconcile ─────────────────────
// nujeok sync 후 pending이 시트에 반영됐는지 확인
function reconcilePendingUpdates() {
  const key = getSupabaseKey();

  // pending 목록 조회
  const pendingRes = UrlFetchApp.fetch(
    SUPABASE_URL + '/rest/v1/pending_updates?status=eq.pending&select=*',
    {
      headers: { 'apikey': key, 'Authorization': 'Bearer ' + key },
      muteHttpExceptions: true,
    }
  );

  const pending = JSON.parse(pendingRes.getContentText());
  if (!pending.length) return;

  pending.forEach(p => {
    const changes = p.changes || {};

    // nujeok에서 해당 인물 조회
    const filter = '실적지역=eq.' + encodeURIComponent(p['실적지역'])
      + '&섭외자=eq.' + encodeURIComponent(p['섭외자'])
      + '&인도자=eq.' + encodeURIComponent(p['인도자'] || '');

    const nujeokRes = UrlFetchApp.fetch(
      SUPABASE_URL + '/rest/v1/nujeok?' + filter + '&select=*&limit=1',
      { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }, muteHttpExceptions: true }
    );

    const nujeokRows = JSON.parse(nujeokRes.getContentText());
    if (!nujeokRows.length) return;

    const actual = nujeokRows[0];
    // 변경사항이 시트에 반영됐는지 확인
    const allMatched = Object.entries(changes).every(([k, v]) => String(actual[k] || '') === String(v));

    if (allMatched) {
      // approved 처리
      UrlFetchApp.fetch(
        SUPABASE_URL + '/rest/v1/pending_updates?id=eq.' + p.id,
        {
          method: 'patch',
          contentType: 'application/json',
          headers: {
            'apikey': key,
            'Authorization': 'Bearer ' + key,
            'Prefer': 'return=minimal',
          },
          payload: JSON.stringify({ status: 'approved', resolved_at: new Date().toISOString() }),
          muteHttpExceptions: true,
        }
      );
      Logger.log('pending_update 반영 확인: ' + p['섭외자']);
    }
  });
}

// ── 트리거 설정 ────────────────────────────────────────
function setupSyncTrigger() {
  // 기존 sync 트리거 제거
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'syncSheetToSupabase') ScriptApp.deleteTrigger(t);
  });
  // 1분마다 실행
  ScriptApp.newTrigger('syncSheetToSupabase').timeBased().everyMinutes(1).create();
  Logger.log('sync 트리거 등록 완료');
}
