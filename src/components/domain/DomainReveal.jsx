import React, { useEffect, useState, useRef } from 'react';
import { ShieldCheck, ArrowRight, Zap } from 'lucide-react';

export default function DomainReveal({ domain, participant, onContinue }) {
  const [countdown, setCountdown] = useState(3);
  const onContinueRef = useRef(onContinue);
  onContinueRef.current = onContinue;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onContinueRef.current) {
            onContinueRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#030705]/95 backdrop-blur-2xl px-4 select-none">
      
      {/* Intense Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[var(--green-primary)]/15 rounded-full blur-[90px] pointer-events-none animate-green-pulse" />

      <div className="liquid-glass hud-corner max-w-lg w-full p-8 sm:p-12 text-center border border-[var(--green-primary)] shadow-[0_0_50px_rgba(0,255,102,0.35)] relative z-10 animate-domain-reveal">
        
        {/* Top Header Stamp */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[var(--green-dim)] border border-[var(--green-primary)] text-green text-xs font-mono font-bold tracking-widest uppercase">
            <Zap size={14} className="animate-bounce" />
            DOMAIN IDENTIFIED
          </div>
          <div className="text-[11px] font-mono text-silver-muted mt-2">
            AGENT: <span className="text-silver-bright font-semibold">{participant?.name}</span>
          </div>
        </div>

        {/* Domain Icon Emblem with Doomsday-Green Glow */}
        <div className="relative my-6 mx-auto w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[var(--green-primary)]/20 to-transparent blur-md" />
          <div className="relative w-full h-full rounded-full border-2 border-[var(--green-primary)] bg-black/60 p-3 flex items-center justify-center shadow-[0_0_30px_rgba(0,255,102,0.5)]">
            <img
              src={domain?.icon || '/icons/generative-ai.png'}
              alt={domain?.name || 'Domain'}
              className="w-full h-full object-contain filter drop-shadow-[0_0_15px_rgba(0,255,102,0.6)]"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        </div>

        {/* Domain Name & Tagline */}
        <div className="mb-6">
          <h2 className="font-hud text-2xl sm:text-3xl font-extrabold text-silver-bright tracking-wide mb-2 uppercase">
            {domain?.name || 'GENERATIVE AI & LLM'}
          </h2>
          {domain?.tagline && (
            <p className="text-silver-muted text-xs sm:text-sm font-mono max-w-sm mx-auto">
              {domain.tagline}
            </p>
          )}
        </div>

        {/* Access Granted Status */}
        <div className="py-3 px-6 rounded-lg bg-black/60 border border-white/20 inline-flex items-center gap-3 mb-6">
          <ShieldCheck size={20} className="text-[var(--green-primary)]" />
          <span className="font-hud text-sm font-bold text-[var(--green-primary)] tracking-widest">
            ACCESS GRANTED
          </span>
        </div>

        {/* Action / Auto-proceed countdown */}
        <div>
          <button
            onClick={() => onContinueRef.current && onContinueRef.current()}
            className="btn-primary w-full py-3 text-sm font-bold shadow-[0_0_25px_rgba(0,255,102,0.4)]"
          >
            <span>PROCEED TO DOMAIN MISSIONS ({countdown}s)</span>
            <ArrowRight size={16} />
          </button>
        </div>

      </div>
    </div>
  );
}
