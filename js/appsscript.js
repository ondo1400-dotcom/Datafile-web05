// ═══════════════════════════════════════════════════════
//  텔레그램봇 폴링 방식 — DB/찾기 자동 시트 입력
//  찾기: 실적지역+섭외자+인도자 기준 중복 체크 후 업데이트
// ═══════════════════════════════════════════════════════

const SS_ID      = '1T7lt0ZZ2JpQPD26ft9CAnslhxO-7a9Lk1ZF7rzX_624';
const SHEET      = 'DB_찾기';
const DB_CHAT_ID = '-1003828748700';

function getBotToken() {
  return PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
}

function sendMessage(chatId, text) {
  const token = getBotToken();
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: String(chatId), text: text }),
    muteHttpExceptions: true,
  });
}

// ─── 메인 폴링 함수 ───
function pollMessages() {
  const token = getBotToken();
  const props = PropertiesService.getScriptProperties();
  const lastUpdateId = parseInt(props.getProperty('last_update_id') || '0');
  const offset = lastUpdateId + 1;

  const url = 'https://api.telegram.org/bot' + token + '/getUpdates?offset=' + offset + '&limit=10&timeout=0';
  const res  = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const data = JSON.parse(res.getContentText());

  if (!data.ok || !data.result.length) return;

  data.result.forEach(update => {
    const updateId = update.update_id;
    const msg      = update.message;

    props.setProperty('last_update_id', String(updateId));

    if (!msg || !msg.text) return;

    const chatId = String(msg.chat.id);
    const text   = msg.text.trim();

    if (chatId !== DB_CHAT_ID) return;

    if (text.startsWith('[DB]')) {
      const parsed = parseForm(text, 'DB');
      if (parsed) {
        saveOrUpdateSheet(parsed);
        sendMessage(DB_CHAT_ID, '✅ DB - ' + (parsed['섭외자']||'—') + ' - 정상적으로 기록되었습니다.\n지역: ' + (parsed['실적지역']||'—'));
      } else {
        sendMessage(DB_CHAT_ID, '⚠️ DB 양식을 확인해주세요.\n실적지역과 섭외자는 필수입니다.');
      }
    } else if (text.startsWith('[찾기]')) {
      const parsed = parseForm(text, '찾기');
      if (parsed) {
        const isUpdate = saveOrUpdateSheet(parsed);
        sendMessage(DB_CHAT_ID,
          (isUpdate ? '🔄 찾기 수정' : '✅ 찾기 등록') +
          ' - ' + (parsed['섭외자']||'—') + ' - 정상적으로 기록되었습니다.\n지역: ' + (parsed['실적지역']||'—') + ' | 인도자: ' + (parsed['인도자']||'—')
        );
      } else {
        sendMessage(DB_CHAT_ID, '⚠️ 찾기 양식을 확인해주세요.\n실적지역과 섭외자는 필수입니다.');
      }
    }
  });
}

// ─── 양식 파싱 ───
function parseForm(text, type) {
  const lines = text.split('\n');
  const data  = { '구분': type };

  lines.forEach(line => {
    const sepIdx = line.indexOf(' : ');
    if (sepIdx < 0) return;
    const key = line.substring(0, sepIdx).trim();
    let   val = line.substring(sepIdx + 3).trim();
    if (!key || key.startsWith('[')) return;
    if (/^\(.*\)$/.test(val)) val = '';
    data[key] = val;
  });

  if (!data['실적지역'] || !data['섭외자']) return null;
  return data;
}

// ─── 시트에 저장 or 업데이트 ───
// DB: 항상 새로 추가
// 찾기: 실적지역+섭외자+인도자 기준으로 중복 체크 후 업데이트
// 반환값: true = 업데이트, false = 새로 추가
function saveOrUpdateSheet(data) {
  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET);
  if (!sheet) return false;

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];
  const now     = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  const 구분Col    = headers.indexOf('구분');
  const 지역Col    = headers.indexOf('실적지역');
  const 섭외자Col  = headers.indexOf('섭외자');
  const 인도자Col  = headers.indexOf('인도자');

  // 찾기인 경우 중복 체크
  if (data['구분'] === '찾기') {
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (
        row[구분Col]   === '찾기' &&
        row[지역Col]   === (data['실적지역'] || '') &&
        row[섭외자Col] === (data['섭외자']   || '') &&
        row[인도자Col] === (data['인도자']   || '')
      ) {
        // 기존 행 업데이트
        const newRow = headers.map((h, j) => {
          if (h === '등록일시')     return row[j]; // 등록일시는 유지
          if (h === '합자요청여부') return row[j]; // 합자요청 상태 유지
          if (h === '합자요청일시') return row[j];
          return data[h] !== undefined ? data[h] : row[j];
        });
        sheet.getRange(i + 1, 1, 1, headers.length).setValues([newRow]);
        return true; // 업데이트
      }
    }
  }

  // 새로 추가
  const newRow = headers.map(h => {
    if (h === '등록일시')     return now;
    if (h === '합자요청여부') return '';
    if (h === '합자요청일시') return '';
    return data[h] !== undefined ? data[h] : '';
  });
  sheet.appendRow(newRow);
  return false; // 새로 추가
}

// ─── 트리거 설정 ───
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'pollMessages') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('pollMessages').timeBased().everyMinutes(1).create();
  Logger.log('트리거 등록 완료 (1분마다 pollMessages 실행)');
}

function removeTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'pollMessages') ScriptApp.deleteTrigger(t);
  });
  Logger.log('트리거 삭제 완료');
}

function deleteWebhook() {
  const token = getBotToken();
  const res = UrlFetchApp.fetch(
    'https://api.telegram.org/bot' + token + '/deleteWebhook?drop_pending_updates=true',
    { muteHttpExceptions: true }
  );
  Logger.log('웹훅 해제: ' + res.getContentText());
}

function testPoll() {
  pollMessages();
  Logger.log('폴링 테스트 완료');
}
