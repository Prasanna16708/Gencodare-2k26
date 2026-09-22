import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertOctagon, ShieldCheck } from 'lucide-react';
import { ApiService } from '../../services/api';

export default function Timer24h({ initialHackathon }) {
  const [hackathon, setHackathon] = useState(initialHackathon || null);
  const [displayTime, setDisplayTime] = useState({
    hh: '24',
    mm: '00',
    ss: '00',
    isExpired: false,
  });

  // Calculate local time offset against authoritative server clock
  const serverOffsetRef = useRef(0);
  const reqRef = useRef(null);

  // Sync with server authoritative timestamp
  useEffect(() => {
    let isMounted = true;

    async function syncServerTime() {
      try {
        const clientFetchStart = Date.now();
        const data = await ApiService.getHackathonStatus();
        const clientFetchEnd = Date.now();
        const roundTripEstimate = (clientFetchEnd - clientFetchStart) / 2;

        if (isMounted && data.endTime) {
          setHackathon(data);
          // Calculate offset: serverTime - clientLocalTime
          const serverNow = data.serverTime + roundTripEstimate;
          serverOffsetRef.current = serverNow - Date.now();
        }
      } catch (err) {
        console.warn('Could not sync hackathon status:', err.message);
      }
    }

    syncServerTime();
    // Periodically re-sync every 30 seconds to prevent any local clock drift
    const syncInterval = setInterval(syncServerTime, 30000);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, []);

  // Continuous loop for HH:MM:SS
  useEffect(() => {
    if (!hackathon || !hackathon.endTime) return;

    const endTime = hackathon.endTime;

    const tick = () => {
      const estimatedServerNow = Date.now() + serverOffsetRef.current;
      const remainingMs = Math.max(0, endTime - estimatedServerNow);

      if (remainingMs <= 0) {
        setDisplayTime({
          hh: '00',
          mm: '00',
          ss: '00',
          isExpired: true,
        });
        return;
      }

      const totalSeconds = Math.floor(remainingMs / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      setDisplayTime({
        hh: String(hours).padStart(2, '0'),
        mm: String(minutes).padStart(2, '0'),
        ss: String(seconds).padStart(2, '0'),
        isExpired: false,
      });

      reqRef.current = requestAnimationFrame(tick);
    };

    reqRef.current = requestAnimationFrame(tick);

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [hackathon]);

  const { hh, mm, ss, isExpired } = displayTime;

  return (
    <div className="w-full mb-6">
      <div className="liquid-glass hud-corner p-4 sm:p-6 rounded-xl border border-[var(--silver-border)] shadow-[0_0_25px_rgba(0,0,0,0.8)] relative overflow-hidden text-center">
        
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-16 bg-[var(--green-primary)]/10 blur-2xl pointer-events-none" />

        {/* Section HUD Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4 relative z-10 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-[var(--green-primary)] animate-pulse" />
            <span className="font-hud font-bold text-xs sm:text-sm tracking-widest text-silver-bright uppercase">
              24-HOUR HACKATHON COUNTDOWN
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono flex-wrap justify-center">
            <span className="text-silver-muted hidden sm:inline">TIMELOCK:</span>
            <span className="text-green font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-primary)] shadow-[0_0_6px_#00FF66]" />
              AUTHORITATIVE SERVER SYNC
            </span>
          </div>
        </div>

        {/* Big HUD Digital Timer Display */}
        {isExpired ? (
          <div className="py-4 my-2 relative z-10 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-black/80 border-2 border-red-500/80 text-red-400 font-hud text-lg sm:text-2xl font-black tracking-widest shadow-[0_0_30px_rgba(239,68,68,0.4)]">
              <AlertOctagon size={22} />
              HACKATHON TIME EXPIRED
            </div>
            <p className="font-mono text-xs text-silver-muted mt-2">
              Submissions closed. Please ensure project repository and slides are submitted.
            </p>
          </div>
        ) : (
          <div className="py-2 sm:py-4 relative z-10">
            {/* Digits Grid (HH : MM : SS) */}
            <div className="timer-grid">
              
              {/* Hours */}
              <div className="timer-unit">
                <div className="timer-box" style={{ fontSize: '2.5rem', minWidth: '95px', padding: '0.6rem 1.1rem' }}>
                  {hh}
                </div>
                <span className="timer-label text-[10px]">
                  HOURS
                </span>
              </div>

              <div className="timer-colon select-none" style={{ fontSize: '2.2rem', marginBottom: '0.8rem' }}>
                :
              </div>

              {/* Minutes */}
              <div className="timer-unit">
                <div className="timer-box" style={{ fontSize: '2.5rem', minWidth: '95px', padding: '0.6rem 1.1rem' }}>
                  {mm}
                </div>
                <span className="timer-label text-[10px]">
                  MINUTES
                </span>
              </div>

              <div className="timer-colon select-none" style={{ fontSize: '2.2rem', marginBottom: '0.8rem' }}>
                :
              </div>

              {/* Seconds (With Doomsday Green Glow) */}
              <div className="timer-unit">
                <div className="timer-box timer-box-ms" style={{ fontSize: '2.5rem', minWidth: '95px', padding: '0.6rem 1.1rem' }}>
                  {ss}
                </div>
                <span className="timer-label text-[10px] text-green" style={{ fontWeight: 700 }}>
                  SECONDS
                </span>
              </div>

            </div>

            {/* Persistence Guarantee Tag */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-silver-muted">
              <ShieldCheck size={14} className="text-green" />
              <span>PERSISTENT TIMESTAMP VERIFIED // ZERO DRIFT ON BROWSER REBOOT</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
