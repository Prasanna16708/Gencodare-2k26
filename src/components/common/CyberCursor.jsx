import React, { useEffect, useRef } from 'react';

export default function CyberCursor() {
  const cursorRef = useRef(null);
  const dotRef = useRef(null);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (window.matchMedia('(pointer: coarse)').matches) {
      return;
    }

    const cursor = cursorRef.current;
    const dot = dotRef.current;
    if (!cursor || !dot) return;

    let isHoveringInteractive = false;

    const handleMouseMove = (e) => {
      const { clientX: x, clientY: y } = e;
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;

      if (cursor.style.opacity === '0') {
        cursor.style.opacity = '1';
        dot.style.opacity = '1';
      }

      // Check if target is interactive
      const target = e.target;
      if (
        target &&
        (target.tagName === 'BUTTON' ||
          target.tagName === 'A' ||
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.closest('button') ||
          target.closest('a') ||
          target.classList?.contains('cursor-pointer'))
      ) {
        if (!isHoveringInteractive) {
          isHoveringInteractive = true;
          cursor.classList.add('cursor-hovered');
        }
      } else {
        if (isHoveringInteractive) {
          isHoveringInteractive = false;
          cursor.classList.remove('cursor-hovered');
        }
      }
    };

    const handleMouseLeave = () => {
      cursor.style.opacity = '0';
      dot.style.opacity = '0';
    };

    const handleMouseEnter = () => {
      cursor.style.opacity = '1';
      dot.style.opacity = '1';
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, []);

  return (
    <>
      {/* Outer subtle glowing green aura */}
      <div
        ref={cursorRef}
        className="cyber-cursor-glow"
        aria-hidden="true"
      />
      {/* Precision center reticle dot */}
      <div
        ref={dotRef}
        className="cyber-cursor-dot"
        aria-hidden="true"
      />
    </>
  );
}
