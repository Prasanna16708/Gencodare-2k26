import React, { useState, useEffect } from 'react';
import { Target, CheckCircle2, Shield, Sparkles, ExternalLink, Code2, AlertCircle, Presentation, UploadCloud, Download, FileSpreadsheet } from 'lucide-react';
import { HACKATHON_CONFIG } from '../../services/config';
import { ApiService } from '../../services/api';

export default function ProblemView({ problem, domain, feedbackUrl, pptUrl, initialPptTemplate }) {
  const formUrl = feedbackUrl || HACKATHON_CONFIG.feedbackFormUrl;
  const driveUrl = pptUrl || HACKATHON_CONFIG.pptSubmissionUrl || 'https://drive.google.com/';

  const [pptTemplate, setPptTemplate] = useState(initialPptTemplate || null);

  useEffect(() => {
    if (initialPptTemplate) {
      setPptTemplate(initialPptTemplate);
      return;
    }

    async function loadTemplate() {
      try {
        const info = await ApiService.getPptTemplateInfo();
        if (info && info.hasTemplate) {
          setPptTemplate(info.template);
        }
      } catch (e) {
        // Fallback or silent catch
      }
    }
    loadTemplate();
  }, [initialPptTemplate]);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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

      {/* 4. MISSION COMMAND ACTION HUB (PPT TEMPLATE DOWNLOAD -> FEEDBACK FORM -> PPT SUBMISSION) */}
      <div className="liquid-glass hud-corner p-6 sm:p-8 rounded-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--green-dim)] border border-[var(--green-primary)]/50 text-green text-[11px] font-mono mb-2">
            <Sparkles size={12} />
            <span>HACKATHON DELIVERABLES & ACTIONS</span>
          </div>
          <h3 className="font-hud text-xl sm:text-2xl font-black text-silver-bright">
            ESSENTIAL MISSION <span className="text-green">RESOURCES & SUBMISSION</span>
          </h3>
          <p className="text-xs font-mono text-silver-muted max-w-lg mx-auto mt-1">
            Download the official PowerPoint deck, submit mid-hackathon feedback, and upload final slides.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* ACTION 1: DOWNLOAD PPT TEMPLATE */}
          <div className="p-5 rounded-xl bg-black/50 border border-white/10 flex flex-col justify-between hover:border-[var(--green-primary)]/60 transition-all group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--green-dim)] text-green font-bold border border-[var(--green-primary)]/40">
                  STEP 1
                </span>
                <span className="text-[10px] font-mono text-silver-dark">OFFICIAL SLIDES</span>
              </div>

              <div className="font-hud text-base font-bold text-silver-bright mb-1.5 group-hover:text-green transition-colors flex items-center gap-2">
                <Presentation size={18} className="text-green shrink-0" />
                <span>PPT TEMPLATE</span>
              </div>

              <p className="text-xs font-mono text-silver-muted leading-relaxed mb-4">
                Official presentation slide deck template for your team to present before judges.
              </p>
            </div>

            <div>
              {pptTemplate ? (
                <a
                  href="/api/hackathon/ppt-template/download"
                  download={pptTemplate.originalName || 'Hackathon_PPT_Template.pptx'}
                  className="btn-primary w-full py-3.5 px-4 rounded-lg font-black text-xs sm:text-sm tracking-wider shadow-[0_0_25px_rgba(0,255,102,0.4)] hover:shadow-[0_0_40px_rgba(0,255,102,0.7)] flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  title={`Download ${pptTemplate.originalName}`}
                >
                  <Download size={18} />
                  <span>DOWNLOAD PPT TEMPLATE</span>
                </a>
              ) : (
                <div className="w-full py-3 px-3 rounded-lg bg-white/5 border border-white/10 text-center font-mono text-xs text-silver-dark cursor-not-allowed">
                  <div className="flex items-center justify-center gap-1.5 text-silver-muted">
                    <AlertCircle size={14} className="text-yellow-400 shrink-0" />
                    <span>Awaiting Organizer Upload</span>
                  </div>
                </div>
              )}

              <div className="text-[11px] font-mono text-silver-muted mt-2 text-center truncate">
                {pptTemplate ? (
                  <span className="text-green font-semibold">
                    {pptTemplate.originalName} ({formatFileSize(pptTemplate.size)})
                  </span>
                ) : (
                  <span>Admin will broadcast template shortly</span>
                )}
              </div>
            </div>
          </div>

          {/* ACTION 2: FEEDBACK FORM */}
          <div className="p-5 rounded-xl bg-black/50 border border-white/10 flex flex-col justify-between hover:border-[var(--green-primary)]/60 transition-all group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-silver-light font-bold border border-white/20">
                  STEP 2
                </span>
                <span className="text-[10px] font-mono text-silver-dark">MID-EVALUATION</span>
              </div>

              <div className="font-hud text-base font-bold text-silver-bright mb-1.5 group-hover:text-green transition-colors flex items-center gap-2">
                <FileSpreadsheet size={18} className="text-green shrink-0" />
                <span>FEEDBACK FORM</span>
              </div>

              <p className="text-xs font-mono text-silver-muted leading-relaxed mb-4">
                Submit queries, mentor review notes, and mid-round checkpoints with organizers.
              </p>
            </div>

            <div>
              <a
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary w-full py-3.5 px-4 rounded-lg font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer text-silver-bright hover:text-green"
              >
                <span>OPEN FEEDBACK FORM</span>
                <ExternalLink size={16} />
              </a>

              <div className="text-[11px] font-mono text-silver-muted mt-2 text-center">
                Opens Google Form in a new tab
              </div>
            </div>
          </div>

          {/* ACTION 3: PPT SUBMISSION */}
          <div className="p-5 rounded-xl bg-black/50 border border-white/10 flex flex-col justify-between hover:border-[var(--green-primary)]/60 transition-all group">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-silver-light font-bold border border-white/20">
                  STEP 3
                </span>
                <span className="text-[10px] font-mono text-silver-dark">FINAL ROUND</span>
              </div>

              <div className="font-hud text-base font-bold text-silver-bright mb-1.5 group-hover:text-green transition-colors flex items-center gap-2">
                <UploadCloud size={18} className="text-green shrink-0" />
                <span>PPT SUBMISSION</span>
              </div>

              <p className="text-xs font-mono text-silver-muted leading-relaxed mb-4">
                Submit your completed PowerPoint deck (.pptx / .pdf) to the official evaluation drive.
              </p>
            </div>

            <div>
              <a
                href={driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-silver w-full py-3.5 px-4 rounded-lg font-bold text-xs sm:text-sm tracking-wider border border-white/20 hover:border-[var(--green-primary)] text-silver-bright hover:text-green flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer bg-black/60 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              >
                <Presentation size={16} className="text-green" />
                <span>SUBMIT FINAL PPT</span>
                <ExternalLink size={16} />
              </a>

              <div className="text-[11px] font-mono text-silver-muted mt-2 text-center">
                Upload slides to Google Drive
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}

