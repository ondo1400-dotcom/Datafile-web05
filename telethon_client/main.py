#!/usr/bin/env python3
"""
Telethon 사용자 계정 클라이언트
봇과 동일하게 [DB] / [찾기] 메시지를 읽어 Google Sheets에 저장합니다.
"""

import asyncio
import os
import re
from datetime import datetime

import gspread
import pytz
from dotenv import load_dotenv
from google.oauth2.service_account import Credentials
from telethon import TelegramClient, events

load_dotenv()

# ── Telegram 설정 ─────────────────────────────────────────
API_ID     = int(os.environ['TG_API_ID'])
API_HASH   = os.environ['TG_API_HASH']
PHONE      = os.environ['TG_PHONE']
DB_CHAT_ID  = int(os.environ.get('DB_CHAT_ID',  '-1003828748700'))  # 찾기/DB 보고창
ADM_CHAT_ID = int(os.environ.get('ADM_CHAT_ID', '-1003943121521'))  # 행정보고용창
JD_CHAT_ID  = int(os.environ.get('JD_CHAT_ID',  '-1003983618752'))  # 전도비서창

# ── Google Sheets 설정 ────────────────────────────────────
SS_ID      = os.environ.get('SS_ID', '1T7lt0ZZ2JpQPD26ft9CAnslhxO-7a9Lk1ZF7rzX_624')
SHEET_NAME = os.environ.get('SHEET_NAME', 'DB_찾기')
SA_FILE    = os.environ.get('SA_FILE', 'service_account.json')

KST = pytz.timezone('Asia/Seoul')

# ── Google Sheets 연결 ────────────────────────────────────
SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
_creds = Credentials.from_service_account_file(SA_FILE, scopes=SCOPES)
gc     = gspread.authorize(_creds)

# ── Telethon 클라이언트 ───────────────────────────────────
client = TelegramClient('user_session', API_ID, API_HASH)


def get_sheet():
    ss = gc.open_by_key(SS_ID)
    return ss.worksheet(SHEET_NAME)


def parse_form(text: str, type_: str) -> dict | None:
    """[DB] / [찾기] 양식 텍스트 파싱 — GAS parseForm() 과 동일 로직"""
    lines = text.split('\n')
    data  = {'구분': type_}

    for line in lines:
        if ' : ' not in line:
            continue
        sep = line.index(' : ')
        key = line[:sep].strip()
        val = line[sep + 3:].strip()
        if not key or key.startswith('['):
            continue
        if re.fullmatch(r'\(.*\)', val):
            val = ''
        data[key] = val

    if not data.get('실적지역') or not data.get('섭외자'):
        return None
    return data


def save_or_update_sheet(data: dict) -> bool:
    """
    GAS saveOrUpdateSheet() 와 동일 로직.
    반환값: True = 업데이트, False = 새로 추가
    """
    sheet    = get_sheet()
    all_vals = sheet.get_all_values()
    if not all_vals:
        return False

    headers = all_vals[0]
    now     = datetime.now(KST).strftime('%Y. %m. %d. %p %I:%M:%S')

    def col(name: str) -> int:
        return headers.index(name) if name in headers else -1

    구분_c   = col('구분')
    지역_c   = col('실적지역')
    섭외자_c = col('섭외자')
    인도자_c = col('인도자')

    # ─ 찾기: 중복 체크 후 업데이트
    if data['구분'] == '찾기' and all(c >= 0 for c in [구분_c, 지역_c, 섭외자_c, 인도자_c]):
        for i, row in enumerate(all_vals[1:], start=2):  # 시트 행 번호 (헤더=1)
            def get(c):
                return row[c] if c < len(row) else ''

            if (get(구분_c)   == '찾기'
                    and get(지역_c)   == (data.get('실적지역') or '')
                    and get(섭외자_c) == (data.get('섭외자')   or '')
                    and get(인도자_c) == (data.get('인도자')   or '')):

                new_row = []
                for j, h in enumerate(headers):
                    if h in ('등록일시', '합자요청여부', '합자요청일시'):
                        new_row.append(row[j] if j < len(row) else '')
                    else:
                        new_row.append(data.get(h, row[j] if j < len(row) else ''))

                sheet.update(f'A{i}', [new_row])
                return True  # 업데이트

    # ─ 새로 추가
    new_row = []
    for h in headers:
        if h == '등록일시':
            new_row.append(now)
        elif h in ('합자요청여부', '합자요청일시'):
            new_row.append('')
        else:
            new_row.append(data.get(h, ''))

    sheet.append_row(new_row, value_input_option='USER_ENTERED')
    return False  # 새로 추가


@client.on(events.NewMessage(chats=ADM_CHAT_ID))
async def forward_reports(event):
    text = event.message.text
    if not text:
        return
        
    text = text.strip()
    print(f'[행정보고용창] 메시지 수신: {text[:50]}')
    
    # 전달할 단계별 키워드 목록 
    keywords = ('[합자]', '[육따기]', '[영따기]', '[복음방]', '[탈락]', '[이월]')
    
    # 메시지가 위 키워드 중 하나로 시작하는지 검사
    if not text.startswith(keywords):
        return
        
    # 터미널 창에 어떤 종류의 메시지인지 출력
    matched_keyword = next((kw for kw in keywords if text.startswith(kw)), "[알수없음]")
    
    print(f'{matched_keyword} 감지 → 전도비서창으로 전달 중...')
    await client.send_message(JD_CHAT_ID, text)
    print(f'{matched_keyword} 전달 완료')


@client.on(events.NewMessage(chats=DB_CHAT_ID))
async def on_message(event):
    text = event.message.text
    if not text:
        return
    text = text.strip()

    if text.startswith('[DB]'):
        parsed = parse_form(text, 'DB')
        if parsed:
            await asyncio.to_thread(save_or_update_sheet, parsed)
            await event.reply(
                '✅ DB - ' + (parsed.get('섭외자') or '—') +
                ' - 정상적으로 기록되었습니다.\n지역: ' + (parsed.get('실적지역') or '—')
            )
        else:
            await event.reply('⚠️ DB 양식을 확인해주세요.\n실적지역과 섭외자는 필수입니다.')

    elif text.startswith('[찾기]'):
        parsed = parse_form(text, '찾기')
        if parsed:
            is_update = await asyncio.to_thread(save_or_update_sheet, parsed)
            await event.reply(
                ('🔄 찾기 수정' if is_update else '✅ 찾기 등록') +
                ' - ' + (parsed.get('섭외자') or '—') +
                ' - 정상적으로 기록되었습니다.\n지역: ' +
                (parsed.get('실적지역') or '—') +
                ' | 인도자: ' + (parsed.get('인도자') or '—')
            )
        else:
            await event.reply('⚠️ 찾기 양식을 확인해주세요.\n실적지역과 섭외자는 필수입니다.')


async def main():
    await client.start(phone=PHONE)
    me = await client.get_me()
    print(f'[Telethon] 로그인: {me.first_name} (@{me.username})')
    print(f'[Telethon] 감시 채팅: {DB_CHAT_ID}')
    print('[Telethon] 대기 중 — Ctrl+C 로 종료')
    await client.run_until_disconnected()


if __name__ == '__main__':
    asyncio.run(main())
