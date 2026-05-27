#!/usr/bin/env python3
"""
jd-secretary 텔레그램 봇
[정보 업데이트] 메시지 수신 → Supabase db_findings 업데이트 → 행정보고창 수정요청 주제 전송
"""

import asyncio
import logging
import os
import re
from datetime import datetime

import pytz
from dotenv import load_dotenv
from supabase import create_client
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, MessageHandler, filters

load_dotenv()

logging.basicConfig(format='%(asctime)s [%(levelname)s] %(message)s', level=logging.INFO)
log = logging.getLogger(__name__)

# ── 설정 ────────────────────────────────────────────────
BOT_TOKEN       = os.environ['JD_BOT_TOKEN']
DB_CHAT_ID      = int(os.environ.get('DB_CHAT_ID',      '-1003828748700'))  # 찾기/DB 보고창
MEETING_CHAT_ID = int(os.environ.get('MEETING_CHAT_ID', '0'))               # 만남보고창

REVIEW_CHAT_ID       = int(os.environ.get('ADM_CHAT_ID', '-1003943121521'))  # 행정보고창
REVIEW_EDIT_THREAD_ID = 104  # 행정보고창 수정요청 주제

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY']
supa = create_client(SUPABASE_URL, SUPABASE_KEY)

KST = pytz.timezone('Asia/Seoul')

# 수정 시 보존할 필드 (덮어쓰지 않음)
PRESERVED = {
    '구분', '등록일시', '합자요청여부', '합자요청일시',
    '심의요청여부', '심의요청일시', '심의승인여부', '심의승인일시',
    '전송완료여부', '전송완료일시', '심의단계',
}

# 예/아니오 → 1/0 변환 필드
CHECKLIST_FIELDS = {'합자체크리스트', '따기체크리스트', '센터확정체크리스트'}


# ── 만남보고 파싱 ───────────────────────────────────────
_MEET_MARKERS = ('▫️', '🌈', '✅', '▫')

def _split_key_val(s: str) -> tuple[str, str] | None:
    """'key : val' 또는 'key:val' 등 콜론 구분자 유연 파싱."""
    m = re.match(r'^(.+?)\s*:\s*(.*)', s)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return None

def parse_meeting_report(text: str) -> dict | None:
    data: dict = {}
    current_key: str | None = None
    buffer: list[str] = []

    def flush():
        nonlocal current_key, buffer
        if current_key:
            data[current_key] = '\n'.join(buffer).strip()
        current_key = None
        buffer = []

    for raw in text.split('\n'):
        s = raw.strip()
        if any(s.startswith(m) for m in _MEET_MARKERS):
            flush()
            for m in _MEET_MARKERS:
                if s.startswith(m):
                    s = s[len(m):].strip()
                    break
            kv = _split_key_val(s)
            if kv:
                current_key, val = kv
                buffer = [val] if val else []
            else:
                current_key = s.strip() or None
        elif s and current_key is not None:
            buffer.append(s)

    flush()
    return data if data.get('섭외자') else None


# ── 만남보고 Supabase 저장 ───────────────────────────────
def save_meeting_report(data: dict) -> int:
    """db_meetings에 저장 후 해당 섭외자 누적 횟수 반환."""
    row = {
        '실적지역':  data.get('지역', data.get('부서', '')),
        '섭외자':    data['섭외자'],
        '인도자':    data.get('인도자', ''),
        '교사':      data.get('교사', ''),
        '동행자':    data.get('동행자', ''),
        '섬김이':    data.get('섬김이', ''),
        '만남일자':  data.get('만남일자', ''),
        '만남시간':  data.get('만남시간', ''),
        '제목':      data.get('제목', ''),
        '수업내용':  data.get('수업내용', ''),
        '수업반응':  data.get('수업 반응', data.get('수업반응', '')),
        '다음만남일': data.get('다음 만남일', data.get('다음만남일', '')),
        '특이사항':  data.get('특이사항', ''),
    }
    supa.table('db_meetings').insert(row).execute()
    res = supa.table('db_meetings') \
        .select('id', count='exact') \
        .eq('섭외자', data['섭외자']) \
        .execute()
    return res.count or 0


def get_recent_meetings(섭외자: str, limit: int = 5) -> list:
    res = supa.table('db_meetings') \
        .select('만남일자,제목,다음만남일') \
        .eq('섭외자', 섭외자) \
        .order('보고일시', desc=True) \
        .limit(limit) \
        .execute()
    return res.data or []


def update_next_meeting(섭외자: str, next_date: str):
    if not next_date:
        return
    supa.table('db_findings') \
        .update({'다음만남일': next_date}) \
        .eq('섭외자', 섭외자) \
        .execute()


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
        if key in CHECKLIST_FIELDS:
            if val == '예':
                val = 1
            elif val == '아니오':
                val = 0
        data[key] = val
    if not data.get('실적지역') or not data.get('섭외자') or not data.get('인도자'):
        return None
    return data


# ── Supabase 저장 (DB / 찾기) ────────────────────────────
def save_to_supabase(data: dict, type_: str) -> bool:
    """db_findings에 upsert. 반환값: True=업데이트, False=새로 삽입"""
    data['구분'] = type_
    res = supa.table('db_findings') \
        .select('id') \
        .eq('실적지역', data.get('실적지역', '')) \
        .eq('섭외자',   data.get('섭외자', '')) \
        .eq('인도자',   data.get('인도자', '')) \
        .limit(1) \
        .execute()
    is_update = bool(res and res.data)
    if not is_update:
        data['등록일시'] = datetime.now(KST).isoformat()
    supa.table('db_findings').upsert(data, on_conflict='실적지역,섭외자,인도자').execute()
    return is_update


# ── Supabase 업데이트 (정보 업데이트) ────────────────────
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
        .limit(1) \
        .execute()

    if not res or not res.data:
        return None

    existing = res.data[0]
    patch = {k: v for k, v in data.items() if k not in PRESERVED and v != '' and v is not None}
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


# ── 만남보고 핸들러 ──────────────────────────────────────
async def handle_meeting(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    if not msg or not msg.text:
        return
    if MEETING_CHAT_ID == 0 or msg.chat.id != MEETING_CHAT_ID:
        return

    text = msg.text.strip()
    if not text.startswith('[만남보고]'):
        return

    log.info(f'[만남보고] 수신: {text[:60]}')
    parsed = parse_meeting_report(text)
    if not parsed:
        await msg.reply_text('⚠️ 만남보고 양식을 확인해주세요.\n섭외자는 필수입니다.')
        return

    count = await asyncio.to_thread(save_meeting_report, parsed)

    next_date = parsed.get('다음 만남일', '')
    if next_date:
        await asyncio.to_thread(update_next_meeting, parsed['섭외자'], next_date)

    history = await asyncio.to_thread(get_recent_meetings, parsed['섭외자'])
    history_lines = []
    for i, m in enumerate(history):
        nth = count - i
        date = m.get('만남일자', '—')
        title = m.get('제목', '—')
        history_lines.append(f'  {nth}차  {date}  {title}')

    next_line = f'📅 다음만남일: {next_date} 업데이트됨\n' if next_date else ''
    history_text = '\n'.join(history_lines) or '없음'

    await msg.reply_text(
        f'✅ 만남보고 저장 — {parsed["섭외자"]} ({count}번째 만남)\n'
        f'{next_line}\n'
        f'[만남 흐름]\n{history_text}'
    )
    log.info(f'[만남보고] 완료: {parsed["섭외자"]} ({count}회)')


# ── DB보고창 핸들러 ────────────────────────────────────────
async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    if not msg or not msg.text:
        return
    log.info(f'메시지 수신 chat_id={msg.chat.id} (기대값={DB_CHAT_ID}) text={msg.text[:40]}')
    if msg.chat.id != DB_CHAT_ID:
        return

    text = msg.text.strip()

    if text.startswith('[DB]'):
        log.info(f'[DB] 수신: {text[:60]}')
        parsed = parse_form(text)
        if parsed:
            await asyncio.to_thread(save_to_supabase, parsed, 'DB')
            await msg.reply_text(
                '✅ DB - ' + parsed['섭외자'] + ' - 정상적으로 기록되었습니다.\n'
                '지역: ' + parsed['실적지역']
            )
        else:
            await msg.reply_text('⚠️ DB 양식을 확인해주세요.\n실적지역과 섭외자는 필수입니다.')

    elif text.startswith('[찾기]'):
        log.info(f'[찾기] 수신: {text[:60]}')
        parsed = parse_form(text)
        if parsed:
            is_update = await asyncio.to_thread(save_to_supabase, parsed, '찾기')
            await msg.reply_text(
                ('🔄 찾기 수정' if is_update else '✅ 찾기 등록') +
                ' - ' + parsed['섭외자'] + ' - 정상적으로 기록되었습니다.\n'
                '지역: ' + parsed['실적지역'] + ' | 인도자: ' + parsed.get('인도자', '—')
            )
        else:
            await msg.reply_text('⚠️ 찾기 양식을 확인해주세요.\n실적지역과 섭외자는 필수입니다.')

    elif text.startswith('[정보 업데이트]'):
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
async def _run():
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_meeting))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    log.info(f'[jd-secretary] 시작 — DB보고창: {DB_CHAT_ID} | 만남보고창: {MEETING_CHAT_ID}')
    await app.initialize()
    await app.start()
    await app.updater.start_polling(drop_pending_updates=True)
    log.info('[jd-secretary] 대기 중 — Ctrl+C 로 종료')
    try:
        await asyncio.Event().wait()
    except asyncio.CancelledError:
        pass
    finally:
        await app.updater.stop()
        await app.stop()
        await app.shutdown()


if __name__ == '__main__':
    asyncio.run(_run())
