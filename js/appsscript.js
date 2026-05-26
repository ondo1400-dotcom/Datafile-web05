// ═══════════════════════════════════════════════════════
//  텔레그램봇 폴링 방식 — DB/찾기 자동 시트 입력
//  찾기: 실적지역+섭외자+인도자 기준 중복 체크 후 업데이트
// ═══════════════════════════════════════════════════════

const SS_ID       = '1T7lt0ZZ2JpQPD26ft9CAnslhxO-7a9Lk1ZF7rzX_624';
const SHEET       = 'DB_찾기';
const DB_CHAT_ID  = '-1003828748700';
const JIPA_CHAT_ID = '-1003943121521';
const REVIEW_CHAT_ID       = '-1003943121521'; // 행정보고창
const REVIEW_EDIT_THREAD_ID = 104;             // 행정보고창 수정요청 주제

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

function sendMessageToThread(chatId, threadId, text) {
  const token = getBotToken();
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ chat_id: String(chatId), message_thread_id: threadId, text: text }),
    muteHttpExceptions: true,
  });
}

// Date/time cell value → readable string (KST)
function _fmtCell(val) {
  if (!val) return '';
  if (val instanceof Date && !isNaN(val)) {
    if (val.getFullYear() <= 1899) return Utilities.formatDate(val, 'Asia/Seoul', 'HH:mm');
    return Utilities.formatDate(val, 'Asia/Seoul', 'yyyy/MM/dd');
  }
  return String(val);
}

// Build formatted stage message text from a row data object
function buildStageText(stage, r) {
  const v  = key => (r[key] !== undefined && r[key] !== null) ? String(r[key]) : '';
  const vd = key => _fmtCell(r[key]);
  const loc = '청년회/' + v('실적지역');

  if (stage === '찾기') return `[찾기]
실적부서/지역 : ${loc}
인도자부서/지역/팀/구역 : ${v('인도자부서/지역/팀/구역')}
인도자 : ${v('인도자')}
목표개강(연도/월) : ${v('목표개강(연도/월)')}
목표센터 : ${v('목표센터')}
섭외자 : ${v('섭외자')}

출생연도 : ${v('출생연도')}
성별 : ${v('성별')}
사는곳(센터와의 거리) : ${v('사는곳')}
하는일 : ${v('하는일')}
종교 : ${v('종교')}
신앙년수 : ${v('신앙년수')}
섭외유형 : ${v('섭외유형')}
2차연결유형 : ${v('2차연결유형')}
다음만남일 : ${vd('다음만남일')}
다음만남시간 : ${vd('다음만남시간')}
다음만남목적 : ${v('다음만남목적')}`;

  if (stage === '합자') return `[합자]
실적부서/지역 : ${loc}
인도자부서/지역/팀/구역 : ${v('인도자부서/지역/팀/구역')}
인도자 : ${v('인도자')}

목표개강(연도/월) : ${v('목표개강(연도/월)')}
목표센터 : ${v('목표센터')}
섭외자 : ${v('섭외자')}
출생연도 : ${v('출생연도')}
성별 : ${v('성별')}
사는곳 : ${v('사는곳')}
하는일 : ${v('하는일')}
종교 : ${v('종교')}
신앙년수 : ${v('신앙년수')}
편입부서 : 청년
섭외유형 : ${v('섭외유형')}
2차연결유형 : ${v('2차연결유형')}
따기예정일 : ${vd('따기예정일')}
교사부서/지역/팀/구역 : ${v('교사부서/지역/팀/구역')}
교사 : ${v('교사')}
다음만남일 : ${vd('다음만남일')}
다음만남시간 : ${vd('다음만남시간')}
다음만남목적 : ${v('다음만남목적')}`;

  if (stage === '육따기') return `[육따기]
실적부서/지역 : ${loc}
인도자부서/지역/팀/구역 : ${v('인도자부서/지역/팀/구역')}
인도자 : ${v('인도자')}
교사부서/지역/팀/구역 : ${v('교사부서/지역/팀/구역')}
교사 : ${v('교사')}
섭외자 : ${v('섭외자')}

따기주간횟수 : ${v('따기주간횟수')}
따기기간 : ${v('따기기간')}
고정요일 : ${v('고정요일')}
다음만남일 : ${vd('다음만남일')}
다음만남시간 : ${vd('다음만남시간')}
다음만남목적 : ${v('다음만남목적')}`;

  if (stage === '영따기' || stage === '따기') return `[따기]
실적부서/지역 : ${loc}
인도자부서/지역/팀/구역 : ${v('인도자부서/지역/팀/구역')}
인도자 : ${v('인도자')}
교사부서/지역/팀/구역 : ${v('교사부서/지역/팀/구역')}
교사 : ${v('교사')}
섭외자 : ${v('섭외자')}

따기유형 : ${v('따기유형')}
따기단계 : ${v('따기단계')}
첫수업예정일 : ${vd('첫수업예정일')}
다음만남일 : ${vd('다음만남일')}
다음만남시간 : ${vd('다음만남시간')}
다음만남목적 : ${v('다음만남목적')}`;

  if (stage === '복음방') return `[복음방]
실적부서/지역 : ${loc}
인도자부서/지역/팀/구역 : ${v('인도자부서/지역/팀/구역')}
인도자 : ${v('인도자')}
교사부서/지역/팀/구역 : ${v('교사부서/지역/팀/구역')}
교사 : ${v('교사')}
섬김이부서/지역/팀/구역 : ${v('섬김이부서/지역/팀/구역')}
섬김이 : ${v('섬김이')}
섭외자 : ${v('섭외자')}

마팔수강번호 : ${v('마팔수강번호')}
복음방수업방식 : ${v('복음방수업방식')}
첫수업진행일 : ${vd('첫수업진행일')}
첫수업과목 : ${v('첫수업과목')}
다음만남일 : ${vd('다음만남일')}
다음만남시간 : ${vd('다음만남시간')}
다음만남목적 : ${v('다음만남목적')}`;

  if (stage === '지역장') return `[지역장]
실적부서/지역 : ${loc}
인도자부서/지역/팀/구역 : ${v('인도자부서/지역/팀/구역')}
인도자 : ${v('인도자')}
교사부서/지역/팀/구역 : ${v('교사부서/지역/팀/구역')}
교사 : ${v('교사')}
섭외자 : ${v('섭외자')}
다음만남일 : ${vd('다음만남일')}
다음만남시간 : ${vd('다음만남시간')}
다음만남목적 : ${v('다음만남목적')}
복음방총횟수 : ${v('복음방총횟수')}
복음방체크리스트 : ${v('복음방체크리스트')}
개강진면접여부 : ${v('개강진면접여부')}
신천지오픈여부 : ${v('신천지오픈여부')}
센터수강여부 : ${v('센터수강여부')}
재입교자여부 : ${v('재입교자여부')}`;

  return `[${stage}]\n섭외자 : ${v('섭외자')}\n실적지역 : ${v('실적지역')}`;
}

// Find person by 실적지역+섭외자+인도자, update non-protected fields, return result
function updatePersonInSheet(data) {
  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET);
  if (!sheet) return { found: false };

  const allData = sheet.getDataRange().getValues();
  const headers = allData[0];

  const 지역Col   = headers.indexOf('실적지역');
  const 섭외자Col = headers.indexOf('섭외자');
  const 인도자Col = headers.indexOf('인도자');
  const 구분Col   = headers.indexOf('구분');

  const preserved = [
    '구분', '등록일시', '합자요청여부', '합자요청일시',
    '심의요청여부', '심의요청일시', '심의승인여부', '심의승인일시',
    '전송완료여부', '전송완료일시', '심의단계',
  ];

  for (let i = 1; i < allData.length; i++) {
    const row = allData[i];
    if (
      String(row[지역Col])   === String(data['실적지역'] || '') &&
      String(row[섭외자Col]) === String(data['섭외자']   || '') &&
      String(row[인도자Col]) === String(data['인도자']   || '')
    ) {
      const existingStage = String(row[구분Col] || '');
      const newRow = headers.map((h, j) => {
        if (preserved.includes(h)) return row[j];
        return data[h] !== undefined ? data[h] : row[j];
      });
      sheet.getRange(i + 1, 1, 1, headers.length).setValues([newRow]);

      const rowData = {};
      headers.forEach((h, j) => { rowData[h] = newRow[j]; });
      return { found: true, stage: existingStage, rowData };
    }
  }
  return { found: false };
}

// ─── 메인 폴링 함수 ───
function pollMessages() {
  const token = getBotToken();
  const props = PropertiesService.getScriptProperties();
  const lastUpdateId = parseInt(props.getProperty('last_update_id') || '0');
  const offset = lastUpdateId + 1;

  const url = 'https://api.telegram.org/bot' + token + '/getUpdates?offset=' + offset + '&limit=10&timeout=0';
  const res  = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  const raw  = res.getContentText();
  const data = JSON.parse(raw);

  Logger.log('getUpdates 응답: ' + raw.substring(0, 200));

  if (!data.ok || !data.result.length) return;

  Logger.log('수신된 메시지 수: ' + data.result.length);

  data.result.forEach(update => {
    const updateId = update.update_id;
    const msg      = update.message;

    props.setProperty('last_update_id', String(updateId));

    if (!msg || !msg.text) return;

    const chatId = String(msg.chat.id);
    const text   = msg.text.trim();

    Logger.log('chatId=' + chatId + ' | DB_CHAT_ID=' + DB_CHAT_ID + ' | text=' + text.substring(0, 60));

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
    } else if (text.startsWith('[정보 업데이트]')) {
      const parsed = parseForm(text, '정보업데이트');
      if (parsed && parsed['인도자']) {
        const result = updatePersonInSheet(parsed);
        if (result.found) {
          const stageText = buildStageText(result.stage, result.rowData);
          sendMessageToThread(REVIEW_CHAT_ID, REVIEW_EDIT_THREAD_ID, stageText);
          sendMessage(DB_CHAT_ID,
            '✅ 정보 업데이트 - ' + (parsed['섭외자']||'—') + ' - 수정 완료\n' +
            '지역: ' + (parsed['실적지역']||'—') + ' | 인도자: ' + (parsed['인도자']||'—') + '\n' +
            '행정보고창 수정요청 주제로 전송되었습니다.'
          );
        } else {
          sendMessage(DB_CHAT_ID,
            '⚠️ 해당 인물을 찾을 수 없습니다. 찾기 보고가 먼저 필요합니다.\n' +
            '섭외자: ' + (parsed['섭외자']||'—') + ' | 실적지역: ' + (parsed['실적지역']||'—')
          );
        }
      } else {
        sendMessage(DB_CHAT_ID, '⚠️ 정보 업데이트 양식을 확인해주세요.\n실적지역, 섭외자, 인도자는 필수입니다.');
      }
    } else {
      Logger.log('포워딩 시도: chatId=' + chatId + ' | text=' + text.substring(0, 80));
      const token2 = getBotToken();
      const fwdRes = UrlFetchApp.fetch('https://api.telegram.org/bot' + token2 + '/sendMessage', {
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({ chat_id: String(JIPA_CHAT_ID), text: text }),
        muteHttpExceptions: true,
      });
      Logger.log('포워딩 결과: ' + fwdRes.getContentText());
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
