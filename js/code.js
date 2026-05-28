// ═══════════════════════════════════════════════════════
//  지역관리 시스템 — Google Apps Script 백엔드
//  스프레드시트 ID: 1uxcoUk2L7kEpvf3skds11ljZhu8vxI220UhYFoz_uww
// ═══════════════════════════════════════════════════════

const SS_READ_ID    = '1uxcoUk2L7kEpvf3skds11ljZhu8vxI220UhYFoz_uww';
const SS_ID         = '1T7lt0ZZ2JpQPD26ft9CAnslhxO-7a9Lk1ZF7rzX_624';
const SHEET_ACTIVE  = '개강체크_활성';
const SHEET_ARCHIVE = '개강체크_탈락';
const SHEET_GOAL    = '목표설정';
const SHEET_DB      = 'DB_찾기';
const TG_CHAT_ID     = '-1003943121521';
const REVIEW_CHAT_ID = '-1003943121521';
const EDIT_CHAT_ID          = '-1003983618752'; // 지파보고창 청년
const EDIT_THREAD_ID        = 53;              // 지파보고창 수정요청 주제
const REVIEW_EDIT_THREAD_ID = 104;             // 행정보고창 수정요청 주제
const DASH_THREAD_ID        = 107;             // 행정보고창 현황보고 주제

// Date 셀 → KST 문자열 변환 (날짜/시간 모두 처리)
function _cellVal(val) {
  if (!(val instanceof Date) || isNaN(val)) return val;
  if (val.getFullYear() <= 1899) {
    // 시간 전용 셀 (1899-12-30 기준)
    return Utilities.formatDate(val, 'Asia/Seoul', 'HH:mm');
  }
  return Utilities.formatDate(val, 'Asia/Seoul', 'yyyy/MM/dd');
}

function makeKey(row) {
  return [row['실적지역']||'', row['인도자']||'', row['섭외자']||'', row['목표개강(연도/월)']||'', row['목표센터']||''].join('|');
}
function makeGoalKey(kaigang, center, stage, region) {
  return [kaigang, center, stage, region].join('|');
}
function setCORS(output) {
  return output.setMimeType(ContentService.MimeType.JSON);
}
function getBotToken() {
  return PropertiesService.getScriptProperties().getProperty('BOT_TOKEN');
}

// ═══ GET ═══
function doGet(e) {
  try {
    if (e.parameter.payload) {
      const payload = JSON.parse(e.parameter.payload);
      const action  = payload.action;
      if (action === 'saveCheck')             return setCORS(ContentService.createTextOutput(JSON.stringify(saveCheckItem(payload))));
      if (action === 'addCheckItem')          return setCORS(ContentService.createTextOutput(JSON.stringify(addCheckItem(payload.itemName))));
      if (action === 'removeCheckItem')       return setCORS(ContentService.createTextOutput(JSON.stringify(removeCheckItem(payload.itemName))));
      if (action === 'syncTallag')            return setCORS(ContentService.createTextOutput(JSON.stringify(syncTallagData())));
      if (action === 'saveGoal')              return setCORS(ContentService.createTextOutput(JSON.stringify(saveGoal(payload))));
      if (action === 'saveMeetResult')        return setCORS(ContentService.createTextOutput(JSON.stringify(saveMeetResult(payload))));
      if (action === 'saveDbFinding')         return setCORS(ContentService.createTextOutput(JSON.stringify(saveOrUpdateDbFinding(payload))));
      if (action === 'saveOrUpdateDbFinding') return setCORS(ContentService.createTextOutput(JSON.stringify(saveOrUpdateDbFinding(payload))));
      if (action === 'requestHapja')          return setCORS(ContentService.createTextOutput(JSON.stringify(requestHapja(payload))));
      if (action === 'requestAccess')         return setCORS(ContentService.createTextOutput(JSON.stringify(requestAccess(payload))));
      if (action === 'approveUser')           return setCORS(ContentService.createTextOutput(JSON.stringify(approveUser(payload))));
      if (action === 'rejectRequest')         return setCORS(ContentService.createTextOutput(JSON.stringify(rejectRequest(payload))));
      if (action === 'deleteUser')            return setCORS(ContentService.createTextOutput(JSON.stringify(deleteUser(payload))));
      if (action === 'deleteGoal')            return setCORS(ContentService.createTextOutput(JSON.stringify(deleteGoal(payload))));
      if (action === 'requestReview')         return setCORS(ContentService.createTextOutput(JSON.stringify(requestReview(payload))));
      if (action === 'approveReview')         return setCORS(ContentService.createTextOutput(JSON.stringify(approveReview(payload))));
      if (action === 'sendReviewTelegram')    return setCORS(ContentService.createTextOutput(JSON.stringify(sendReviewTelegram(payload))));
      if (action === 'requestTallag')         return setCORS(ContentService.createTextOutput(JSON.stringify(requestTallag(payload))));
      if (action === 'requestIwol')           return setCORS(ContentService.createTextOutput(JSON.stringify(requestIwol(payload))));
      if (action === 'requestEdit')           return setCORS(ContentService.createTextOutput(JSON.stringify(requestEdit(payload))));
      if (action === 'sendDashTelegram')         return setCORS(ContentService.createTextOutput(JSON.stringify(sendDashTelegram(payload))));
      if (action === 'sendDashPhoto')            return setCORS(ContentService.createTextOutput(JSON.stringify(sendDashPhoto(payload))));
      if (action === 'getPersonChecklist')       return setCORS(ContentService.createTextOutput(JSON.stringify(getPersonChecklist(payload))));
      if (action === 'savePersonChecklistItem')  return setCORS(ContentService.createTextOutput(JSON.stringify(savePersonChecklistItem(payload))));
      return setCORS(ContentService.createTextOutput(JSON.stringify({ error: '알 수 없는 action' })));
    }
    const action = e.parameter.action || 'getData';
    if (action === 'getData')     return setCORS(ContentService.createTextOutput(JSON.stringify(getAllData())));
    if (action === 'syncTallag')  return setCORS(ContentService.createTextOutput(JSON.stringify(syncTallagData())));
    if (action === 'checkAuth')   return setCORS(ContentService.createTextOutput(JSON.stringify(checkAuth(e.parameter.email))));
    if (action === 'getAuthData') return setCORS(ContentService.createTextOutput(JSON.stringify(getAuthData())));
    return setCORS(ContentService.createTextOutput(JSON.stringify({ error: '알 수 없는 action' })));
  } catch (err) {
    return setCORS(ContentService.createTextOutput(JSON.stringify({ error: err.message })));
  }
}

// ═══ POST ═══
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const action  = payload.action;
    if (action === 'saveCheck')             return setCORS(ContentService.createTextOutput(JSON.stringify(saveCheckItem(payload))));
    if (action === 'addCheckItem')          return setCORS(ContentService.createTextOutput(JSON.stringify(addCheckItem(payload.itemName))));
    if (action === 'removeCheckItem')       return setCORS(ContentService.createTextOutput(JSON.stringify(removeCheckItem(payload.itemName))));
    if (action === 'syncTallag')            return setCORS(ContentService.createTextOutput(JSON.stringify(syncTallagData())));
    if (action === 'saveGoal')              return setCORS(ContentService.createTextOutput(JSON.stringify(saveGoal(payload))));
    if (action === 'saveMeetResult')        return setCORS(ContentService.createTextOutput(JSON.stringify(saveMeetResult(payload))));
    if (action === 'saveDbFinding')         return setCORS(ContentService.createTextOutput(JSON.stringify(saveOrUpdateDbFinding(payload))));
    if (action === 'saveOrUpdateDbFinding') return setCORS(ContentService.createTextOutput(JSON.stringify(saveOrUpdateDbFinding(payload))));
    if (action === 'requestHapja')          return setCORS(ContentService.createTextOutput(JSON.stringify(requestHapja(payload))));
    if (action === 'requestAccess')         return setCORS(ContentService.createTextOutput(JSON.stringify(requestAccess(payload))));
    if (action === 'approveUser')           return setCORS(ContentService.createTextOutput(JSON.stringify(approveUser(payload))));
    if (action === 'rejectRequest')         return setCORS(ContentService.createTextOutput(JSON.stringify(rejectRequest(payload))));
    if (action === 'deleteUser')            return setCORS(ContentService.createTextOutput(JSON.stringify(deleteUser(payload))));
    if (action === 'deleteGoal')            return setCORS(ContentService.createTextOutput(JSON.stringify(deleteGoal(payload))));
    if (action === 'requestReview')         return setCORS(ContentService.createTextOutput(JSON.stringify(requestReview(payload))));
    if (action === 'approveReview')         return setCORS(ContentService.createTextOutput(JSON.stringify(approveReview(payload))));
    if (action === 'sendReviewTelegram')    return setCORS(ContentService.createTextOutput(JSON.stringify(sendReviewTelegram(payload))));
    if (action === 'requestTallag')         return setCORS(ContentService.createTextOutput(JSON.stringify(requestTallag(payload))));
    if (action === 'requestIwol')           return setCORS(ContentService.createTextOutput(JSON.stringify(requestIwol(payload))));
    if (action === 'requestEdit')           return setCORS(ContentService.createTextOutput(JSON.stringify(requestEdit(payload))));
    if (action === 'sendDashTelegram')         return setCORS(ContentService.createTextOutput(JSON.stringify(sendDashTelegram(payload))));
    if (action === 'sendDashPhoto')            return setCORS(ContentService.createTextOutput(JSON.stringify(sendDashPhoto(payload))));
    if (action === 'getPersonChecklist')       return setCORS(ContentService.createTextOutput(JSON.stringify(getPersonChecklist(payload))));
    if (action === 'savePersonChecklistItem')  return setCORS(ContentService.createTextOutput(JSON.stringify(savePersonChecklistItem(payload))));
    return setCORS(ContentService.createTextOutput(JSON.stringify({ error: '알 수 없는 action' })));
  } catch (err) {
    return setCORS(ContentService.createTextOutput(JSON.stringify({ error: err.message })));
  }
}

// ═══ 전체 데이터 읽기 ═══
function getAllData() {
  const ss     = SpreadsheetApp.openById(SS_ID);
  const ssRead = SpreadsheetApp.openById(SS_READ_ID);
  const nujeok     = readSheetAsObjects(ssRead, '청년누적');
  const tallag     = readSheetAsObjects(ssRead, '청년탈락');
  const meets      = readMeets(ssRead);
  const checks     = readCheckSheet(ss);
  const items      = getCheckItems(ss);
  const goals      = readGoals(ss);
  const tallagKeys = new Set(tallag.map(r => makeKey(r)));
  const dbFindings = readDbFinding(ss);
  return { nujeok, tallag, checks, checkItems: items, goals, meets, dbFindings, tallagKeys: [...tallagKeys], syncedAt: new Date().toISOString() };
}

function readSheetAsObjects(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 3) return [];
  const headers = data[1];
  const rows = [];
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[2]) continue;
    const obj = {};
    headers.forEach((h, j) => { if (h) obj[h] = _cellVal(row[j] !== undefined ? row[j] : ''); });
    obj['__rowIndex'] = i + 1;
    rows.push(obj);
  }
  return rows;
}

function readCheckSheet(ss) {
  ensureCheckSheets(ss);
  const sheet = ss.getSheetByName(SHEET_ACTIVE);
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0]) continue;
    const obj = {};
    headers.forEach((h, j) => { if (h) obj[h] = _cellVal(row[j]); });
    rows.push(obj);
  }
  return rows;
}

function getCheckItems(ss) {
  let sheet = ss.getSheetByName('체크항목관리');
  if (!sheet) {
    sheet = ss.insertSheet('체크항목관리');
    sheet.getRange('A1').setValue('항목명');
    ['프리뷰파티 확답','섬김이 투입','수강신청서 완료','개강전 면접 완료'].forEach((item, i) => sheet.getRange(i+2,1).setValue(item));
  }
  return sheet.getDataRange().getValues().slice(1).map(r => r[0]).filter(v => v);
}

function readGoals(ss) {
  let sheet = ss.getSheetByName(SHEET_GOAL);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_GOAL);
    const h = ['개강(연도/월)','센터','단계','지역','목표수'];
    sheet.appendRow(h); sheet.setFrozenRows(1);
    sheet.getRange(1,1,1,h.length).setBackground('#1A3A8F').setFontColor('#ffffff').setFontWeight('bold');
    return {};
  }
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return {};
  const goals = {};
  for (let i = 1; i < data.length; i++) {
    const [kaigang, center, stage, region, count] = data[i];
    if (!kaigang || !stage || !region) continue;
    goals[makeGoalKey(kaigang, center, stage, region)] = Number(count) || 0;
  }
  return goals;
}

function saveGoal(payload) {
  const ss = SpreadsheetApp.openById(SS_ID);
  let sheet = ss.getSheetByName(SHEET_GOAL);
  if (!sheet) { sheet = ss.insertSheet(SHEET_GOAL); sheet.appendRow(['개강(연도/월)','센터','단계','지역','목표수']); }
  const { kaigang, center, stage, region, count } = payload;
  const data = sheet.getDataRange().getValues();
  let found = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]==kaigang && data[i][1]==center && data[i][2]==stage && data[i][3]==region) { found=i+1; break; }
  }
  if (found > 0) sheet.getRange(found, 5).setValue(Number(count)||0);
  else sheet.appendRow([kaigang, center, stage, region, Number(count)||0]);
  return { success: true, goals: readGoals(ss) };
}

function deleteGoal(payload) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET_GOAL);
  if (!sheet) return { success: false };
  const { kaigang, center, stage, region } = payload;
  const data = sheet.getDataRange().getValues();
  for (let i = data.length-1; i >= 1; i--) {
    if (data[i][0]==kaigang && data[i][1]==center && data[i][2]==stage && data[i][3]==region) { sheet.deleteRow(i+1); break; }
  }
  return { success: true, goals: readGoals(ss) };
}

function saveCheckItem(payload) {
  const ss = SpreadsheetApp.openById(SS_ID);
  ensureCheckSheets(ss);
  const sheet   = ss.getSheetByName(SHEET_ACTIVE);
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const keyCol       = headers.indexOf('복합키');
  const itemCol      = headers.indexOf('항목명');
  const checkedCol   = headers.indexOf('체크여부');
  const checkerCol   = headers.indexOf('체크자');
  const checkedAtCol = headers.indexOf('체크일시');
  let found = -1;
  for (let i = 1; i < data.length; i++) {
    if (data[i][keyCol]===payload.key && data[i][itemCol]===payload.itemName) { found=i+1; break; }
  }
  const now  = new Date().toLocaleString('ko-KR', {timeZone:'Asia/Seoul'});
  const info = payload.nujeokInfo || {};
  if (found > 0) {
    sheet.getRange(found, checkedCol+1).setValue(payload.checked?'Y':'N');
    sheet.getRange(found, checkerCol+1).setValue(payload.checker||'');
    sheet.getRange(found, checkedAtCol+1).setValue(now);
  } else {
    sheet.appendRow(headers.map(h => {
      if (h==='복합키')            return payload.key;
      if (h==='실적지역')          return info['실적지역']||'';
      if (h==='인도자')            return info['인도자']||'';
      if (h==='섭외자')            return info['섭외자']||'';
      if (h==='목표개강(연도/월)') return info['목표개강(연도/월)']||'';
      if (h==='목표센터')          return info['목표센터']||'';
      if (h==='단계')              return info['단계']||'';
      if (h==='항목명')            return payload.itemName;
      if (h==='체크여부')          return payload.checked?'Y':'N';
      if (h==='체크자')            return payload.checker||'';
      if (h==='체크일시')          return now;
      if (h==='등록일시')          return now;
      return '';
    }));
  }
  return { success: true, key: payload.key, item: payload.itemName };
}

function addCheckItem(itemName) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName('체크항목관리') || ss.insertSheet('체크항목관리');
  if (!sheet.getDataRange().getValues().some(r => r[0]===itemName)) sheet.appendRow([itemName]);
  return { success: true, items: getCheckItems(ss) };
}

function removeCheckItem(itemName) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName('체크항목관리');
  if (!sheet) return { success: false };
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]===itemName) { sheet.deleteRow(i+1); break; }
  }
  return { success: true, items: getCheckItems(ss) };
}

function syncTallagData() {
  const ss     = SpreadsheetApp.openById(SS_ID);
  const ssRead = SpreadsheetApp.openById(SS_READ_ID);
  ensureCheckSheets(ss);
  const tallag     = readSheetAsObjects(ssRead, '청년탈락');
  const tallagKeys = new Set(tallag.map(r => makeKey(r)));
  const activeSheet  = ss.getSheetByName(SHEET_ACTIVE);
  const archiveSheet = ss.getSheetByName(SHEET_ARCHIVE);
  const activeData   = activeSheet.getDataRange().getValues();
  if (activeData.length < 2) return { moved: 0 };
  const keyCol = activeData[0].indexOf('복합키');
  let moved = 0;
  for (let i = activeData.length-1; i >= 1; i--) {
    const rowKey = activeData[i][keyCol];
    if (!rowKey) continue;
    const shortKey = rowKey.split('|').slice(0,3).join('|');
    let isTallag = tallagKeys.has(rowKey);
    if (!isTallag) for (const tk of tallagKeys) { if (tk.startsWith(shortKey)) { isTallag=true; break; } }
    if (isTallag) {
      archiveSheet.appendRow([...activeData[i], new Date().toLocaleString('ko-KR',{timeZone:'Asia/Seoul'})]);
      activeSheet.deleteRow(i+1);
      moved++;
    }
  }
  return { success: true, moved, syncedAt: new Date().toISOString() };
}

function ensureCheckSheets(ss) {
  if (!ss.getSheetByName(SHEET_ACTIVE)) {
    const s = ss.insertSheet(SHEET_ACTIVE);
    const h = ['복합키','실적지역','인도자','섭외자','목표개강(연도/월)','목표센터','단계','항목명','체크여부','체크자','체크일시','등록일시'];
    s.appendRow(h); s.setFrozenRows(1);
    s.getRange(1,1,1,h.length).setBackground('#1A3A8F').setFontColor('#ffffff').setFontWeight('bold');
  }
  if (!ss.getSheetByName(SHEET_ARCHIVE)) {
    const s = ss.insertSheet(SHEET_ARCHIVE);
    const h = ['복합키','실적지역','인도자','섭외자','목표개강(연도/월)','목표센터','단계','항목명','체크여부','체크자','체크일시','등록일시','아카이브일시'];
    s.appendRow(h); s.setFrozenRows(1);
    s.getRange(1,1,1,h.length).setBackground('#C0392B').setFontColor('#ffffff').setFontWeight('bold');
  }
}

function setupDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction()==='syncTallagData') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('syncTallagData').timeBased().everyDays(1).atHour(23).create();
  Logger.log('탈락 동기화 트리거 등록 완료 (매일 23시)');
}

function readMeets(ss) {
  const sheet = ss.getSheetByName('다음만남일');
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 3) return [];
  const headers = data[1];
  const rows = [];
  for (let i = 2; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[1]) continue;
    const obj = {};
    headers.forEach((h, j) => { if (h) obj[h] = _cellVal(row[j] !== undefined ? row[j] : ''); });
    obj['__rowIndex'] = i + 1;
    rows.push(obj);
  }
  return rows;
}

function saveMeetResult(payload) {
  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName('다음만남일');
  if (!sheet) return { success: false, error: '다음만남일 시트 없음' };
  const headers   = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const resultCol = headers.indexOf('만남결과') + 1;
  if (resultCol < 1) return { success: false, error: '만남결과 컬럼 없음' };
  sheet.getRange(payload.rowIndex, resultCol).setValue(payload.result || '');
  return { success: true };
}

function checkAuth(email) {
  const ss = SpreadsheetApp.openById(SS_ID);
  ensureAuthSheets(ss);
  const sheet = ss.getSheetByName('권한관리');
  const data  = sheet.getDataRange().getValues();
  const headers    = data[0];
  const emailCol   = headers.indexOf('이메일');
  const roleCol    = headers.indexOf('권한');
  const regionsCol = headers.indexOf('지역');
  const approvedCol= headers.indexOf('승인여부');
  for (let i = 1; i < data.length; i++) {
    if (data[i][emailCol] === email) {
      const approved = data[i][approvedCol] === 'Y';
      if (!approved) return { approved: false, pending: true };
      return { approved: true, role: data[i][roleCol]||'region', regions: (data[i][regionsCol]||'').split(',').map(r=>r.trim()).filter(Boolean) };
    }
  }
  const reqSheet    = ss.getSheetByName('접근요청');
  const reqData     = reqSheet.getDataRange().getValues();
  const reqEmailCol = reqData[0].indexOf('이메일');
  const reqDoneCol  = reqData[0].indexOf('처리여부');
  for (let i = 1; i < reqData.length; i++) {
    if (reqData[i][reqEmailCol] === email && !reqData[i][reqDoneCol]) return { approved: false, pending: true };
  }
  return { approved: false, pending: false };
}

function requestAccess(payload) {
  const ss = SpreadsheetApp.openById(SS_ID);
  ensureAuthSheets(ss);
  const sheet = ss.getSheetByName('접근요청');
  const now   = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  sheet.appendRow([now, payload.email, payload.name, payload.mission, payload.region, payload.reason||'', '']);
  return { success: true };
}

function approveUser(payload) {
  const ss = SpreadsheetApp.openById(SS_ID);
  ensureAuthSheets(ss);
  const sheet   = ss.getSheetByName('권한관리');
  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const emailCol= headers.indexOf('이메일');
  const regions = Array.isArray(payload.regions) ? payload.regions.join(',') : (payload.regions||'');
  let found = -1;
  for (let i = 1; i < data.length; i++) { if (data[i][emailCol]===payload.email) { found=i+1; break; } }
  if (found > 0) {
    sheet.getRange(found, headers.indexOf('이름')+1).setValue(payload.name||'');
    sheet.getRange(found, headers.indexOf('권한')+1).setValue(payload.role||'region');
    sheet.getRange(found, headers.indexOf('지역')+1).setValue(regions);
    sheet.getRange(found, headers.indexOf('승인여부')+1).setValue('Y');
  } else {
    sheet.appendRow([payload.email, payload.name||'', payload.role||'region', regions, 'Y']);
  }
  const reqSheet    = ss.getSheetByName('접근요청');
  const reqData     = reqSheet.getDataRange().getValues();
  const reqEmailCol = reqData[0].indexOf('이메일');
  const reqDoneCol  = reqData[0].indexOf('처리여부');
  for (let i = 1; i < reqData.length; i++) {
    if (reqData[i][reqEmailCol]===payload.email) reqSheet.getRange(i+1, reqDoneCol+1).setValue('승인');
  }
  return { success: true };
}

function rejectRequest(payload) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const reqSheet    = ss.getSheetByName('접근요청');
  if (!reqSheet) return { success: false };
  const reqData     = reqSheet.getDataRange().getValues();
  const reqEmailCol = reqData[0].indexOf('이메일');
  const reqDoneCol  = reqData[0].indexOf('처리여부');
  for (let i = 1; i < reqData.length; i++) {
    if (reqData[i][reqEmailCol]===payload.email) reqSheet.getRange(i+1, reqDoneCol+1).setValue('거부');
  }
  return { success: true };
}

function deleteUser(payload) {
  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName('권한관리');
  if (!sheet) return { success: false };
  const data     = sheet.getDataRange().getValues();
  const emailCol = data[0].indexOf('이메일');
  for (let i = data.length-1; i >= 1; i--) {
    if (data[i][emailCol]===payload.email) { sheet.deleteRow(i+1); break; }
  }
  return { success: true };
}

function getAuthData() {
  const ss = SpreadsheetApp.openById(SS_ID);
  ensureAuthSheets(ss);
  const userSheet   = ss.getSheetByName('권한관리');
  const userData    = userSheet.getDataRange().getValues();
  const userHeaders = userData[0];
  const users = [];
  for (let i = 1; i < userData.length; i++) {
    const row = userData[i];
    if (!row[0]) continue;
    const obj = {};
    userHeaders.forEach((h,j) => { if(h) obj[h]=row[j]; });
    obj.regions = (obj['지역']||'').split(',').map(r=>r.trim()).filter(Boolean);
    obj.email   = obj['이메일'];
    obj.name    = obj['이름'];
    obj.role    = obj['권한'];
    users.push(obj);
  }
  const reqSheet   = ss.getSheetByName('접근요청');
  const reqData    = reqSheet.getDataRange().getValues();
  const reqHeaders = reqData[0];
  const requests   = [];
  for (let i = 1; i < reqData.length; i++) {
    const row = reqData[i];
    if (!row[0]) continue;
    const obj = {};
    reqHeaders.forEach((h,j) => { if(h) obj[h]=row[j]; });
    obj.email       = obj['이메일'];
    obj.name        = obj['이름'];
    obj.mission     = obj['사명'];
    obj.region      = obj['요청지역'];
    obj.reason      = obj['사유'];
    obj.requestedAt = obj['요청일시'] ? String(obj['요청일시']).substring(0,10) : '';
    obj.processed   = !!obj['처리여부'];
    requests.push(obj);
  }
  return { users, requests };
}

function ensureAuthSheets(ss) {
  if (!ss.getSheetByName('권한관리')) {
    const s = ss.insertSheet('권한관리');
    const h = ['이메일','이름','권한','지역','승인여부'];
    s.appendRow(h); s.setFrozenRows(1);
    s.getRange(1,1,1,h.length).setBackground('#1A3A8F').setFontColor('#fff').setFontWeight('bold');
  }
  if (!ss.getSheetByName('접근요청')) {
    const s = ss.insertSheet('접근요청');
    const h = ['요청일시','이메일','이름','사명','요청지역','사유','처리여부'];
    s.appendRow(h); s.setFrozenRows(1);
    s.getRange(1,1,1,h.length).setBackground('#0B6E4F').setFontColor('#fff').setFontWeight('bold');
  }
}

// ═══ DB/찾기 ═══
function ensureDbSheet(ss) {
  if (!ss.getSheetByName(SHEET_DB)) {
    const s = ss.insertSheet(SHEET_DB);
    const h = ['구분','등록일시','실적지역','인도자부서/지역/팀/구역','인도자','교사부서/지역/팀/구역','교사','목표개강(연도/월)','목표센터','섭외자','전화번호','출생연도','성별','사는곳','하는일','종교','신앙년수','섭외유형','2차연결유형','합자체크리스트','따기예정일','따기주간횟수','따기기간','고정요일','따기유형','따기단계','첫수업예정일','섬김이부서/지역/팀/구역','섬김이','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목','복음방총횟수','복음방체크리스트','개강진면접여부','신천지오픈여부','센터수강여부','재입교자여부','다음만남일','다음만남시간','다음만남목적','합자요청여부','합자요청일시','심의요청여부','심의요청일시','심의승인여부','심의승인일시','전송완료여부','전송완료일시','심의단계'];
    s.appendRow(h); s.setFrozenRows(1);
    s.getRange(1,1,1,h.length).setBackground('#1A3A8F').setFontColor('#fff').setFontWeight('bold');
  } else {
    ensureDbColumns(ss);
  }
}

function ensureDbColumns(ss) {
  const sheet = ss.getSheetByName(SHEET_DB);
  if (!sheet) return;
  const existing = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const needed = ['교사부서/지역/팀/구역','교사','합자체크리스트','따기예정일','따기주간횟수','따기기간','고정요일','따기유형','따기단계','첫수업예정일','섬김이부서/지역/팀/구역','섬김이','마팔수강번호','복음방수업방식','첫수업진행일','첫수업과목','복음방총횟수','복음방체크리스트','개강진면접여부','신천지오픈여부','센터수강여부','재입교자여부'];
  needed.forEach(col => {
    if (!existing.includes(col)) {
      const newCol = sheet.getLastColumn() + 1;
      const cell = sheet.getRange(1, newCol);
      cell.setValue(col);
      cell.setBackground('#1A3A8F').setFontColor('#fff').setFontWeight('bold');
      existing.push(col);
    }
  });
}

function readDbFinding(ss) {
  ensureDbSheet(ss);
  const sheet = ss.getSheetByName(SHEET_DB);
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] && !row[2]) continue;
    const obj = {};
    headers.forEach((h, j) => { if (h) obj[h] = _cellVal(row[j] !== undefined ? row[j] : ''); });
    obj['__rowIndex'] = i + 1;
    rows.push(obj);
  }
  return rows;
}

function saveDbFinding(payload) {
  const ss = SpreadsheetApp.openById(SS_ID);
  ensureDbSheet(ss);
  const sheet   = ss.getSheetByName(SHEET_DB);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const now     = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const newRow  = headers.map(h => { if (h==='등록일시') return now; return payload[h]!==undefined?payload[h]:''; });
  sheet.appendRow(newRow);
  return { success: true, dbFindings: readDbFinding(ss) };
}

// ─── 합자 요청 → 텔레그램 전송 (수정: 청년회/ 고정, 편입부서:청년 고정) ───
function requestHapja(payload) {
  const ss = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET_DB);
  if (!sheet) return { success: false, error: 'DB_찾기 시트 없음' };

  const text = `[합자]
실적부서/지역 : 청년회/${payload['실적지역'] || ''}
인도자부서/지역/팀/구역 : ${payload['인도자부서/지역/팀/구역'] || ''}
인도자 : ${payload['인도자'] || ''}

목표개강(연도/월) : ${payload['목표개강(연도/월)'] || ''}
목표센터 : ${payload['목표센터'] || ''}
섭외자 : ${payload['섭외자'] || ''}
출생연도 : ${payload['출생연도'] || ''}
성별 : ${payload['성별'] || ''}
사는곳 : ${payload['사는곳'] || ''}
하는일 : ${payload['하는일'] || ''}
종교 : ${payload['종교'] || ''}
신앙년수 : ${payload['신앙년수'] || ''}
편입부서 : 청년
섭외유형 : ${payload['섭외유형'] || ''}
2차연결유형 : ${payload['2차연결유형'] || ''}
따기예정일 : ${payload['따기예정일'] || ''}
교사부서/지역/팀/구역 : ${payload['교사부서/지역/팀/구역'] || ''}
교사 : ${payload['교사'] || ''}
다음만남일 : ${payload['다음만남일'] || ''}
다음만남시간 : ${payload['다음만남시간'] || ''}
다음만남목적 : ${payload['다음만남목적'] || ''}`;

  const token = getBotToken();
  try {
    const res  = UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ chat_id: TG_CHAT_ID, text: text }),
      muteHttpExceptions: true,
    });
    const data = JSON.parse(res.getContentText());
    if (!data.ok) return { success: false, error: data.description };
    const sheetData    = sheet.getDataRange().getValues();
    const headers      = sheetData[0];
    const rowIndex     = payload['__rowIndex'];
    const hapjaCol     = headers.indexOf('합자요청여부') + 1;
    const hapjaDateCol = headers.indexOf('합자요청일시') + 1;
    const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    if (rowIndex && hapjaCol) {
      sheet.getRange(rowIndex, hapjaCol).setValue('Y');
      sheet.getRange(rowIndex, hapjaDateCol).setValue(now);
    }
    return { success: true };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

function saveOrUpdateDbFinding(payload) {
  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET_DB);
  if (!sheet) return { success: false, error: 'DB_찾기 시트 없음' };
  const allData   = sheet.getDataRange().getValues();
  const headers   = allData[0];
  const now       = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const 구분Col   = headers.indexOf('구분');
  const 지역Col   = headers.indexOf('실적지역');
  const 섭외자Col = headers.indexOf('섭외자');
  const 인도자Col = headers.indexOf('인도자');

  const preservedCols = ['등록일시','합자요청여부','합자요청일시','심의요청여부','심의요청일시','심의승인여부','심의승인일시','전송완료여부','전송완료일시','심의단계'];
  const inputStage = payload['구분'] || '';

  // ── 찾기: 동일 인물 있으면 수정 (단계 무관), 없으면 신규 추가 ──
  if (inputStage === '찾기') {
    for (let i = 1; i < allData.length; i++) {
      const row = allData[i];
      if (row[지역Col]===(payload['실적지역']||'') && row[섭외자Col]===(payload['섭외자']||'') && row[인도자Col]===(payload['인도자']||'')) {
        const findingPreserved = [...preservedCols, '구분']; // 진행 단계 보존
        const newRow = headers.map((h, j) => findingPreserved.includes(h) ? row[j] : (payload[h]!==undefined ? payload[h] : row[j]));
        sheet.getRange(i+1,1,1,headers.length).setValues([newRow]);
        return { success: true, updated: true, dbFindings: readDbFinding(ss) };
      }
    }
    const newRow = headers.map(h => {
      if (h==='등록일시') return now;
      if (preservedCols.includes(h)) return '';
      return payload[h]!==undefined ? payload[h] : '';
    });
    sheet.appendRow(newRow);
    return { success: true, updated: false, dbFindings: readDbFinding(ss) };
  }

  // ── 합자 이상: 기존 인물 찾아서 해당 단계 정보만 추가, 구분(단계)은 보존 ──
  if (inputStage) {
    let sheetRow = payload['__rowIndex'] || 0;
    if (!sheetRow) {
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][지역Col]===(payload['실적지역']||'') && allData[i][섭외자Col]===(payload['섭외자']||'') && allData[i][인도자Col]===(payload['인도자']||'')) {
          sheetRow = i + 1;
          break;
        }
      }
    }
    if (!sheetRow) {
      return {
        success: false,
        notFound: true,
        error: `⚠️ 미보고 데이터가 있습니다. (${inputStage} - ${payload['섭외자']||''})`
      };
    }
    const existingRow = allData[sheetRow - 1];
    const stagePreserved = [...preservedCols, '구분'];
    const newRow = headers.map((h, j) => stagePreserved.includes(h) ? existingRow[j] : (payload[h]!==undefined ? payload[h] : existingRow[j]));
    sheet.getRange(sheetRow,1,1,headers.length).setValues([newRow]);
    return { success: true, updated: true, dbFindings: readDbFinding(ss) };
  }

  // ── 구분 없이 rowIndex로 직접 수정 ──
  if (payload['__rowIndex']) {
    const rowIdx = payload['__rowIndex'];
    const newRow = headers.map((h, j) => preservedCols.includes(h) ? allData[rowIdx-1][j] : (payload[h]!==undefined ? payload[h] : allData[rowIdx-1][j]));
    sheet.getRange(rowIdx,1,1,headers.length).setValues([newRow]);
    return { success: true, updated: true, dbFindings: readDbFinding(ss) };
  }

  // ── 구분/rowIndex 없으면 신규 추가 ──
  const newRow = headers.map(h => {
    if (h==='등록일시') return now;
    if (preservedCols.includes(h)) return '';
    return payload[h]!==undefined ? payload[h] : '';
  });
  sheet.appendRow(newRow);
  return { success: true, updated: false, dbFindings: readDbFinding(ss) };
}

// ═══ 심의 시스템 ═══
function requestReview(payload) {
  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET_DB);
  if (!sheet) return { success: false, error: 'DB_찾기 시트 없음' };
  const headers  = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const rowIndex = payload['__rowIndex'];
  const now      = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const setCol   = (col, val) => { const idx=headers.indexOf(col)+1; if(idx>0) sheet.getRange(rowIndex,idx).setValue(val); };
  setCol('심의요청여부', 'Y');
  setCol('심의요청일시', now);
  setCol('심의단계', payload['심의단계']||'');
  setCol('심의승인여부', '');
  setCol('전송완료여부', '');
  return { success: true, dbFindings: readDbFinding(ss) };
}

function approveReview(payload) {
  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET_DB);
  if (!sheet) return { success: false, error: 'DB_찾기 시트 없음' };
  const headers  = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const rowIndex = payload['rowIndex'];
  const now      = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  const setCol   = (col, val) => { const idx=headers.indexOf(col)+1; if(idx>0) sheet.getRange(rowIndex,idx).setValue(val); };
  setCol('심의승인여부', 'Y');
  setCol('심의승인일시', now);
  setCol('심의단계', payload['stage']||'');
  return { success: true, dbFindings: readDbFinding(ss) };
}

function sendReviewTelegram(payload) {
  const stage = payload['심의단계'] || '';
  const text  = buildReviewText(stage, payload);
  const token = getBotToken();
  try {
    const res  = UrlFetchApp.fetch('https://api.telegram.org/bot'+token+'/sendMessage', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ chat_id: REVIEW_CHAT_ID, text: text }),
      muteHttpExceptions: true,
    });
    const data = JSON.parse(res.getContentText());
    if (!data.ok) return { success: false, error: data.description };
    const ss    = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(SHEET_DB);
    if (sheet) {
      const headers  = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
      const rowIndex = payload['__rowIndex'];
      const now      = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
      const setCol   = (col, val) => { const idx=headers.indexOf(col)+1; if(idx>0) sheet.getRange(rowIndex,idx).setValue(val); };
      setCol('전송완료여부', 'Y');
      setCol('전송완료일시', now);

      // 10분 후 심의 컬럼 초기화 예약
      scheduleReviewReset(rowIndex);
    }
    return { success: true, dbFindings: readDbFinding(SpreadsheetApp.openById(SS_ID)) };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// ─── 합자체크리스트 인코딩 (Y=예, N=아니오, -=미체크, 10자리 고정) ───
const _HC_ORDER = ['h_in_1','h_in_2','h_in_3','h_sp_1','h_sp_2','h_sp_3','h_ev_1','h_ev_2','h_ev_3','h_ev_4'];
const _HC_LABELS = {
  h_in_1: '정신질환 관련 약을 복용중이지 않은가? (우울증, 공황장애, ADHD, 조울증)',
  h_in_2: '만남에 특정 목적을 띄고 있지 않은가? (이성, 다단계, 보험권유 등)',
  h_in_3: '부모에게 지나치게 의존적이지 않는가? (통금, 외출 제약 등)',
  h_sp_1: '신의 존재(보이지 않는 존재)를 부정하지않고 믿거나 있기를 소망하는가?',
  h_sp_2: '신천지에 대한 직·간접적인 부정적인 경험이 없는가?',
  h_sp_3: '현재 다니는 교회에서 사역 혹은 봉사활동 여부가 파악되었는가?',
  h_ev_1: '사는 곳이 센터와 1시간 이내 거리인가?',
  h_ev_2: '타 지역 중복 섭외 이력을 확인하였는가?',
  h_ev_3: '주 3회 대면 센터수강 시간이 가능한가?(평일 10시, 19시반)',
  h_ev_4: '센터기간(6개월) 내에 2주 이상의 센터수강 불가 일정이 없는가?',
};
const _HC_SECTIONS = [
  { label: '인성', codes: ['h_in_1','h_in_2','h_in_3'] },
  { label: '신성', codes: ['h_sp_1','h_sp_2','h_sp_3'] },
  { label: '환경', codes: ['h_ev_1','h_ev_2','h_ev_3','h_ev_4'] },
];

function _hcEncode(map) {
  return _HC_ORDER.map(function(code) {
    var v = map[code];
    return v === '예' ? 'Y' : v === '아니오' ? 'N' : '-';
  }).join('');
}
function _hcDecode(str) {
  var map = {};
  _HC_ORDER.forEach(function(code, i) {
    var c = (str || '')[i];
    if (c === 'Y') map[code] = '예';
    else if (c === 'N') map[code] = '아니오';
  });
  return map;
}
function _buildHcText(str) {
  if (!str || str.replace(/-/g, '') === '') return '';
  var map = _hcDecode(str);
  var lines = ['합자체크리스트 체크'];
  _HC_SECTIONS.forEach(function(sec) {
    lines.push('[' + sec.label + ']');
    sec.codes.forEach(function(code) {
      var ans  = map[code];
      var mark = ans === '예' ? '✅' : ans === '아니오' ? '❌' : '○';
      lines.push(mark + ' ' + _HC_LABELS[code]);
    });
  });
  return lines.join('\n');
}

function buildReviewText(stage, r) {
  function fmtD(val) {
    if (!val) return '';
    const s = String(val);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return parseInt(m[2]) + '/' + parseInt(m[3]);
    return s;
  }
  function fmtT(val) {
    if (!val) return '';
    const s = String(val);
    const m = s.match(/T(\d{2}):(\d{2})/);
    if (m) return m[1] + ':' + m[2];
    return s;
  }

  const v  = key => r[key] || '';
  const vd = key => fmtD(r[key]);
  const vt = key => fmtT(r[key]);
  const loc = '청년회/' + v('실적지역');

  if (stage === '찾기') {
    const hcText = _buildHcText(v('합자체크리스트'));
    return `[찾기]
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
ㄴ대학생(학교/학과) : ${v('대학생_학교학과')}
ㄴ직장인(야근 유무) : ${v('직장인_야근유무')}
종교 : ${v('종교')}
신앙년수 : ${v('신앙년수')}
섭외유형 : ${v('섭외유형')}
2차연결유형 : ${v('2차연결유형')}
다음만남일 : ${vd('다음만남일')}
다음만남시간 : ${vt('다음만남시간')}
다음만남목적 : ${v('다음만남목적')}${hcText ? '\n\n' + hcText : ''}`;
  }

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
다음만남시간 : ${vt('다음만남시간')}
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
다음만남시간 : ${vt('다음만남시간')}
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
다음만남시간 : ${vt('다음만남시간')}
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
다음만남시간 : ${vt('다음만남시간')}
다음만남목적 : ${v('다음만남목적')}`;

  if (stage === '지역장') return `[지역장]
실적부서/지역 : ${loc}
인도자부서/지역/팀/구역 : ${v('인도자부서/지역/팀/구역')}
인도자 : ${v('인도자')}
교사부서/지역/팀/구역 : ${v('교사부서/지역/팀/구역')}
교사 : ${v('교사')}
섭외자 : ${v('섭외자')}
다음만남일 : ${vd('다음만남일')}
다음만남시간 : ${vt('다음만남시간')}
다음만남목적 : ${v('다음만남목적')}

복음방총횟수 : ${v('복음방총횟수')}
복음방체크리스트 : ${v('복음방체크리스트')}
개강진면접여부 : ${v('개강진면접여부')}
신천지오픈여부 : ${v('신천지오픈여부')}
센터수강여부 : ${v('센터수강여부')}
재입교자여부 : ${v('재입교자여부')}`;

  return `[${stage}]\n섭외자: ${v('섭외자')}\n지역: ${loc}`;
}

// ═══════════════════════════════════════════════════════
//  전송대기 시스템 (탈락/이월 → 전송대기 탭 저장 → 텔레그램)
// ═══════════════════════════════════════════════════════

const SHEET_QUEUE = '전송대기';

function ensureQueueSheet(ss) {
  if (!ss.getSheetByName(SHEET_QUEUE)) {
    const s = ss.insertSheet(SHEET_QUEUE);
    const h = ['전송유형','단계','섭외자','인도자','실적지역','텍스트내용','전송상태','등록일시','전송일시'];
    s.appendRow(h); s.setFrozenRows(1);
    s.getRange(1,1,1,h.length).setBackground('#1A3A8F').setFontColor('#fff').setFontWeight('bold');
  }
}

// ─── 전송대기 저장 ───
function addToQueue(type, stage, data, text) {
  const ss    = SpreadsheetApp.openById(SS_ID);
  ensureQueueSheet(ss);
  const sheet = ss.getSheetByName(SHEET_QUEUE);
  const now   = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  sheet.appendRow([type, stage, data['섭외자']||'', data['인도자']||'', data['실적지역']||'', text, '대기', now, '']);
}

// ─── 탈락 처리 ───
function requestTallag(payload) {
  const stage    = payload['단계'] || '';
  const text     = buildTallagText(payload);

  // 전송대기 탭에 저장
  addToQueue('탈락', stage, payload, text);

  // 찾기 단계는 행정보고창 전송 안 함
  if (stage === '찾기') return { success: true };

  // 텔레그램 전송
  const token = getBotToken();
  try {
    const res  = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ chat_id: REVIEW_CHAT_ID, text: text }),
      muteHttpExceptions: true,
    });
    const data = JSON.parse(res.getContentText());

    // 전송상태 업데이트
    const ss    = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(SHEET_QUEUE);
    const last  = sheet.getLastRow();
    const now   = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    if (data.ok) {
      sheet.getRange(last, 7).setValue('전송완료');
      sheet.getRange(last, 9).setValue(now);
    } else {
      sheet.getRange(last, 7).setValue('전송실패: ' + data.description);
    }

    return { success: data.ok, error: data.ok ? null : data.description };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// ─── 이월 처리 ───
function requestIwol(payload) {
  const stage = payload['단계'] || '';
  const text  = buildIwolText(payload);

  addToQueue('이월', stage, payload, text);

  // 찾기 단계는 행정보고창 전송 안 함
  if (stage === '찾기') return { success: true };

  const token = getBotToken();
  try {
    const res  = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ chat_id: REVIEW_CHAT_ID, text: text }),
      muteHttpExceptions: true,
    });
    const data = JSON.parse(res.getContentText());

    const ss    = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(SHEET_QUEUE);
    const last  = sheet.getLastRow();
    const now   = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    if (data.ok) {
      sheet.getRange(last, 7).setValue('전송완료');
      sheet.getRange(last, 9).setValue(now);
    } else {
      sheet.getRange(last, 7).setValue('전송실패: ' + data.description);
    }

    return { success: data.ok, error: data.ok ? null : data.description };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// ─── 탈락 텍스트 ───
function buildTallagText(r) {
  const v = key => r[key] || '';
  return `[탈락]
실적부서/지역 : 청년회/${v('실적지역')}
인도자부서/지역/팀/구역 : ${v('인도자부서/지역/팀/구역')}
인도자 : ${v('인도자')}
섭외자 : ${v('섭외자')}

탈락사유 : ${v('탈락사유')}`;
}

// ─── 이월 텍스트 ───
function buildIwolText(r) {
  const v = key => r[key] || '';
  return `[이월]
실적부서/지역 : 청년회/${v('실적지역')}
인도자부서/지역/팀/구역 : ${v('인도자부서/지역/팀/구역')}
인도자 : ${v('인도자')}
섭외자 : ${v('섭외자')}
목표개강(연도/월) : ${v('목표개강(연도/월)')}
이월 사유 : ${v('이월사유')}
이월 목표개강(연도/월) : ${v('이월목표개강')}
이월 목표센터 : ${v('이월목표센터')}`;
}

// ─── 수정 보고 ───
function requestEdit(payload) {
  const stage = payload['단계'] || '';
  const text  = buildReviewText(stage, payload);

  addToQueue('수정', stage, payload, text);

  const token = getBotToken();
  try {
    // 행정보고창 수정요청 주제 전송
    const res1 = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ chat_id: REVIEW_CHAT_ID, message_thread_id: REVIEW_EDIT_THREAD_ID, text: text }),
      muteHttpExceptions: true,
    });
    const data1 = JSON.parse(res1.getContentText());

    // 지파보고창 수정요청 주제 전송
    const res2 = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ chat_id: EDIT_CHAT_ID, message_thread_id: EDIT_THREAD_ID, text: text }),
      muteHttpExceptions: true,
    });
    const data2 = JSON.parse(res2.getContentText());

    const ss    = SpreadsheetApp.openById(SS_ID);
    const sheet = ss.getSheetByName(SHEET_QUEUE);
    const last  = sheet.getLastRow();
    const now   = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    const ok    = data1.ok || data2.ok;
    if (ok) {
      sheet.getRange(last, 7).setValue('전송완료');
      sheet.getRange(last, 9).setValue(now);
    } else {
      sheet.getRange(last, 7).setValue('전송실패: ' + (data1.description || data2.description));
    }

    const errors = [!data1.ok && data1.description, !data2.ok && data2.description].filter(Boolean);
    return { success: ok, error: errors.length ? errors.join(' / ') : null };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════
//  심의 완료 후 10분 뒤 자동 초기화 트리거
// ═══════════════════════════════════════════════════════

// 승인 완료 시 10분 후 초기화 트리거 등록
function scheduleReviewReset(rowIndex) {
  // 스크립트 속성에 초기화 대상 저장
  const props = PropertiesService.getScriptProperties();
  const key   = 'reset_' + rowIndex;
  const resetAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  props.setProperty(key, resetAt);

  // 1분마다 체크 트리거 (이미 있으면 스킵)
  const triggers = ScriptApp.getProjectTriggers();
  const exists   = triggers.some(t => t.getHandlerFunction() === 'checkReviewReset');
  if (!exists) {
    ScriptApp.newTrigger('checkReviewReset').timeBased().everyMinutes(1).create();
  }
}

// 1분마다 실행 — 10분 지난 항목 초기화
function checkReviewReset() {
  const props = PropertiesService.getScriptProperties();
  const all   = props.getProperties();
  const now   = new Date();

  const ss    = SpreadsheetApp.openById(SS_ID);
  const sheet = ss.getSheetByName(SHEET_DB);
  if (!sheet) return;

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  Object.entries(all).forEach(([key, val]) => {
    if (!key.startsWith('reset_')) return;
    const resetAt = new Date(val);
    if (now < resetAt) return; // 아직 안 됨

    const rowIndex = parseInt(key.replace('reset_', ''));
    Logger.log('심의 초기화: 행 ' + rowIndex);

    const setCol = (colName, v) => {
      const idx = headers.indexOf(colName) + 1;
      if (idx > 0) sheet.getRange(rowIndex, idx).setValue(v);
    };

    setCol('심의요청여부', '');
    setCol('심의요청일시', '');
    setCol('심의승인여부', '');
    setCol('심의승인일시', '');
    setCol('전송완료여부', '');
    setCol('전송완료일시', '');
    setCol('심의단계', '');

    props.deleteProperty(key);
  });
}

// ─── 대시보드 이미지 + 텍스트 텔레그램 전송 ───
function sendDashPhoto(payload) {
  const token    = getBotToken();
  const imgBytes = Utilities.base64Decode(payload.base64);
  const blob     = Utilities.newBlob(imgBytes, 'image/jpeg', 'dashboard.jpg');
  try {
    const res = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendPhoto', {
      method: 'post',
      payload: {
        chat_id:           REVIEW_CHAT_ID,
        message_thread_id: DASH_THREAD_ID,
        photo:             blob,
        caption:           (payload.caption || '').substring(0, 1024),
      },
      muteHttpExceptions: true,
    });
    const data = JSON.parse(res.getContentText());
    return { success: data.ok, error: data.ok ? null : data.description };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// ─── 대시보드 텍스트 텔레그램 전송 ───
function sendDashTelegram(payload) {
  const token = getBotToken();
  try {
    const res  = UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
      method: 'post', contentType: 'application/json',
      payload: JSON.stringify({ chat_id: REVIEW_CHAT_ID, text: payload.text }),
      muteHttpExceptions: true,
    });
    const data = JSON.parse(res.getContentText());
    return { success: data.ok, error: data.ok ? null : data.description };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// ═══════════════════════════════════════════════════════
//  인물 체크리스트 (합자체크리스트/따기체크리스트/센터확정체크리스트)
// ═══════════════════════════════════════════════════════

const SHEET_PCLIST = '인물체크리스트';

function ensurePersonChecklistSheet(ss) {
  if (!ss.getSheetByName(SHEET_PCLIST)) {
    const s = ss.insertSheet(SHEET_PCLIST);
    const h = ['실적지역','섭외자','인도자','체크종류','항목코드','예아니오','체크자','체크일시'];
    s.appendRow(h); s.setFrozenRows(1);
    s.getRange(1,1,1,h.length).setBackground('#1A3A8F').setFontColor('#fff').setFontWeight('bold');
  }
}

function getPersonChecklist(payload) {
  const ss = SpreadsheetApp.openById(SS_ID);
  ensurePersonChecklistSheet(ss);
  const sheet   = ss.getSheetByName(SHEET_PCLIST);
  const data    = sheet.getDataRange().getValues();
  if (data.length < 2) return { success: true, items: [] };
  const headers  = data[0];
  const 지역Col  = headers.indexOf('실적지역');
  const 섭외자Col = headers.indexOf('섭외자');
  const 인도자Col = headers.indexOf('인도자');
  const items = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[지역Col]===(payload['실적지역']||'') &&
        row[섭외자Col]===(payload['섭외자']||'') &&
        row[인도자Col]===(payload['인도자']||'')) {
      const obj = {};
      headers.forEach((h, j) => { if (h) obj[h] = row[j]; });
      items.push(obj);
    }
  }
  return { success: true, items };
}

function savePersonChecklistItem(payload) {
  const ss = SpreadsheetApp.openById(SS_ID);

  // 합자체크리스트는 DB_찾기 행에 직접 저장 (별도 시트 불필요)
  if (payload['체크종류'] === '합자체크리스트') {
    ensureDbSheet(ss);
    const dbSheet  = ss.getSheetByName(SHEET_DB);
    const dbData   = dbSheet.getDataRange().getValues();
    const dbH      = dbData[0];
    const 지역Col  = dbH.indexOf('실적지역');
    const 섭외자Col = dbH.indexOf('섭외자');
    const 인도자Col = dbH.indexOf('인도자');
    const hcCol    = dbH.indexOf('합자체크리스트');
    if (hcCol < 0) return { success: false, error: '합자체크리스트 컬럼 없음' };
    for (let i = 1; i < dbData.length; i++) {
      const row = dbData[i];
      if (String(row[지역Col]) === (payload['실적지역']||'') &&
          String(row[섭외자Col]) === (payload['섭외자']||'') &&
          String(row[인도자Col]) === (payload['인도자']||'')) {
        const cur = String(row[hcCol] || '').padEnd(10, '-').split('');
        const pos = _HC_ORDER.indexOf(payload['항목코드']||'');
        if (pos >= 0) {
          const v = payload['예아니오'];
          cur[pos] = v === '예' ? 'Y' : v === '아니오' ? 'N' : '-';
          dbSheet.getRange(i + 1, hcCol + 1).setValue(cur.join(''));
        }
        return { success: true };
      }
    }
    return { success: false, error: '해당 인물 없음' };
  }

  // 따기체크리스트/센터확정체크리스트는 기존 인물체크리스트 시트 사용
  ensurePersonChecklistSheet(ss);
  const sheet   = ss.getSheetByName(SHEET_PCLIST);
  const data    = sheet.getDataRange().getValues();
  const headers  = data[0];
  const 지역Col  = headers.indexOf('실적지역');
  const 섭외자Col = headers.indexOf('섭외자');
  const 인도자Col = headers.indexOf('인도자');
  const 종류Col  = headers.indexOf('체크종류');
  const 코드Col  = headers.indexOf('항목코드');
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[지역Col]===(payload['실적지역']||'') &&
        row[섭외자Col]===(payload['섭외자']||'') &&
        row[인도자Col]===(payload['인도자']||'') &&
        row[종류Col]===(payload['체크종류']||'') &&
        row[코드Col]===(payload['항목코드']||'')) {
      sheet.getRange(i+1,1,1,headers.length).setValues([headers.map((h,j) => {
        if (h==='예아니오') return payload['예아니오']||'';
        if (h==='체크자')   return payload['체크자']||'';
        if (h==='체크일시') return now;
        return row[j];
      })]);
      return { success: true };
    }
  }
  sheet.appendRow(headers.map(h => {
    if (h==='실적지역') return payload['실적지역']||'';
    if (h==='섭외자')   return payload['섭외자']||'';
    if (h==='인도자')   return payload['인도자']||'';
    if (h==='체크종류') return payload['체크종류']||'';
    if (h==='항목코드') return payload['항목코드']||'';
    if (h==='예아니오') return payload['예아니오']||'';
    if (h==='체크자')   return payload['체크자']||'';
    if (h==='체크일시') return now;
    return '';
  }));
  return { success: true };
}

// 트리거 설정 (최초 1회 실행)
function setupReviewResetTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const exists   = triggers.some(t => t.getHandlerFunction() === 'checkReviewReset');
  if (!exists) {
    ScriptApp.newTrigger('checkReviewReset').timeBased().everyMinutes(1).create();
    Logger.log('checkReviewReset 트리거 등록 완료');
  } else {
    Logger.log('이미 등록됨');
  }
}

