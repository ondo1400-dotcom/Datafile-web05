import React from 'react';
import { cn, Badge } from './ui';
import { REGION_COLORS } from './columnConfig';

const STAGE_STYLES = {
  DB:     'border-stone-200 bg-stone-50 text-stone-500',
  TM:     'border-blue-200 bg-blue-50 text-blue-600',
  '준비합':  'border-violet-200 bg-violet-50 text-violet-600',
  '중장기':  'border-purple-200 bg-purple-50 text-purple-600',
  '찾기':   'border-teal-200 bg-teal-50 text-teal-700',
  '인터뷰': 'border-orange-200 bg-orange-50 text-orange-600',
  '합자':   'border-yellow-200 bg-yellow-50 text-yellow-700',
  '육따기': 'border-green-200 bg-green-50 text-green-600',
  '영따기': 'border-cyan-200 bg-cyan-50 text-cyan-600',
  '복음방': 'border-pink-200 bg-pink-50 text-pink-600',
  '센확':   'border-violet-200 bg-violet-50 text-violet-600',
  '센등':   'border-violet-200 bg-violet-50 text-violet-600',
  '수신':   'border-purple-200 bg-purple-50 text-purple-600',
};
const STAGE_DOTS = {
  DB: 'bg-stone-400', TM: 'bg-blue-400', '준비합': 'bg-violet-500', '중장기': 'bg-purple-500',
  '찾기': 'bg-teal-400', '인터뷰': 'bg-orange-400', '합자': 'bg-yellow-400', '육따기': 'bg-green-500',
  '영따기': 'bg-cyan-500', '복음방': 'bg-pink-500', '센확': 'bg-violet-500', '센등': 'bg-violet-500',
  '수신': 'bg-purple-500',
};

const TM_STYLES = {
  '번호다름': 'border-slate-200 bg-slate-50 text-slate-400',
  '착신전환': 'border-slate-200 bg-slate-50 text-slate-400',
  '나이비합': 'border-red-100 bg-red-50 text-red-400',
  '환경비합': 'border-red-100 bg-red-50 text-red-400',
  '거리비합': 'border-red-100 bg-red-50 text-red-400',
  '인성비합': 'border-red-100 bg-red-50 text-red-400',
  '책자거절': 'border-rose-100 bg-rose-50 text-rose-400',
  '컨설팅거절': 'border-rose-100 bg-rose-50 text-rose-400',
  '중복': 'border-slate-200 bg-slate-50 text-slate-400',
  '차단': 'border-slate-200 bg-slate-50 text-slate-400',
  '부재': 'border-yellow-200 bg-yellow-50 text-yellow-600',
  '첫인사(안읽씹)': 'border-yellow-200 bg-yellow-50 text-yellow-600',
  '첫인사(읽씹)': 'border-amber-200 bg-amber-50 text-amber-600',
  '고민파악(멈춤)': 'border-lime-200 bg-lime-50 text-lime-600',
  '카톡중': 'border-green-200 bg-green-50 text-green-600',
  '책자전달': 'border-emerald-200 bg-emerald-50 text-emerald-600',
  '전화예약': 'border-teal-200 bg-teal-50 text-teal-600',
  '만남잡힘': 'border-blue-200 bg-blue-50 text-blue-600',
  '준비합': 'border-violet-200 bg-violet-50 text-violet-600',
  '중장기': 'border-purple-200 bg-purple-50 text-purple-600',
};
const TM_DOTS = {
  '번호다름': 'bg-slate-300', '착신전환': 'bg-slate-300', '나이비합': 'bg-red-300', '환경비합': 'bg-red-300',
  '거리비합': 'bg-red-300', '인성비합': 'bg-red-300', '책자거절': 'bg-rose-300', '컨설팅거절': 'bg-rose-300',
  '중복': 'bg-slate-300', '차단': 'bg-slate-300', '부재': 'bg-yellow-400', '첫인사(안읽씹)': 'bg-yellow-400',
  '첫인사(읽씹)': 'bg-amber-400', '고민파악(멈춤)': 'bg-lime-500', '카톡중': 'bg-green-500',
  '책자전달': 'bg-emerald-500', '전화예약': 'bg-teal-500', '만남잡힘': 'bg-blue-500',
  '준비합': 'bg-violet-500', '중장기': 'bg-purple-500',
};

const GENDER_STYLES = { '남': 'border-blue-200 bg-blue-50 text-blue-600', '여': 'border-pink-200 bg-pink-50 text-pink-600' };
const GENDER_DOTS = { '남': 'bg-blue-500', '여': 'bg-pink-500' };

const MEETING_STYLES = { '좋음': 'border-green-200 bg-green-50 text-green-600', '보통': 'border-yellow-200 bg-yellow-50 text-yellow-600', '부정적': 'border-red-200 bg-red-50 text-red-600' };
const MEETING_DOTS = { '좋음': 'bg-green-500', '보통': 'bg-yellow-400', '부정적': 'bg-red-500' };

const TYPE_MAP = {
  stage:     { styles: STAGE_STYLES, dots: STAGE_DOTS },
  tm_status: { styles: TM_STYLES, dots: TM_DOTS },
  gender:    { styles: GENDER_STYLES, dots: GENDER_DOTS },
  meeting:   { styles: MEETING_STYLES, dots: MEETING_DOTS },
};

export default function StageBadge({ value, type }) {
  if (!value) return <span className="text-slate-300 text-xs">—</span>;

  if (type === 'region') {
    const colors = REGION_COLORS[value];
    if (colors) {
      return (
        <span
          className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-semibold"
          style={{ backgroundColor: colors.bg, color: colors.c }}
        >
          {value}
        </span>
      );
    }
    return <span className="text-xs">{value}</span>;
  }

  const map = TYPE_MAP[type];
  if (!map) return <span className="text-xs">{value}</span>;

  const s = map.styles[value] || 'border-slate-200 bg-slate-50 text-slate-500';
  const d = map.dots[value] || 'bg-slate-300';

  return (
    <Badge className={cn('gap-1.5 text-[11.5px] font-medium', s)}>
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', d)} />
      {value}
    </Badge>
  );
}
