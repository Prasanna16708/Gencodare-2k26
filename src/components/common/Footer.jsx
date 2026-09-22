import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 py-6 text-center text-xs font-mono text-silver-muted bg-black/40 backdrop-blur-md">
      <div className="layout-container flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[var(--green-primary)] shadow-[0_0_8px_#00FF66]" />
          <span className="text-silver-bright font-semibold tracking-wide">
            © 2026 PRASANNA
          </span>
          <span className="text-white/40">|</span>
          <span className="text-green font-bold tracking-wider">
            ACTioner
          </span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-silver-muted">
          <span>HIGH-SECURITY COMMAND INTERFACE</span>
          <span>•</span>
          <span>AVENGERS: DOOMSDAY SECTOR</span>
          <span>•</span>
          <span className="text-[var(--green-primary)]">24H TIMELOCK ACTIVE</span>
        </div>
      </div>
    </footer>
  );
}
