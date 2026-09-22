import React, { useState, useEffect } from 'react';
import { Shield, Radio, LogOut, Terminal, Cpu, Clock } from 'lucide-react';
import { ApiService } from '../../services/api';

export default function Header({ participant, isAdmin, onLogout, onToggleAdmin, currentView }) {
  const [countdownStr, setCountdownStr] = useState('');

  // Sync and tick live countdown in the header
  useEffect(() => {
    let timer;
    async function syncHeaderTimer() {
      try {
        const data = await ApiService.getHackathonStatus();
        if (data && data.endTime) {
          const tick = () => {
            const rem = Math.max(0, data.endTime - Date.now());
            if (rem <= 0) {
              setCountdownStr('00:00:00');
              return;
            }
            const s = Math.floor(rem / 1000);
            const hh = String(Math.floor(s / 3600)).padStart(2, '0');
            const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
            const ss = String(s % 60).padStart(2, '0');
            setCountdownStr(`${hh}:${mm}:${ss}`);
          };
          tick();
          clearInterval(timer);
          timer = setInterval(tick, 1000);
        }
      } catch (err) {
        // Fallback or offline
      }
    }

    syncHeaderTimer();
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="liquid-glass border-b border-white/10 sticky top-0 z-50 px-3 sm:px-6 py-2.5 mb-4" style={{ borderRadius: 0 }}>
      <div className="layout-container flex items-center justify-between gap-3 flex-wrap">
        
        {/* Brand & Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded bg-black/60 border border-[var(--green-primary)] flex items-center justify-center text-[var(--green-primary)] shadow-[0_0_10px_rgba(0,255,102,0.35)] shrink-0">
            <Cpu size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none mb-1">
              <span className="font-hud font-bold text-base text-silver-bright tracking-wider">
                GENCODARE
              </span>
              <span className="font-hud font-bold text-base text-green">
                2K26
              </span>
            </div>
            <div className="text-[10px] font-mono text-silver-muted flex items-center gap-1.5 leading-none">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--green-primary)] animate-ping" />
              <span>COMMAND SECURE</span>
              <span>//</span>
              <span className="text-white/80">ACTioner</span>
            </div>
          </div>
        </div>

        {/* Status Badges, Live Countdown & Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Live Hackathon Countdown */}
          {countdownStr && (
            <div className="flex items-center gap-1.5 bg-black/60 border border-[var(--green-primary)]/50 px-2.5 py-1 rounded-md text-xs font-mono shadow-[0_0_12px_rgba(0,255,102,0.2)]">
              <Clock size={13} className="text-green animate-pulse" />
              <span className="text-silver-muted hidden md:inline text-[10px] tracking-wider">REMAINING:</span>
              <span className="text-green font-bold tracking-widest text-xs sm:text-sm">{countdownStr}</span>
            </div>
          )}

          {/* Participant Clearance Pill */}
          {participant && (
            <div className="flex items-center gap-2 bg-black/50 border border-white/10 px-2.5 py-1 rounded-md text-xs font-mono">
              <div className="w-2 h-2 rounded-full bg-[var(--green-primary)] shadow-[0_0_8px_#00FF66] shrink-0" />
              <span className="text-silver-muted hidden sm:inline">AGENT:</span>
              <span className="text-silver-bright font-semibold">{participant.name}</span>
              {participant.domainInfo && (
                <span className="ml-1 text-[10px] px-2 py-0.5 rounded bg-[var(--green-dim)] text-green border border-[var(--green-primary)]/40 font-bold inline-flex items-center gap-1.5 shrink-0">
                  {participant.domainInfo.icon && (
                    <img
                      src={participant.domainInfo.icon}
                      alt=""
                      className="w-4 h-4 rounded-full object-contain shrink-0"
                      style={{ width: '15px', height: '15px', maxWidth: '15px', maxHeight: '15px', display: 'inline-block' }}
                    />
                  )}
                  <span className="truncate max-w-[120px] sm:max-w-none">{participant.domainInfo.name}</span>
                </span>
              )}
            </div>
          )}

          {isAdmin && (
            <div className="flex items-center gap-1.5 bg-black/60 border border-[var(--green-primary)] px-2.5 py-1 rounded-md text-xs font-mono text-green">
              <Shield size={13} />
              <span className="font-bold text-[11px]">ADMIN ACTIVE</span>
            </div>
          )}

          {/* Mode Switcher / Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onToggleAdmin}
              className="btn-silver text-xs py-1 px-2.5"
              title={isAdmin ? "Switch to Participant Terminal" : "Access Admin Command Center"}
            >
              {isAdmin ? (
                <>
                  <Terminal size={13} className="text-green" />
                  <span className="hidden sm:inline">Participant</span>
                </>
              ) : (
                <>
                  <Terminal size={13} className="text-silver-muted" />
                  <span className="hidden sm:inline">Admin</span>
                </>
              )}
            </button>

            {(participant || isAdmin) && (
              <button
                onClick={onLogout}
                className="btn-silver text-xs py-1 px-2.5 border-red-500/40 text-red-400 hover:border-red-500 hover:text-red-300 transition-all flex items-center gap-1"
                title="Log out and reset session"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}
