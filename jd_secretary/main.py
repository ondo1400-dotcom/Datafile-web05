#!/usr/bin/env python3
"""
jd-secretary 텔레그램 봇
[정보 업데이트] 메시지 수신 → Supabase db_findings 업데이트 → 행정보고창 수정요청 주제 전송
"""

import logging
import os
import re

from dotenv import load_dotenv
from supabase import create_client
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, MessageHandler, filters

load_dotenv()

logging.basicConfig(format='%(asctime)s [%(levelname)s] %(message)s', level=logging.INFO)
log = logging.getLogger(__name__)

# ── 설정 ────────────────────────────────────────────────
BOT_TOKEN  = os.environ['JD_BOT_TOKEN']
DB_CHAT_ID = int(os.environ.get('DB_CHAT_ID', '-1003828748700'))   # 찾기/DB 보고창

REVIEW_CHAT_ID       = int(os.environ.get('ADM_CHAT_ID', '-1003943121521'))  # 행정보고창
REVIEW_EDIT_THREAD_ID = 104  # 행정보고창 수정요청 주제

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY']
supa = create_client(SUPABASE_URL, SUPABASE_KEY)

# 수정 시 보존할 필드 (덮어쓰지 않음)
PRESERVED = {
    '구분', '등록일시', '합자요청여부', '합자요청일시',
    '심의요청여부', '심의요청일시', '심의승인여부', '심의승인일시',
    '전송완료여부', '전송완료일시', '심의단계',
}


# ── 양식 파싱 ───────────────────────────────────────────
def parse_form(text: str) -> dict | None:
    lines = text.split('\n')
    data  = {}
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
    if not data.get('실적지역') or not data.get('섭외자') or not data.get('인도자'):
        return None
    return data


# ── Supabase 업데이트 ────────────────────────────────────
def update_db_findings(data: dict) -> dict | None:
    """
    db_findings에서 실적지역+섭외자+인도자로 찾아 업데이트.
    반환값: 업데이트된 행 (없으면 None)
    """
    res = supa.table('db_findings') \
        .select('*') \
        .eq('실적지역', data['실적지역']) \
        .eq('섭외자',   data['섭외자']) \
        .eq('인도자',   data['인도자']) \
        .maybe_single() \
        .execute()

    if not res.data:
        return None

    existing = res.data
    patch = {k: v for k, v in data.items() if k not in PRESERVED and v != ''}
    merged = {**existing, **patch}

    supa.table('db_findings') \
        .update(patch) \
        .eq('실적지역', data['실적지역']) \
        .eq('섭외자',   data['섭외자']) \
        .eq('인도자',   data['인도자']) \
        .execute()

    return merged


# ── 단계별 텔레그램 메시지 포맷 ──────────────────────────
def build_stage_text(row: dict) -> str:
    stage = str(row.get('구분') or '')
    r = row
    loc = '청년회/' + str(r.get('실적지역') or '')

    def v(k):  return str(r.get(k) or '')

    if stage == '찾기':
        return f"""[찾기]
실적부서/지역 : {loc}
인도자부서/지역/팀/구역 : {v('인도자부서/지역/팀/구역')}
인도자 : {v('인도자')}
목표개강(연도/월) : {v('목표개강(연도/월)')}
목표센터 : {v('목표센터')}
섭외자 : {v('섭외자')}

출생연도 : {v('출생연도')}
성별 : {v('성별')}
사는곳(센터와의 거리) : {v('사는곳')}
하는일 : {v('하는일')}
종교 : {v('종교')}
신앙년수 : {v('신앙년수')}
섭외유형 : {v('섭외유형')}
2차연결유형 : {v('2차연결유형')}
다음만남일 : {v('다음만남일')}
다음만남시간 : {v('다음만남시간')}
다음만남목적 : {v('다음만남목적')}"""

    if stage == '합자':
        return f"""[합자]
실적부서/지역 : {loc}
인도자부서/지역/팀/구역 : {v('인도자부서/지역/팀/구역')}
인도자 : {v('인도자')}

목표개강(연도/월) : {v('목표개강(연도/월)')}
목표센터 : {v('목표센터')}
섭외자 : {v('섭외자')}
출생연도 : {v('출생연도')}
성별 : {v('성별')}
사는곳 : {v('사는곳')}
하는일 : {v('하는일')}
종교 : {v('종교')}
신앙년수 : {v('신앙년수')}
편입부서 : 청년
섭외유형 : {v('섭외유형')}
2차연결유형 : {v('2차연결유형')}
따기예정일 : {v('따기예정일')}
교사부서/지역/팀/구역 : {v('교사부서/지역/팀/구역')}
교사 : {v('교사')}
다음만남일 : {v('다음만남일')}
다음만남시간 : {v('다음만남시간')}
다음만남목적 : {v('다음만남목적')}"""

    if stage == '육따기':
        return f"""[육따기]
실적부서/지역 : {loc}
인도자부서/지역/팀/구역 : {v('인도자부서/지역/팀/구역')}
인도자 : {v('인도자')}
교사부서/지역/팀/구역 : {v('교사부서/지역/팀/구역')}
교사 : {v('교사')}
섭외자 : {v('섭외자')}

따기주간횟수 : {v('따기주간횟수')}
따기기간 : {v('따기기간')}
고정요일 : {v('고정요일')}
다음만남일 : {v('다음만남일')}
다음만남시간 : {v('다음만남시간')}
다음만남목적 : {v('다음만남목적')}"""

    if stage in ('영따기', '따기'):
        return f"""[따기]
실적부서/지역 : {loc}
인도자부서/지역/팀/구역 : {v('인도자부서/지역/팀/구역')}
인도자 : {v('인도자')}
교사부서/지역/팀/구역 : {v('교사부서/지역/팀/구역')}
교사 : {v('교사')}
섭외자 : {v('섭외자')}

따기유형 : {v('따기유형')}
따기단계 : {v('따기단계')}
첫수업예정일 : {v('첫수업예정일')}
다음만남일 : {v('다음만남일')}
다음만남시간 : {v('다음만남시간')}
다음만남목적 : {v('다음만남목적')}"""

    if stage == '복음방':
        return f"""[복음방]
실적부서/지역 : {loc}
인도자부서/지역/팀/구역 : {v('인도자부서/지역/팀/구역')}
인도자 : {v('인도자')}
교사부서/지역/팀/구역 : {v('교사부서/지역/팀/구역')}
교사 : {v('교사')}
섬김이부서/지역/팀/구역 : {v('섬김이부서/지역/팀/구역')}
섬김이 : {v('섬김이')}
섭외자 : {v('섭외자')}

마팔수강번호 : {v('마팔수강번호')}
복음방수업방식 : {v('복음방수업방식')}
첫수업진행일 : {v('첫수업진행일')}
첫수업과목 : {v('첫수업과목')}
다음만남일 : {v('다음만남일')}
다음만남시간 : {v('다음만남시간')}
다음만남목적 : {v('다음만남목적')}"""

    if stage == '지역장':
        return f"""[지역장]
실적부서/지역 : {loc}
인도자부서/지역/팀/구역 : {v('인도자부서/지역/팀/구역')}
인도자 : {v('인도자')}
교사부서/지역/팀/구역 : {v('교사부서/지역/팀/구역')}
교사 : {v('교사')}
섭외자 : {v('섭외자')}
다음만남일 : {v('다음만남일')}
다음만남시간 : {v('다음만남시간')}
다음만남목적 : {v('다음만남목적')}
복음방총횟수 : {v('복음방총횟수')}
복음방체크리스트 : {v('복음방체크리스트')}
개강진면접여부 : {v('개강진면접여부')}
신천지오픈여부 : {v('신천지오픈여부')}
센터수강여부 : {v('센터수강여부')}
재입교자여부 : {v('재입교자여부')}"""

    return f"[{stage}]\n섭외자 : {v('섭외자')}\n실적지역 : {v('실적지역')}"


# ── 메시지 핸들러 ────────────────────────────────────────
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    if not msg or not msg.text:
        return
    if msg.chat.id != DB_CHAT_ID:
        return

    text = msg.text.strip()
    if not text.startswith('[정보 업데이트]'):
        return

    log.info(f'[정보 업데이트] 수신: {text[:60]}')

    parsed = parse_form(text)
    if not parsed:
        await msg.reply_text('⚠️ 정보 업데이트 양식을 확인해주세요.\n실적지역, 섭외자, 인도자는 필수입니다.')
        return

    updated = update_db_findings(parsed)
    if not updated:
        await msg.reply_text(
            f'⚠️ 해당 인물을 찾을 수 없습니다.\n'
            f'섭외자: {parsed["섭외자"]} | 실적지역: {parsed["실적지역"]}'
        )
        return

    stage_text = build_stage_text(updated)
    await context.bot.send_message(
        chat_id=REVIEW_CHAT_ID,
        text=stage_text,
        message_thread_id=REVIEW_EDIT_THREAD_ID,
    )

    await msg.reply_text(
        f'✅ 정보 업데이트 완료\n'
        f'섭외자: {parsed["섭외자"]} | 지역: {parsed["실적지역"]} | 인도자: {parsed["인도자"]}\n'
        f'행정보고창 수정요청 주제로 전송되었습니다.'
    )
    log.info(f'[정보 업데이트] 완료: {parsed["섭외자"]}')


# ── 실행 ─────────────────────────────────────────────────
import asyncio

async def _run():
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    log.info(f'[jd-secretary] 시작 — DB보고창 감시: {DB_CHAT_ID}')
    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)
    log.info('[jd-secretary] 대기 중 — Ctrl+C 로 종료')
    await app.updater.idle()
    await app.updater.stop()
    await app.stop()
    await app.shutdown()


if __name__ == '__main__':
    asyncio.run(_run())
