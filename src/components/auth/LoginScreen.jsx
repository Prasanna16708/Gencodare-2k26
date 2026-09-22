import React, { useState } from 'react';
import { Shield, KeyRound, Terminal, AlertTriangle, ArrowRight } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess, onAdminDirect }) {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!identifier.trim()) {
      setError('PLEASE ENTER REGISTERED GMAIL OR PHONE NUMBER');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onLoginSuccess(identifier.trim());
    } catch (err) {
      setError(err.message || 'PARTICIPANT NOT FOUND: Identity unverified. Please check your registered Gmail or Phone number.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex items-center justify-center py-6 sm:py-10 px-4">
      <div className="w-full max-w-[430px] mx-auto liquid-glass hud-corner p-5 sm:p-7 border border-[var(--green-primary)]/40 shadow-[0_0_45px_rgba(0,0,0,0.9)] relative overflow-hidden animate-fade-in">
        
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-[var(--green-primary)]/15 blur-2xl pointer-events-none" />

        {/* Tactical Header */}
        <div className="text-center mb-5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--green-dim)] border border-[var(--green-primary)]/30 text-[10px] font-mono text-green mb-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-primary)] animate-pulse" />
            DOOMSDAY // CLEARANCE LEVEL-1
          </div>

          <h1 className="font-hud text-xl sm:text-2xl font-black text-silver-bright tracking-wide mb-1">
            PARTICIPANT <span className="text-green">LOGIN</span>
          </h1>
          <p className="text-silver-muted text-xs font-mono max-w-xs mx-auto leading-relaxed">
            Enter registered Gmail or Phone to decrypt allocated domain mission.
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-black/85 border border-red-500/70 text-silver-bright text-xs font-mono flex items-start gap-2.5 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-fade-in">
            <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1">
              <div className="text-red-400 font-bold text-[11px] tracking-wide">AUTHENTICATION REJECTED</div>
              <div className="text-[11px] text-silver-muted leading-tight">{error}</div>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div>
            <div className="flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider text-silver-main mb-1.5">
              <span>Student Identity</span>
              <span className="text-[10px] text-silver-dark font-normal">[GMAIL / PHONE]</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => {
                  setIdentifier(e.target.value);
                  if (error) setError('');
                }}
                placeholder="student@gmail.com or 9876543210"
                className="cyber-input text-xs sm:text-sm py-2.5 pl-3 pr-9 font-mono"
                disabled={loading}
                autoFocus
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-silver-dark pointer-events-none">
                <Terminal size={15} />
              </div>
            </div>
            <div className="flex justify-between items-center mt-1.5 text-[10px] font-mono text-silver-muted">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-primary)]" />
                Encrypted Session
              </span>
              <span className="text-green/90">Domain Isolation Active</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 px-4 text-xs sm:text-sm font-bold tracking-wider shadow-[0_0_20px_rgba(0,255,102,0.35)] hover:shadow-[0_0_30px_rgba(0,255,102,0.55)] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>AUTHENTICATING...</span>
              </>
            ) : (
              <>
                <KeyRound size={15} />
                <span>INITIALIZE ACCESS</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Admin Link */}
        <div className="mt-5 pt-3.5 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-silver-muted relative z-10">
          <span>Organizer or Admin?</span>
          <button
            type="button"
            onClick={onAdminDirect}
            className="text-green hover:underline font-bold inline-flex items-center gap-1 transition-colors"
          >
            <Shield size={12} />
            <span>Admin Console →</span>
          </button>
        </div>

      </div>
    </div>
  );
}
