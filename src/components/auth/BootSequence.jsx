import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight } from 'lucide-react';

export default function BootSequence({ onComplete }) {
  const [stage, setStage] = useState(3);
  const [subtext, setSubtext] = useState('CALIBRATING NEURAL TELEMETRY...');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // 3 -> 2 -> 1 timing sequence
    const t1 = setTimeout(() => {
      setStage(2);
      setSubtext('DECRYPTING ALLOCATED SECTOR PROTOCOLS...');
    }, 850);

    const t2 = setTimeout(() => {
      setStage(1);
      setSubtext('SECURITY CLEARANCE VERIFIED...');
    }, 1700);

    const t3 = setTimeout(() => {
      if (onCompleteRef.current) {
        onCompleteRef.current();
      }
    }, 2550);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030705]/95 backdrop-blur-xl px-4 select-none">
      
      {/* Background Cyber Grid Lines */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,102,0.15)_0%,transparent_70%)] pointer-events-none" />
      
      {/* Scanline Sweep */}
      <div className="scanline-sweep" />

      {/* Terminal Title */}
      <div className="text-center mb-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--green-dim)] border border-[var(--green-primary)]/40 text-green text-xs font-mono mb-2">
          <span className="w-2 h-2 rounded-full bg-[var(--green-primary)] animate-ping" />
          SYSTEM INITIALIZING
        </div>
        <div className="text-silver-muted font-mono text-xs tracking-widest uppercase">
          DOOMSDAY COMMAND TERMINAL // BOOT SEQUENCE
        </div>
      </div>

      {/* Big Animated Number: 3 -> 2 -> 1 */}
      <div className="relative z-10 my-8 flex items-center justify-center h-48 w-48">
        {/* Outer Circular Reticle */}
        <div className="absolute inset-0 border-2 border-dashed border-[var(--green-primary)]/40 rounded-full radar-spinner" />
        <div className="absolute inset-2 border border-white/10 rounded-full" />
        
        <div
          key={stage}
          className="font-hud font-black text-7xl sm:text-8xl text-silver-bright animate-boot-number select-none"
          style={{
            color: '#00FF66',
            textShadow: '0 0 40px rgba(0,255,102,0.9), 0 0 80px rgba(0,255,102,0.5)',
          }}
        >
          {stage}
        </div>
      </div>

      {/* Terminal Subtext & Progress */}
      <div className="relative z-10 text-center max-w-sm mt-4">
        <div className="text-xs font-mono text-green tracking-wider mb-2 font-semibold">
          {subtext}
        </div>
        <div className="w-48 h-1.5 bg-black/60 border border-white/10 rounded-full mx-auto overflow-hidden mb-6">
          <div
            className="h-full bg-[var(--green-primary)] transition-all duration-700 shadow-[0_0_10px_#00FF66]"
            style={{ width: stage === 3 ? '33%' : stage === 2 ? '66%' : '100%' }}
          />
        </div>

        {/* Quick Skip button */}
        <button
          type="button"
          onClick={() => onCompleteRef.current && onCompleteRef.current()}
          className="btn-silver text-xs py-1.5 px-4 font-mono text-silver-muted hover:text-white"
        >
          <span>Skip Boot Animation</span>
          <ArrowRight size={12} className="ml-1" />
        </button>
      </div>
    </div>
  );
}
