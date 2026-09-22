import React from 'react';
import { Target, CheckCircle2, Shield, Sparkles, ExternalLink, Code2, AlertCircle, Presentation, UploadCloud } from 'lucide-react';
import { HACKATHON_CONFIG } from '../../services/config';

export default function ProblemView({ problem, domain, feedbackUrl, pptUrl }) {
  const formUrl = feedbackUrl || HACKATHON_CONFIG.feedbackFormUrl;
  const driveUrl = pptUrl || HACKATHON_CONFIG.pptSubmissionUrl || 'https://drive.google.com/';

  if (!problem) {
    return (
      <div className="liquid-glass hud-corner p-8 text-center text-silver-muted font-mono text-xs border border-white/10 mb-8">
        NO MISSION OBJECTIVE CURRENTLY SELECTED
      </div>
    );
  }

  return (
    <div className="w-full space-y-10 mb-16">
      
      {/* 3. SELECTED PROBLEM STATEMENT CARD (With subtle floating animation) */}
      <div className="liquid-glass hud-corner p-6 sm:p-10 rounded-xl border border-[var(--silver-border)] shadow-[0_12px_40px_rgba(0,0,0,0.8)] relative animate-subtle-float">
        
        {/* Top Header Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-5 mb-6">
          <div className="flex items-center gap-3">
            {domain?.icon && (
              <img
                src={domain.icon}
                alt={domain?.name || 'Domain'}
                className="w-10 h-10 rounded-full object-contain border border-[var(--green-primary)]/50 shadow-[0_0_12px_rgba(0,255,102,0.3)] bg-black/60 p-0.5"
              />
            )}
            <span className="font-hud font-black text-xl sm:text-2xl text-[var(--green-primary)] px-3 py-1 rounded bg-black/60 border border-[var(--green-primary)] shadow-[0_0_12px_rgba(0,255,102,0.4)]">
              {problem.id}
            </span>
            <div>
              <div className="text-[10px] font-mono text-silver-muted tracking-widest uppercase">
                ALLOCATED OBJECTIVE
              </div>
              <div className="text-xs font-mono text-green font-semibold">
                {domain?.name || 'ASSIGNED DOMAIN'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1 rounded bg-black/40 border border-white/10 text-silver-bright flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-green" />
              STATUS: ARMED & ACTIVE
            </span>
          </div>
        </div>

        {/* Problem Title */}
        <h2 className="font-hud text-2xl sm:text-3xl font-extrabold text-silver-bright mb-4 leading-tight tracking-wide">
          {problem.title}
        </h2>

        {/* Full Problem Description */}
        <div className="mb-8">
          <div className="text-xs font-mono text-silver-muted uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Target size={14} className="text-green" />
            MISSION BRIEF & OPERATIONAL SCOPE
          </div>
          <p className="text-silver-main text-sm sm:text-base font-body leading-relaxed bg-black/30 p-5 rounded-lg border border-white/10">
            {problem.description}
          </p>
        </div>

        {/* Technical Target & Deliverables Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
          {problem.keyMetrics && (
            <div className="p-4 rounded-lg bg-black/40 border border-white/10 font-mono">
              <div className="text-xs text-green font-bold mb-1 flex items-center gap-1.5">
                <Sparkles size={13} />
                PERFORMANCE TARGET METRIC:
              </div>
              <div className="text-xs sm:text-sm text-silver-bright">
                {problem.keyMetrics}
              </div>
            </div>
          )}

          {problem.deliverables && (
            <div className="p-4 rounded-lg bg-black/40 border border-white/10 font-mono">
              <div className="text-xs text-silver-light font-bold mb-1 flex items-center gap-1.5">
                <Code2 size={13} className="text-green" />
                EXPECTED DELIVERABLES:
              </div>
              <div className="text-xs sm:text-sm text-silver-muted">
                {problem.deliverables}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* 4. PROMINENT FEEDBACK FORM & 5. PPT SUBMISSION BUTTONS */}
      <div className="flex flex-col items-center justify-center gap-6 pt-2">
        {/* Feedback Form Button */}
        <div className="text-center">
          <a
            href={formUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-base sm:text-lg font-black py-4 px-10 rounded-xl tracking-wider shadow-[0_0_35px_rgba(0,255,102,0.45)] hover:shadow-[0_0_55px_rgba(0,255,102,0.8)] inline-flex items-center gap-3 transition-all transform hover:-translate-y-1"
          >
            <span>FEEDBACK FORM</span>
            <ExternalLink size={20} />
          </a>
          <div className="text-xs font-mono text-silver-muted mt-2.5">
            Opens in a new tab • Submit mid-evaluation questions & feedback
          </div>
        </div>

        {/* PPT Submission Button (Leads to Google Drive) */}
        <div className="text-center">
          <a
            href={driveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-silver text-base sm:text-lg font-black py-4 px-10 rounded-xl tracking-wider border-2 border-[var(--silver-border)] hover:border-[var(--green-primary)] text-silver-bright hover:text-green shadow-[0_0_25px_rgba(0,0,0,0.8)] hover:shadow-[0_0_35px_rgba(0,255,102,0.4)] inline-flex items-center gap-3 transition-all transform hover:-translate-y-1 bg-black/60"
          >
            <Presentation size={22} className="text-green" />
            <span>PPT SUBMISSION</span>
            <ExternalLink size={18} />
          </a>
          <div className="text-xs font-mono text-silver-muted mt-2.5 flex items-center justify-center gap-1.5">
            <UploadCloud size={13} className="text-green" />
            <span>Opens Google Drive in a new tab • Upload your presentation slides (.pptx / .pdf)</span>
          </div>
        </div>
      </div>

    </div>
  );
}
