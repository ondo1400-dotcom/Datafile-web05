#!/usr/bin/env python3
"""
jd-secretary 텔레그램 봇
[정보 업데이트] 메시지 수신 → Supabase db_findings 업데이트 → 행정보고창 수정요청 주제 전송
"""

import asyncio
import json
import logging
import os
import re
from datetime import datetime
from typing import Optional, Tuple

import pytz
from dotenv import load_dotenv
from supabase import create_client
from telegram import InlineKeyboardButton, InlineKeyboardMarkup, Update
from telegram.ext import ApplicationBuilder, CallbackQueryHandler, CommandHandler, ContextTypes, MessageHandler, filters

load_dotenv()

logging.basicConfig(format='%(asctime)s [%(levelname)s] %(message)s', level=logging.INFO)
log = logging.getLogger(__name__)

# ── 설정 ────────────────────────────────────────────────
BOT_TOKEN       = os.environ['JD_BOT_TOKEN']
DB_CHAT_ID       = int(os.environ.get('DB_CHAT_ID',       '-1003828748700'))  # 찾기/DB 보고창
MEETING_CHAT_ID  = int(os.environ.get('MEETING_CHAT_ID', '0'))               # 만남보고창
LIVEDATA_CHAT_ID = int(os.environ.get('LIVEDATA_CHAT_ID', '0'))              # 보유데이터 조회창

REVIEW_CHAT_ID       = int(os.environ.get('ADM_CHAT_ID', '-1003943121521'))  # 행정보고창
REVIEW_EDIT_THREAD_ID = 104  # 행정보고창 수정요청 주제

SUPABASE_URL = os.environ['SUPABASE_URL']
SUPABASE_KEY = os.environ['SUPABASE_KEY']
supa = create_client(SUPABASE_URL, SUPABASE_KEY)

KST = pytz.timezone('Asia/Seoul')

# ── 토픽 캐시 (thread_id → 지역명) ───────────────────────
_TOPIC_CACHE_FILE = os.path.join(os.path.dirname(__file__), 'topic_cache.json')
_topic_cache: dict[str, str] = {}

def _load_topic_cache():
    global _topic_cache
    try:
        with open(_TOPIC_CACHE_FILE, encoding='utf-8') as f:
            _topic_cache = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        _topic_cache = {}

def _save_topic_cache():
    with open(_TOPIC_CACHE_FILE, 'w', encoding='utf-8') as f:
        json.dump(_topic_cache, f, ensure_ascii=False)

def _topic_key(chat_id: int, thread_id: int) -> str:
    return f'{chat_id}:{thread_id}'

def _set_topic(chat_id: int, thread_id: int, name: str):
    _topic_cache[_topic_key(chat_id, thread_id)] = name
    _save_topic_cache()
    log.info(f'[topic] 등록: {name} (chat={chat_id}, thread={thread_id})')

def _get_topic(chat_id: int, thread_id: Optional[int]) -> Optional[str]:
    if thread_id is None:
        return None
    return _topic_cache.get(_topic_key(chat_id, thread_id))

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

def _split_key_val(s: str) -> Optional[Tuple[str, str]]:
    """'key : val' 또는 'key:val' 등 콜론 구분자 유연 파싱."""
    m = re.match(r'^(.+?)\s*:\s*(.*)', s)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    return None

def parse_meeting_report(text: str) -> Optional[dict]:
    data: dict = {}
    current_key: Optional[str] = None
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


# ── 만남보고 db_findings 검증 ────────────────────────────
def verify_meeting_target(지역: str, 섭외자: str, 인도자: str) -> Optional[str]:
    """
    db_findings에서 실적지역+섭외자+인도자 조합 확인.
    반환값: 'OK' | '데이터없음' | '인도자불일치:실제인도자' | '지역불일치:실제지역'
    """
    res = supa.table('db_findings') \
        .select('실적지역,인도자') \
        .eq('섭외자', 섭외자) \
        .execute()
    rows = res.data or []
    if not rows:
        return '데이터없음'
    for row in rows:
        if row.get('실적지역') == 지역 and row.get('인도자') == 인도자:
            return 'OK'
    # 섭외자는 있지만 조합이 틀린 경우 — 첫 번째 행 기준으로 안내
    first = rows[0]
    if first.get('실적지역') != 지역:
        return f'지역불일치:{first.get("실적지역", "")}'
    return f'인도자불일치:{first.get("인도자", "")}'


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
def parse_form(text: str) -> Optional[dict]:
    lines = text.split('\n')
    data  = {}
    last_key = None
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
        if key.startswith('ㄴ'):
            if last_key and val and last_key in data:
                data[last_key] = str(data[last_key]) + ' / ' + val
            continue
        if key in CHECKLIST_FIELDS:
            if val == '예':
                val = 1
            elif val == '아니오':
                val = 0
        data[key] = val
        last_key = key
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
def update_db_findings(data: dict) -> Optional[dict]:
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

    지역 = parsed.get('지역', parsed.get('부서', ''))
    섭외자 = parsed['섭외자']
    인도자 = parsed.get('인도자', '')
    verify = await asyncio.to_thread(verify_meeting_target, 지역, 섭외자, 인도자)

    if verify != 'OK':
        if verify == '데이터없음':
            msg_text = (
                f'⚠️ [{섭외자}] DB에 등록되지 않은 데이터입니다.\n'
                f'[DB] 또는 [찾기] 보고 후 다시 만남보고해주세요.'
            )
        elif verify.startswith('지역불일치:'):
            실제지역 = verify.split(':', 1)[1]
            msg_text = (
                f'⚠️ [{섭외자}] 지역이 맞지 않습니다.\n'
                f'입력: {지역}  →  실제: {실제지역}\n'
                f'지역 확인 후 다시 만남보고해주세요.'
            )
        else:
            실제인도자 = verify.split(':', 1)[1]
            msg_text = (
                f'⚠️ [{섭외자}] 인도자가 맞지 않습니다.\n'
                f'입력: {인도자}  →  실제: {실제인도자}\n'
                f'인도자 확인 후 다시 만남보고해주세요.'
            )
        await msg.reply_text(msg_text)
        log.info(f'[만남보고] 검증 실패({verify}): {섭외자}')
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


# ── 체크리스트 데이터 ────────────────────────────────────
CLIST_ITEMS = {
    '합자': [
        {'section': '인성', 'items': [
            {'code': 'h_in_1', 'text': '정신질환 관련 약을 복용중이지 않은가?'},
            {'code': 'h_in_2', 'text': '만남에 특정 목적을 띄고 있지 않은가?'},
            {'code': 'h_in_3', 'text': '부모에게 지나치게 의존적이지 않는가?'},
        ]},
        {'section': '신성', 'items': [
            {'code': 'h_sp_1', 'text': '신의 존재를 부정하지않고 믿거나 소망하는가?'},
            {'code': 'h_sp_2', 'text': '신천지 부정적 경험이 없는가?'},
            {'code': 'h_sp_3', 'text': '교회 사역/봉사 여부가 파악되었는가?'},
        ]},
        {'section': '환경', 'items': [
            {'code': 'h_ev_1', 'text': '사는 곳이 센터와 1시간 이내인가?'},
            {'code': 'h_ev_2', 'text': '타 지역 중복 섭외 이력을 확인하였는가?'},
            {'code': 'h_ev_3', 'text': '주 3회 대면 수강 가능한가?'},
            {'code': 'h_ev_4', 'text': '2주 이상 불가 일정이 없는가?'},
        ]},
    ],
    '따기': [
        {'section': '교사와의 신뢰', 'items': [
            {'code': 'd_tr_1', 'text': '30분 이상 경청하는 자세인가?'},
            {'code': 'd_tr_2', 'text': '교사에게 자신의 이야기를 털어놓는가?'},
            {'code': 'd_tr_3', 'text': '무료 상담 이유가 메리트있게 소개되었는가?'},
            {'code': 'd_tr_4', 'text': '친교/마음사기로 친밀감이 형성되었는가?'},
        ]},
        {'section': '정보파악', 'items': [
            {'code': 'd_in_1', 'text': '필수 정보(직장, 주소, 생일)가 파악되었는가?'},
            {'code': 'd_in_2', 'text': '영적 정보(이단경계심, 종교거부감)가 파악되었는가?'},
        ]},
        {'section': '동기부여', 'items': [
            {'code': 'd_mo_1', 'text': '변화해야 하는 이유를 구체적으로 인식하는가?'},
            {'code': 'd_mo_2', 'text': '영따기 프로그램 사전 안내가 되었는가?'},
        ]},
        {'section': '침방지/입막음', 'items': [
            {'code': 'd_sc_1', 'text': '보안서약서를 작성했는가?'},
            {'code': 'd_sc_2', 'text': '나올 때 주위에 뭐라고 하는지 확인되었는가?'},
        ]},
    ],
    '센터확정': [
        {'section': '동기부여', 'items': [
            {'code': 'b_mo_1', 'text': '상담이 반드시 필요하다는 것을 받아들였는가?'},
            {'code': 'b_mo_2', 'text': '변화가 반드시 필요함을 인정하는가?'},
            {'code': 'b_mo_3', 'text': '일정 조율 의지가 있는가?'},
        ]},
        {'section': '교사신뢰', 'items': [
            {'code': 'b_tr_1', 'text': '교사가 변화시켜줄 존재임을 인정하는가?'},
            {'code': 'b_tr_2', 'text': '원활하게 연락이 되고 있는가?'},
        ]},
        {'section': '종교거부감', 'items': [
            {'code': 'b_re_1', 'text': '종교 거부감이 해소되었는가?'},
            {'code': 'b_re_2', 'text': '이단경계심이 해소되었는가?'},
            {'code': 'b_re_3', 'text': '성경을 변화의 지침서로 인정하는가?'},
            {'code': 'b_re_4', 'text': '성경에 대해 열린 마음인가?'},
        ]},
        {'section': '침방지/입막음', 'items': [
            {'code': 'b_sc_1', 'text': '외부에 이야기하지 않는다고 인지하는가?'},
            {'code': 'b_sc_2', 'text': '개인 맞춤 모략을 사용하고 있는가?'},
        ]},
        {'section': '섬김이', 'items': [
            {'code': 'b_se_1', 'text': '간증 잎사귀가 투입되어 간증을 공유했는가?'},
            {'code': 'b_se_2', 'text': '예정된 섬김이가 매칭되어있는가?'},
            {'code': 'b_se_3', 'text': '섬김이와 친교만남이 되었는가?'},
        ]},
        {'section': '개강진 연결', 'items': [
            {'code': 'b_ab_1', 'text': '센터 교육기관 소개가 잘 되었는가?'},
            {'code': 'b_ab_2', 'text': '개강진 ABC가 진행되었는가?'},
            {'code': 'b_ab_3', 'text': '개강진 특강이 진행되었는가?'},
        ]},
        {'section': '수강환경', 'items': [
            {'code': 'b_en_1', 'text': '주3회 실참이 가능한 스케줄인가?'},
        ]},
    ],
}

CLIST_DB_COL = {'합자': '합자체크리스트', '따기': '따기체크리스트', '센터확정': '센터확정체크리스트'}
CLIST_ORDER = {
    '합자':    ['h_in_1','h_in_2','h_in_3','h_sp_1','h_sp_2','h_sp_3','h_ev_1','h_ev_2','h_ev_3','h_ev_4'],
    '따기':    ['d_tr_1','d_tr_2','d_tr_3','d_tr_4','d_in_1','d_in_2','d_mo_1','d_mo_2','d_sc_1','d_sc_2'],
    '센터확정': ['b_mo_1','b_mo_2','b_mo_3','b_tr_1','b_tr_2','b_re_1','b_re_2','b_re_3','b_re_4',
                'b_sc_1','b_sc_2','b_se_1','b_se_2','b_se_3','b_ab_1','b_ab_2','b_ab_3','b_en_1'],
}


def _clist_load(섭외자: str, 지역: str, type_key: str) -> dict:
    """DB에서 현재 체크 상태 로드 → {code: 'Y'/'N'/'-'} 딕트."""
    col = CLIST_DB_COL[type_key]
    res = supa.table('db_findings').select(col) \
        .eq('섭외자', 섭외자).eq('실적지역', 지역).limit(1).execute()
    if not res.data:
        return {}
    encoded = str(res.data[0].get(col) or '')
    order = CLIST_ORDER[type_key]
    return {code: encoded[i] if i < len(encoded) else '-' for i, code in enumerate(order)}


def _clist_save(섭외자: str, 지역: str, type_key: str, state: dict):
    """state 딕트 → 인코딩 문자열로 DB 저장."""
    order = CLIST_ORDER[type_key]
    encoded = ''.join(state.get(c, '-') for c in order)
    col = CLIST_DB_COL[type_key]
    supa.table('db_findings').update({col: encoded}) \
        .eq('섭외자', 섭외자).eq('실적지역', 지역).execute()


def _clist_render(type_key: str, 섭외자: str, 지역: str, state: dict) -> tuple[str, InlineKeyboardMarkup]:
    """질문 전체 텍스트 + 아래 Y/N 버튼. 선택 시 질문 앞에 ✅/❌ 표시."""
    done_count = sum(1 for v in state.values() if v in ('Y', 'N'))
    total = len(CLIST_ORDER[type_key])
    header = f'[{type_key}체크리스트] {섭외자} | {지역} ({done_count}/{total})'

    buttons = []
    for sec in CLIST_ITEMS[type_key]:
        buttons.append([InlineKeyboardButton(f'▸ {sec["section"]}', callback_data='cl_noop')])
        for item in sec['items']:
            val = state.get(item['code'], '-')
            prefix = '✅ ' if val == 'Y' else '❌ ' if val == 'N' else ''
            buttons.append([InlineKeyboardButton(prefix + item['text'], callback_data='cl_noop')])
            y_label = '✅ Y' if val == 'Y' else 'Y'
            n_label = '❌ N' if val == 'N' else 'N'
            buttons.append([
                InlineKeyboardButton(y_label, callback_data=f'cl|{type_key}|{item["code"]}|Y'),
                InlineKeyboardButton(n_label, callback_data=f'cl|{type_key}|{item["code"]}|N'),
            ])

    buttons.append([InlineKeyboardButton('💾 완료', callback_data='cl_done')])
    return header, InlineKeyboardMarkup(buttons)


# ── 체크리스트 요청 핸들러 ────────────────────────────────
async def handle_clist_request(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    if not msg or not msg.text:
        return
    log.info(f'[체크리스트?] chat_id={msg.chat.id} MEETING={MEETING_CHAT_ID} text={msg.text[:30]}')
    if MEETING_CHAT_ID == 0 or msg.chat.id != MEETING_CHAT_ID:
        return

    text = msg.text.strip()
    if not text.startswith('[체크리스트]'):
        return

    log.info(f'[체크리스트] 수신: {text[:60]}')
    data = {}
    for line in text.split('\n'):
        kv = _split_key_val(line.strip())
        if kv:
            data[kv[0]] = kv[1]

    type_key = data.get('종류', '').strip()
    섭외자   = data.get('섭외자', '').strip()
    지역     = data.get('지역', '').strip()

    if type_key not in CLIST_ITEMS:
        await msg.reply_text('⚠️ 종류는 합자 / 따기 / 센터확정 중 하나를 입력하세요.')
        return
    if not 섭외자:
        await msg.reply_text('⚠️ 섭외자를 입력해주세요.')
        return

    try:
        state = await asyncio.to_thread(_clist_load, 섭외자, 지역, type_key)
        text_body, keyboard = _clist_render(type_key, 섭외자, 지역, state)
        await msg.reply_text(text_body, reply_markup=keyboard)
    except Exception as e:
        log.error(f'[체크리스트] 오류: {e}')
        await msg.reply_text(f'⚠️ 오류: {e}')


# ── 체크리스트 버튼 콜백 ─────────────────────────────────
async def handle_clist_callback(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    data = query.data or ''

    if data == 'cl_noop':
        await query.answer()
        return
    if data == 'cl_done':
        await query.answer('✅ 저장완료!', show_alert=True)
        return
    if not data.startswith('cl|'):
        await query.answer()
        return

    await query.answer()
    _, type_key, code, val = data.split('|')

    # 메시지 첫 줄에서 섭외자/지역 파싱: "[합자체크리스트] 홍길동 | OO지역 (2/10)"
    first_line = (query.message.text or '').split('\n')[0]
    m = re.match(r'\[.+?\]\s+(.+?)\s+\|\s+(.+?)(?:\s+\(\d+/\d+\))?$', first_line)
    if not m:
        return
    섭외자 = m.group(1).strip()
    지역   = m.group(2).strip()

    state = await asyncio.to_thread(_clist_load, 섭외자, 지역, type_key)
    # 같은 값 누르면 취소(-), 다른 값이면 설정
    state[code] = '-' if state.get(code) == val else val
    await asyncio.to_thread(_clist_save, 섭외자, 지역, type_key, state)

    text_body, keyboard = _clist_render(type_key, 섭외자, 지역, state)
    await query.edit_message_text(text_body, reply_markup=keyboard)


# ── livedata 헬퍼 ────────────────────────────────────────
_RECRUIT_EMOJI = [
    ('노방', '🏃🏻'), ('통신', '📞'), ('지인', '👫'),
    ('가족', '👥'), ('UP', '🔝'), ('묵데', '🔄'),
]

# (db 구분값 목록, 표시명, 코드) — 파이프라인 역순(높은 단계 → 낮은 단계)
_LIVEDATA_STAGES = [
    (['센터확정', '지역장'], '센확',   'CT'),
    (['복음방'],             '복음방',  'B'),
    (['영따기', '따기'],    '영따기',  'D2'),
    (['육따기'],             '육따기',  'D1'),
    (['합자'],               '합자',    'H'),
    (['찾기'],               '찾기',    'CH'),
]

# 요약줄 순서(낮은 단계 → 높은 단계)
_SUMMARY_STAGES = list(reversed(_LIVEDATA_STAGES))


def _livedata_emoji(유형: str) -> str:
    for key, emoji in _RECRUIT_EMOJI:
        if key in (유형 or ''):
            return emoji
    return '❓'


def _livedata_team(field: str) -> str:
    """'부서/지역/팀/구역' 형식 필드에서 팀명 추출."""
    parts = (field or '').split('/')
    return parts[2].strip() if len(parts) >= 3 else '—'


_DOW_KO = ['월', '화', '수', '목', '금', '토', '일']

def _fmt_date(val: str) -> str:
    """'2026-05-21' → '5.21(수)', 이미 다른 형식이면 그대로."""
    try:
        from datetime import date as _date
        d = _date.fromisoformat(val.strip())
        return f'{d.month}.{d.day}({_DOW_KO[d.weekday()]})'
    except Exception:
        return val

def _livedata_person_line(row: dict) -> str:
    emoji = _livedata_emoji(str(row.get('섭외유형') or ''))
    팀    = _livedata_team(str(row.get('인도자부서/지역/팀/구역') or ''))
    s     = str(row.get('섭외자') or '')
    i     = str(row.get('인도자') or '')
    t     = str(row.get('교사') or '')
    목적  = str(row.get('다음만남목적') or '')
    날짜  = _fmt_date(str(row.get('다음만남일') or ''))
    return f'{emoji}/{팀}/{s}-{i}-{t}/{목적}/{날짜}'


def fetch_livedata(개강: str, 센터: str, 지역: str) -> list[dict]:
    def _norm(val: str) -> str:
        if '/' in val:
            y, m = val.split('/', 1)
            return f'{y}/{m.zfill(2)}'
        return val

    def _match_region(r: dict) -> bool:
        return (
            지역 in str(r.get('실적지역') or '')
            or 지역 in str(r.get('인도자부서/지역/팀/구역') or '')
        )

    # db_findings: 찾기/DB 단계
    res1 = (
        supa.table('db_findings')
        .select('*')
        .ilike('목표센터', f'%{센터}%')
        .execute()
    )
    findings = [
        r for r in (res1.data or [])
        if _norm(str(r.get('목표개강(연도/월)') or '')) == 개강
        and _match_region(r)
    ]
    log.info(f'[livedata] findings 조회: 전체 {len(res1.data or [])}건 → 필터 후 {len(findings)}건')

    # nujeok: 합자 이상 단계 — 단계 필드를 구분으로 매핑
    res2 = (
        supa.table('nujeok')
        .select('*')
        .ilike('실적지역', f'%{지역}%')
        .ilike('목표센터', f'%{센터}%')
        .execute()
    )
    def _match_kaigang(r: dict) -> bool:
        return (
            _norm(str(r.get('목표개강(연도/월)') or '')) == 개강
            or _norm(str(r.get('이전개강') or '')) == 개강
        )

    nujeok_rows = [
        r for r in (res2.data or [])
        if _match_kaigang(r)
        and str(r.get('단계') or '') != '탈락'
    ]
    log.info(f'[livedata] nujeok 조회: 전체 {len(res2.data or [])}건 → 개강필터 후 {len(nujeok_rows)}건')
    for r in nujeok_rows:
        r['구분'] = r.get('단계', '')

    # nujeok에 있는 인물은 db_findings에서 제외 (중복 방지)
    nujeok_keys = {
        f"{r.get('실적지역', '')}|{r.get('섭외자', '')}|{r.get('인도자', '')}"
        for r in nujeok_rows
    }
    findings = [
        r for r in findings
        if f"{r.get('실적지역', '')}|{r.get('섭외자', '')}|{r.get('인도자', '')}" not in nujeok_keys
    ]

    log.info(f'[livedata] 최종: findings {len(findings)}건 + nujeok {len(nujeok_rows)}건 = {len(findings) + len(nujeok_rows)}건')
    return findings + nujeok_rows


def build_livedata_message(개강: str, 센터: str, 지역: str, rows: list[dict]) -> str:
    def group(db_vals):
        return [r for r in rows if str(r.get('구분') or '') in db_vals]

    월 = 개강.split('/')[-1].lstrip('0') if '/' in 개강 else ''

    # 요약줄
    summary = ' '.join(
        f'{label}{len(group(db_vals)):02d}'
        for db_vals, label, _ in _SUMMARY_STAGES
    )

    lines = [
        f'전체☀️{월}월개강 #{지역} 보유데이터',
        f'개강 | {개강} {센터}센터',
        f'총 {len(rows)}명',
        '',
        '🔰보유 현황',
        summary,
        '',
        '◼️섭외 유형',
        '🏃🏻노방 📞통신 👫지인 👥가족 🔝UP 🔄묵데',
        '',
        '◼️양식',
        '섭외유형/팀/섭외자-인도자-교사/다음만남목적/다음만남일',
        '',
    ]

    # 단계별 섹션 (높은 단계 → 낮은 단계)
    for db_vals, label, code in _LIVEDATA_STAGES:
        grp = group(db_vals)
        cnt = len(grp)
        header = f'◼️{label} {code} {cnt:02d}' if code else f'◼️{label} {cnt:02d}'
        lines.append(header)
        for row in grp:
            lines.append(_livedata_person_line(row))
        lines.append('')

    return '\n'.join(lines).strip()


async def handle_topic_event(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """토픽 생성/수정 이벤트를 캐시에 저장."""
    msg = update.message
    if not msg or msg.message_thread_id is None:
        return
    if msg.forum_topic_created:
        _set_topic(msg.chat.id, msg.message_thread_id, msg.forum_topic_created.name)
    elif msg.forum_topic_edited and msg.forum_topic_edited.name:
        _set_topic(msg.chat.id, msg.message_thread_id, msg.forum_topic_edited.name)


async def handle_settopic(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/settopic 지역명 — 현재 토픽을 지역과 연결."""
    msg = update.message
    if not msg:
        return
    if not msg.message_thread_id:
        await msg.reply_text('⚠️ 토픽(주제) 안에서 사용해주세요.')
        return
    if not context.args:
        await msg.reply_text('사용법: /settopic 지역명')
        return
    지역 = ' '.join(context.args)
    _set_topic(msg.chat.id, msg.message_thread_id, 지역)
    await msg.reply_text(f'✅ 이 주제 → [{지역}] 지역으로 등록됨')


async def handle_livedata(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message
    if not msg:
        return
    if LIVEDATA_CHAT_ID != 0 and msg.chat.id != LIVEDATA_CHAT_ID:
        return

    args = context.args or []
    if len(args) < 2:
        await msg.reply_text('사용법: /livedata 43/06 홍대')
        return

    개강 = args[0]
    # 43/6 → 43/06 정규화
    if '/' in 개강:
        y, m = 개강.split('/', 1)
        개강 = f'{y}/{m.zfill(2)}'
    센터 = ' '.join(args[1:])
    지역 = _get_topic(msg.chat.id, msg.message_thread_id)

    if not 지역:
        await msg.reply_text(
            '⚠️ 이 주제의 지역이 등록되지 않았습니다.\n'
            '/settopic 지역명 으로 먼저 등록해주세요.'
        )
        return

    log.info(f'[livedata] 개강={개강} 센터={센터} 지역={지역}')

    try:
        rows = await asyncio.to_thread(fetch_livedata, 개강, 센터, 지역)
        if not rows:
            await msg.reply_text(f'⚠️ [{개강} {지역} {센터}센터] 해당하는 데이터가 없습니다.')
            return
        text = build_livedata_message(개강, 센터, 지역, rows)
        await msg.reply_text(text)
    except Exception as e:
        log.error(f'[livedata] 오류: {e}')
        await msg.reply_text(f'⚠️ 오류: {e}')


# ── 실행 ─────────────────────────────────────────────────
async def _run():
    _load_topic_cache()
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler('livedata',  handle_livedata))
    app.add_handler(CommandHandler('settopic',  handle_settopic))
    app.add_handler(MessageHandler(filters.StatusUpdate.FORUM_TOPIC_CREATED, handle_topic_event))
    app.add_handler(MessageHandler(filters.StatusUpdate.FORUM_TOPIC_EDITED,  handle_topic_event))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_meeting),       group=0)
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_clist_request), group=1)
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message),       group=2)
    app.add_handler(CallbackQueryHandler(handle_clist_callback, pattern=r'^cl'))
    log.info(f'[jd-secretary] 시작 — DB보고창: {DB_CHAT_ID} | 만남보고창: {MEETING_CHAT_ID} | livedata: {LIVEDATA_CHAT_ID}')
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
