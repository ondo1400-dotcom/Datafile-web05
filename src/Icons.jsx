import React from 'react';

function Icon({ size = 16, children, className, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={className} {...props}>
      {children}
    </svg>
  );
}

export function SearchIcon(p) { return <Icon {...p}><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></Icon>; }
export function FilterIcon(p) { return <Icon {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></Icon>; }
export function Columns3Icon(p) { return <Icon {...p}><rect x="2" y="3" width="20" height="18" rx="2" /><path d="M9 3v18" /><path d="M15 3v18" /></Icon>; }
export function ChevronLeftIcon(p) { return <Icon {...p}><path d="M15 18l-6-6 6-6" /></Icon>; }
export function ChevronRightIcon(p) { return <Icon {...p}><path d="M9 18l6-6-6-6" /></Icon>; }
export function PinIcon(p) { return <Icon {...p}><path d="M12 17v5" /><path d="M9 10.76a2 2 0 01-1.11 1.79l-1.78.9A2 2 0 005 15.24V16h14v-.76a2 2 0 00-1.11-1.79l-1.78-.9A2 2 0 0115 10.76V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v5.76z" /></Icon>; }
export function ArrowUpIcon(p) { return <Icon {...p}><path d="M12 19V5" /><path d="M5 12l7-7 7 7" /></Icon>; }
export function ArrowDownIcon(p) { return <Icon {...p}><path d="M12 5v14" /><path d="M19 12l-7 7-7-7" /></Icon>; }
export function HelpCircleIcon(p) { return <Icon {...p}><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></Icon>; }
export function RefreshCwIcon(p) { return <Icon {...p}><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" /></Icon>; }
export function DocIcon(p) { return <Icon {...p}><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></Icon>; }
