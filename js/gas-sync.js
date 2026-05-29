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

// ── 날짜 정규화: M/D 텍스트 또는 Date 객체 → YYYY-MM-DD ──
function _normalizeMeetDate(val) {
  if (val instanceof Date && !isNaN(val)) {
    return Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd');
  }
  const s = String(val || '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s; // 이미 정규화됨
  // M/D 또는 MM/DD 텍스트 → 연도는 현재연도 고정 (과거 보정 없음)
  const m = s.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (m) {
    const y  = new Date().getFullYear();
    const mo = String(parseInt(m[1])).padStart(2, '0');
    const d  = String(parseInt(m[2])).padStart(2, '0');
    return y + '-' + mo + '-' + d;
  }
  return s;
}

// ── 시간 정규화: Date 객체 또는 깨진 1899-12-30 → HH:mm ──
function _normalizeMeetTime(val) {
  if (val instanceof Date && !isNaN(val)) {
    return Utilities.formatDate(val, 'Asia/Seoul', 'HH:mm');
  }
  const s = String(val || '').trim();
  if (!s) return '';
  if (/^\d{2}:\d{2}$/.test(s)) return s;              // 이미 HH:mm
  if (s.startsWith('1899-12-30')) return '';            // 깨진 GAS 시간 → 빈 값
  return s;
}

// ── meets 테이블에 실제 존재하는 컬럼만 허용 ─────────────
const MEETS_COLS = new Set([
  '실적지역', '섭외자', '인도자', '단계',
  '다음만남일', '다음만남시간', '다음만남목적', '만남결과',
]);

// ── 다음만남일 시트 → meets 테이블 sync ──────────────────
// 시트 구조: 1행=제목, 2행=헤더, 3행~=데이터
function _syncMeets(ss) {
  const sheet = ss.getSheetByName('다음만남일');
  if (!sheet) { Logger.log('다음만남일 시트 없음'); return; }

  const allData = sheet.getDataRange().getValues();
  if (allData.length < 3) return;

  const headers = allData[1].map(h => String(h).trim());
  const rows = [];

  for (let i = 2; i < allData.length; i++) {
    const row = allData[i];
    if (!row[0] && !row[1]) continue;
    const obj = {};
    headers.forEach((h, j) => {
      if (!h || !MEETS_COLS.has(h)) return; // 테이블에 없는 컬럼 무시
      const val = row[j];
      if (h === '다음만남일') {
        obj[h] = _normalizeMeetDate(val);
      } else if (h === '다음만남시간') {
        obj[h] = _normalizeMeetTime(val);
      } else if (TIMESTAMP_COLS.includes(h)) {
        if (val instanceof Date && !isNaN(val)) {
          obj[h] = Utilities.formatDate(val, 'Asia/Seoul', "yyyy-MM-dd'T'HH:mm:ss+09:00");
        } else {
          obj[h] = parseKoreanDate(String(val));
        }
      } else if (val instanceof Date && !isNaN(val)) {
        obj[h] = Utilities.formatDate(val, 'Asia/Seoul', 'yyyy-MM-dd');
      } else {
        obj[h] = val !== null && val !== undefined ? String(val) : '';
      }
    });
    if (!obj['섭외자'] && !obj['인도자']) continue;
    if (!obj['다음만남일']) continue; // 날짜 없는 행 제외
    rows.push(obj);
  }

  if (!rows.length) return;

  // 중복 키 제거: 같은 (실적지역,섭외자,인도자,다음만남일) 중 마지막 행만 유지
  const deduped = Object.values(
    rows.reduce((acc, r) => {
      const k = (r['실적지역']||'') + '|' + (r['섭외자']||'') + '|' + (r['인도자']||'') + '|' + (r['다음만남일']||'');
      acc[k] = r;
      return acc;
    }, {})
  );

  const ok = _supabaseUpsert('meets', deduped, '실적지역,섭외자,인도자,다음만남일');
  if (ok) Logger.log('meets sync 완료: ' + deduped.length + '행 (' + rows.length + '행 중 중복 제거)');
}

// ── 메인 sync 함수 (트리거로 1분마다 실행) ──────────────
function syncSheetToSupabase() {
  const ssRead = SpreadsheetApp.openById(SS_READ_ID);
  _syncSheet(ssRead, NUJEOK_SHEET_NAME, 'nujeok');
  _syncSheet(ssRead, TALLAG_SHEET_NAME, 'tallag');
  _syncMeets(ssRead);
  _syncDbFindings();
  reconcilePendingUpdates();
  Logger.log('Supabase sync 완료: ' + new Date().toLocaleString('ko-KR'));
}

// ── DB_찾기 시트 → db_findings 테이블 정기 sync ──────────
function _syncDbFindings() {
  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName('DB_찾기');
  if (!sheet) { Logger.log('DB_찾기 시트 없음'); return; }

  const allData = sheet.getDataRange().getValues();
  if (allData.length < 2) return;

  const headers = allData[0].map(h => String(h).trim());
  const rows = allData.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => _convertRow(headers, row))
    .filter(r => r['섭외자']);

  if (!rows.length) return;

  const ok = _supabaseUpsert('db_findings', rows, '실적지역,섭외자,인도자');
  if (ok) Logger.log('db_findings sync 완료: ' + rows.length + '행');
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

// ── 목표설정 시트 일회성 이전 ─────────────────────────
function migrateGoals() {
  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName('목표설정');
  if (!sheet) { Logger.log('목표설정 시트 없음'); return; }

  const allData = sheet.getDataRange().getValues();
  if (allData.length < 2) { Logger.log('데이터 없음'); return; }

  const headers = allData[0].map(h => String(h).trim());
  const COL_MAP = {
    '개강(연도/월)': 'kaigang',
    '센터':          'center',
    '단계':          'stage',
    '지역':          'region',
    '목표수':        'target',
  };

  const rows = allData.slice(1)
    .filter(row => row.some(cell => cell !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((h, j) => {
        const key = COL_MAP[h];
        if (!key) return;
        const val = row[j];
        obj[key] = key === 'target' ? (parseInt(val) || 0) : String(val || '').trim();
      });
      return obj;
    })
    .filter(r => r.kaigang && r.stage && r.region);

  if (!rows.length) { Logger.log('유효 행 없음'); return; }

  const ok = _supabaseUpsert('goals', rows, 'kaigang,center,stage,region');
  if (ok) Logger.log('goals 이전 완료: 총 ' + rows.length + '행');
}

// ── DB_찾기 시트 일회성 이전 (기존 호환용 — _syncDbFindings 위임) ──
function migrateDbFindings() {
  _syncDbFindings();
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
