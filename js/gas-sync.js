// ═══════════════════════════════════════════════════════
//  gas-sync.js — 화정-청년시트 → Supabase sync
//  Google Apps Script에 붙여넣기용 (별도 .gs 파일로 추가)
// ═══════════════════════════════════════════════════════

const SUPABASE_URL      = 'https://chxixthkinagqfjwhoar.supabase.co';
const NUJEOK_SHEET_NAME = '청년누적';
const TALLAG_SHEET_NAME = '청년탈락';

function getSupabaseKey() {
  return PropertiesService.getScriptProperties().getProperty('SUPABASE_SERVICE_KEY');
}

// ── 한국어 날짜 파싱 ("2026. 5. 25. 오후 11:34:26" → ISO) ──
function parseKoreanDate(val) {
  if (!val) return null;
  const s = String(val).trim();
  const m = s.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!m) return null;
  let h = parseInt(m[5]);
  if (m[4] === '오전' && h === 12) h = 0;
  else if (m[4] === '오후' && h !== 12) h += 12;
  const mo = m[2].padStart(2,'0'), d = m[3].padStart(2,'0'), sec = m[7] || '00';
  return `${m[1]}-${mo}-${d}T${String(h).padStart(2,'0')}:${m[6]}:${sec}+09:00`;
}

// ── 날짜 계열 컬럼 목록 ────────────────────────────────
const TIMESTAMP_COLS = ['등록일시','합자요청일시','심의요청일시','심의승인일시','전송완료일시'];

// ── 행 데이터 변환 헬퍼 ────────────────────────────────
function _convertRow(headers, row, extraFields) {
  const obj = extraFields || {};
  headers.forEach((h, j) => {
    if (!h || h === '__rowIndex') return;
    const val = row[j];
    if (TIMESTAMP_COLS.includes(h)) {
      if (val instanceof Date && !isNaN(val)) {
        obj[h] = Utilities.formatDate(val, 'Asia/Seoul', "yyyy-MM-dd'T'HH:mm:ss+09:00");
      } else {
        obj[h] = parseKoreanDate(String(val));
      }
    } else if (h === '출생연도') {
      const n = parseInt(val);
      obj[h] = isNaN(n) ? null : n;
    } else if (val instanceof Date && !isNaN(val)) {
      obj[h] = Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd');
    } else {
      obj[h] = val !== null && val !== undefined ? String(val) : '';
    }
  });
  return obj;
}

// ── Supabase upsert 배치 전송 ──────────────────────────
function _supabaseUpsert(table, rows, conflictCols) {
  const key = getSupabaseKey();
  const url = SUPABASE_URL + '/rest/v1/' + table + '?on_conflict=' + encodeURIComponent(conflictCols);
  const BATCH = 200;

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
    if (code >= 400) {
      Logger.log(table + ' 오류 (' + code + '): ' + res.getContentText().substring(0, 300));
      return false;
    }
    Logger.log(table + ' batch ' + (Math.floor(i/BATCH)+1) + ' 완료 (' + batch.length + '행)');
  }
  return true;
}

// ── 메인 sync 함수 (트리거로 1분마다 실행) ──────────────
function syncSheetToSupabase() {
  const ss = SpreadsheetApp.openById(SS_ID);
  _syncSheet(ss, NUJEOK_SHEET_NAME, 'nujeok');
  _syncSheet(ss, TALLAG_SHEET_NAME, 'tallag');
  reconcilePendingUpdates();
  Logger.log('Supabase sync 완료: ' + new Date().toLocaleString('ko-KR'));
}

function _syncSheet(ss, sheetName, table) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) { Logger.log('시트 없음: ' + sheetName); return; }

  const allData = sheet.getDataRange().getValues();
  if (allData.length < 2) return;

  const headers = allData[0].map(h => String(h).trim());
  const rows = allData.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => _convertRow(headers, row, { synced_at: new Date().toISOString() }))
    .filter(r => r['섭외자']);

  if (!rows.length) return;
  _supabaseUpsert(table, rows, '실적지역,섭외자,인도자');
}

// ── DB_찾기 시트 일회성 이전 ───────────────────────────
function migrateDbFindings() {
  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName('DB_찾기');
  if (!sheet) { Logger.log('DB_찾기 시트 없음'); return; }

  const allData = sheet.getDataRange().getValues();
  if (allData.length < 2) { Logger.log('데이터 없음'); return; }

  const headers = allData[0].map(h => String(h).trim());
  const rows = allData.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => _convertRow(headers, row))
    .filter(r => r['섭외자']);

  if (!rows.length) { Logger.log('유효 행 없음'); return; }

  const ok = _supabaseUpsert('db_findings', rows, '실적지역,섭외자,인도자');
  if (ok) Logger.log('db_findings 이전 완료: 총 ' + rows.length + '행');
}

// ── pending_updates 자동 reconcile ─────────────────────
function reconcilePendingUpdates() {
  const key = getSupabaseKey();

  const pendingRes = UrlFetchApp.fetch(
    SUPABASE_URL + '/rest/v1/pending_updates?status=eq.pending&select=*',
    { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }, muteHttpExceptions: true }
  );

  let pending;
  try { pending = JSON.parse(pendingRes.getContentText()); } catch(e) { return; }
  if (!Array.isArray(pending) || !pending.length) return;

  pending.forEach(p => {
    const changes = p.changes || {};
    const filter = '실적지역=eq.' + encodeURIComponent(p['실적지역'])
      + '&섭외자=eq.' + encodeURIComponent(p['섭외자'])
      + '&인도자=eq.' + encodeURIComponent(p['인도자'] || '');

    const nujeokRes = UrlFetchApp.fetch(
      SUPABASE_URL + '/rest/v1/nujeok?' + filter + '&select=*&limit=1',
      { headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }, muteHttpExceptions: true }
    );

    let nujeokRows;
    try { nujeokRows = JSON.parse(nujeokRes.getContentText()); } catch(e) { return; }
    if (!nujeokRows.length) return;

    const actual = nujeokRows[0];
    const allMatched = Object.entries(changes).every(([k, v]) => String(actual[k] || '') === String(v));

    if (allMatched) {
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
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'syncSheetToSupabase') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncSheetToSupabase').timeBased().everyMinutes(1).create();
  Logger.log('sync 트리거 등록 완료');
}
