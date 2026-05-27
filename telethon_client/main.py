#!/usr/bin/env python3
"""
Telethon 사용자 계정 클라이언트
[DB] / [찾기] 메시지를 읽어 Supabase db_findings 테이블에 저장합니다.
"""

import asyncio
import os
import re
from datetime import datetime

import pytz
from dotenv import load_dotenv
from supabase import create_client
from telethon import TelegramClient, events
from telethon.tl.types import InputReplyToMessage

load_dotenv()

# ── Telegram 설정 ─────────────────────────────────────────
API_ID      = int(os.environ['TG_API_ID'])
API_HASH    = os.environ['TG_API_HASH']
PHONE       = os.environ['TG_PHONE']
DB_CHAT_ID  = int(os.environ.get('DB_CHAT_ID',  '-1003828748700'))  # 찾기/DB 보고창
ADM_CHAT_ID = int(os.environ.get('ADM_CHAT_ID', '-1003943121521'))  # 행정보고용창
JD_CHAT_ID  = int(os.environ.get('JD_CHAT_ID',  '-1003983618752'))  # 전도비서창

FORWARD_TAGS = ['[찾기]', '[합자]', '[육따기]', '[따기]', '[복음방]', '[탈락]', '[이월]', '[지역장]']

SUJUNG_TOPIC_ADM = 104
SUJUNG_TOPIC_JD  = 53

# ── Supabase 설정 ─────────────────────────────────────────
SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY']
supa = create_client(SUPABASE_URL, SUPABASE_KEY)

KST    = pytz.timezone('Asia/Seoul')
client = TelegramClient('user_session', API_ID, API_HASH)


def parse_form(text: str, type_: str) -> dict | None:
    """[DB] / [찾기] 양식 텍스트 파싱"""
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


def save_to_supabase(data: dict) -> bool:
    """
    db_findings 테이블에 upsert.
    반환값: True = 기존 행 업데이트, False = 새로 삽입
    """
    region = data.get('실적지역', '')
    person = data.get('섭외자', '')
    guide  = data.get('인도자', '')

    res = supa.table('db_findings') \
        .select('id') \
        .eq('실적지역', region) \
        .eq('섭외자', person) \
        .eq('인도자', guide) \
        .maybe_single() \
        .execute()

    is_update = bool(res.data)

    if not is_update:
        data['등록일시'] = datetime.now(KST).isoformat()

    supa.table('db_findings').upsert(
        data,
        on_conflict='실적지역,섭외자,인도자'
    ).execute()

    return is_update


@client.on(events.NewMessage(chats=ADM_CHAT_ID))
async def forward_to_jd(event):
    """행정보고창 메시지를 전도비서창으로 전달"""
    text = event.message.text
    if not text:
        return
    text = text.strip()
    print(f'[행정보고용창] 메시지 수신: {text}')

    reply_to = event.message.reply_to
    top_id = getattr(reply_to, 'reply_to_top_id', None) or getattr(reply_to, 'reply_to_msg_id', None)
    if top_id == SUJUNG_TOPIC_ADM:
        await client.send_message(JD_CHAT_ID, text, reply_to=InputReplyToMessage(reply_to_msg_id=SUJUNG_TOPIC_JD, top_msg_id=SUJUNG_TOPIC_JD))
        print('[수정요청] 지파전도비서창으로 전달 완료')
        return

    matched_tag = next((tag for tag in FORWARD_TAGS if text.startswith(tag)), None)
    if not matched_tag:
        return

    print(f'{matched_tag} 감지 → 전도비서창으로 전달 중...')
    await client.send_message(JD_CHAT_ID, text)
    print(f'{matched_tag} 전달 완료')

    # [합자] 메시지면 db_findings에 합자요청여부=Y 업데이트
    if matched_tag == '[합자]':
        parsed = parse_form(text, '합자')
        if parsed and parsed.get('실적지역') and parsed.get('섭외자'):
            now = datetime.now(KST).isoformat()
            await asyncio.to_thread(
                lambda: supa.table('db_findings')
                    .update({'합자요청여부': 'Y', '합자요청일시': now})
                    .eq('실적지역', parsed['실적지역'])
                    .eq('섭외자',   parsed['섭외자'])
                    .eq('인도자',   parsed.get('인도자', ''))
                    .execute()
            )
            print(f'[합자] db_findings 합자요청여부=Y 업데이트: {parsed["섭외자"]}')


@client.on(events.NewMessage(chats=DB_CHAT_ID))
async def on_message(event):
    """DB_찾기 보고창 메시지 처리 → Supabase 저장"""
    text = event.message.text
    if not text:
        return
    text = text.strip()

    if text.startswith('[DB]'):
        parsed = parse_form(text, 'DB')
        if parsed:
            await asyncio.to_thread(save_to_supabase, parsed)
            await event.reply(
                '✅ DB - ' + (parsed.get('섭외자') or '—') +
                ' - 정상적으로 기록되었습니다.\n지역: ' + (parsed.get('실적지역') or '—')
            )
        else:
            await event.reply('⚠️ DB 양식을 확인해주세요.\n실적지역과 섭외자는 필수입니다.')

    elif text.startswith('[찾기]'):
        parsed = parse_form(text, '찾기')
        if parsed:
            is_update = await asyncio.to_thread(save_to_supabase, parsed)
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
    print(f'[Telethon] DB보고창 감시: {DB_CHAT_ID}')
    print(f'[Telethon] 행정보고창 감시: {ADM_CHAT_ID}')
    print(f'[Telethon] 전달 태그: {FORWARD_TAGS}')
    print('[Telethon] 대기 중 — Ctrl+C 로 종료')
    await client.run_until_disconnected()


if __name__ == '__main__':
    asyncio.run(main())
