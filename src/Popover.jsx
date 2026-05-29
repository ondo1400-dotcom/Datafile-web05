import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from './ui';

export default function Popover({ open: controlledOpen, onOpenChange, children }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const containerRef = useRef(null);

  const setOpen = useCallback((val) => {
    if (isControlled) {
      onOpenChange && onOpenChange(val);
    } else {
      setInternalOpen(val);
    }
  }, [isControlled, onOpenChange]);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEsc(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, setOpen]);

  const childArray = React.Children.toArray(children);
  const trigger = childArray.find(c => c.type === PopoverTrigger);
  const content = childArray.find(c => c.type === PopoverContent);

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }}>
      {trigger && React.cloneElement(trigger, { _isOpen: isOpen, _toggle: () => setOpen(!isOpen) })}
      {isOpen && content}
    </div>
  );
}

export function PopoverTrigger({ children, asChild, _isOpen, _toggle }) {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        _toggle();
        children.props.onClick && children.props.onClick(e);
      },
    });
  }
  return <button type="button" onClick={_toggle}>{children}</button>;
}

export function PopoverContent({ children, align = 'start', className, style: styleProp }) {
  return (
    <div
      className={cn('absolute z-50 rounded-xl border border-slate-200 bg-white p-3 shadow-lg', className)}
      style={{
        top: 'calc(100% + 4px)',
        [align === 'end' ? 'right' : 'left']: 0,
        ...styleProp,
      }}
    >
      {children}
    </div>
  );
}
