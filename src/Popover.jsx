import React, { useState, useEffect, useRef } from 'react';

/**
 * Lightweight popover component
 * Renders trigger inline, shows absolute-positioned content below
 *
 * @param {ReactNode|Function} trigger - The clickable element (or render fn)
 * @param {ReactNode} children - Popover content
 * @param {string} align - 'start' or 'end' for horizontal alignment
 * @param {boolean} open - Controlled open state (optional)
 * @param {Function} onOpenChange - Callback when open state changes (optional)
 */
export default function Popover({ trigger, children, align = 'start', open: controlledOpen, onOpenChange }) {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  // Use controlled or internal state
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = (newOpen) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    if (onOpenChange) {
      onOpenChange(newOpen);
    }
  };

  // Handle click outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(e) {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, setOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        ref={triggerRef}
        onClick={() => setOpen(!isOpen)}
        role="button"
      >
        {typeof trigger === 'function' ? trigger({ open: isOpen, setOpen }) : trigger}
      </div>

      {isOpen && (
        <div
          ref={popoverRef}
          className="nt-popover"
          style={{
            position: 'absolute',
            top: '100%',
            [align === 'end' ? 'right' : 'left']: 0,
            marginTop: '4px',
            zIndex: 50,
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
