import React, { useState, useEffect, useRef } from 'react';

function cn(...args) {
  return args.filter(Boolean).join(' ');
}

// ── Badge ──
function Badge({ className, variant = 'outline', children, ...props }) {
  const base = 'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium transition-colors';
  const variants = {
    default: 'border-transparent bg-slate-900 text-white',
    secondary: 'border-transparent bg-slate-100 text-slate-900',
    destructive: 'border-transparent bg-red-500 text-white',
    outline: '',
  };
  return <div className={cn(base, variants[variant], className)} {...props}>{children}</div>;
}

// ── Button ──
function Button({ className, variant = 'default', size = 'default', children, ...props }) {
  const base = 'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50';
  const variants = {
    default: 'bg-slate-900 text-white shadow hover:bg-slate-800',
    outline: 'border border-slate-200 bg-white shadow-sm hover:bg-slate-50',
    ghost: 'hover:bg-slate-100 hover:text-slate-900',
  };
  const sizes = {
    default: 'h-9 px-4 py-2',
    sm: 'h-8 rounded-md px-3 text-xs',
    icon: 'h-8 w-8',
  };
  return <button className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;
}

// ── Checkbox ──
function Checkbox({ checked, onCheckedChange, className, ...props }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={!!checked}
      onClick={() => onCheckedChange && onCheckedChange(!checked)}
      className={cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-slate-300 shadow-sm focus-visible:outline-none disabled:opacity-50',
        checked ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white',
        className
      )}
      {...props}
    >
      {checked && (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </button>
  );
}

// ── Input ──
function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-8 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-400 disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

// ── ScrollArea ──
function ScrollArea({ children, className, style, ...props }) {
  return (
    <div className={cn('overflow-auto', className)} style={style} {...props}>
      {children}
    </div>
  );
}

// ── Table primitives ──
const Table = React.forwardRef(({ className, style, ...props }, ref) => (
  <div className="relative w-full overflow-auto notion-table-scroll max-h-[calc(100vh-410px)]">
    <table ref={ref} className={cn('notion-table min-w-full caption-bottom text-[13px]', className)} style={style} {...props} />
  </div>
));

function TableHeader({ className, ...props }) {
  return <thead className={className} {...props} />;
}

function TableBody({ className, ...props }) {
  return <tbody className={className} {...props} />;
}

function TableRow({ className, ...props }) {
  return <tr className={cn('transition-colors duration-100', className)} {...props} />;
}

function TableHead({ className, style, ...props }) {
  return <th className={cn('h-[38px] px-3.5 text-left align-middle text-[11px] font-semibold text-warm-500 tracking-wide', className)} style={style} {...props} />;
}

function TableCell({ className, style, ...props }) {
  return <td className={cn('px-3 py-2.5 align-middle', className)} style={style} {...props} />;
}

export { cn, Badge, Button, Checkbox, Input, ScrollArea, Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
