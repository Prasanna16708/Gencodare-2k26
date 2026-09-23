import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Target, CheckCircle2, ArrowRight, X, Sparkles, Layers, Shield, Clock, Presentation, Download } from 'lucide-react';
import { ApiService } from '../../services/api';

export default function ProblemSelection({
  domain,
  problems: initialProblems = [],
  selectedProblemId,
  onSelectProblem,
  onFireProblem,
  isFiring,
}) {
  const [problems, setProblems] = useState(initialProblems);
  const [countdownStr, setCountdownStr] = useState('');
  const [pptTemplate, setPptTemplate] = useState(null);

  // Selected Problem ID
  const [selectedId, setSelectedId] = useState(selectedProblemId || null);

  // Active Detail Modal Problem
  const [detailProblem, setDetailProblem] = useState(null);
  const [localFiring, setLocalFiring] = useState(false);

  // Load template info
  useEffect(() => {
    async function loadTemplate() {
      try {
        const info = await ApiService.getPptTemplateInfo();
        if (info && info.hasTemplate) {
          setPptTemplate(info.template);
        }
      } catch (e) {}
    }
    loadTemplate();
  }, []);

  // Sync live countdown
  useEffect(() => {
    let timer;
    async function syncTimer() {
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
      } catch (err) {}
    }
    syncTimer();
    return () => clearInterval(timer);
  }, []);

  // Keep state in sync with assigned domain problems
  useEffect(() => {
    if (initialProblems) {
      setProblems(initialProblems);
    }
  }, [initialProblems]);

  // Open detail modal when clicking [SELECT] or card
  const handleOpenDetail = (problem) => {
    setDetailProblem(problem);
  };

  // Confirm selection & FIRE from detail modal
  const handleConfirmSelection = async (problemId) => {
    if (localFiring || isFiring) return;
    setSelectedId(problemId);
    setLocalFiring(true);

    try {
      confetti({
        particleCount: 65,
        spread: 80,
        origin: { y: 0.75 },
        colors: ['#00FF66', '#ffffff', '#94a3b8', '#10b981'],
        disableForReducedMotion: true,
      });
    } catch (e) {
      // Confetti fallback
    }

    try {
      if (onSelectProblem) {
        await onSelectProblem(problemId);
      }
      setTimeout(async () => {
        try {
          await onFireProblem(problemId);
        } catch (err) {
          console.error('Error firing problem:', err);
          setLocalFiring(false);
        }
      }, 600);
    } catch (err) {
      console.error('Error selecting problem:', err);
      setLocalFiring(false);
    }
  };

  return (
    <div className="layout-container py-6 px-4 relative">
      
      {/* Header Section */}
      <div className="mb-6 border-b border-white/10 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded bg-[var(--green-dim)] border border-[var(--green-primary)]/40 text-green text-xs font-mono mb-1">
              <Target size={13} />
              <span>DOOMSDAY MISSION SELECTOR</span>
            </div>
            <h1 className="font-hud text-xl sm:text-2xl font-black text-silver-bright tracking-wide">
              CHOOSE YOUR <span className="text-green">CHALLENGE</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {pptTemplate && (
              <a
                href="/api/hackathon/ppt-template/download"
                download={pptTemplate.originalName || 'Hackathon_Template.pptx'}
                className="btn-secondary text-xs py-1.5 px-3 rounded flex items-center gap-1.5 text-green border-[var(--green-primary)]/40 hover:border-[var(--green-primary)] shadow-[0_0_12px_rgba(0,255,102,0.2)] transition-all cursor-pointer"
                title={`Download Official PPT Template: ${pptTemplate.originalName}`}
              >
                <Presentation size={14} className="text-green" />
                <span className="hidden sm:inline font-bold">PPT TEMPLATE</span>
                <Download size={13} />
              </a>
            )}
            {countdownStr && (
              <div className="flex items-center gap-2 px-3 py-1 rounded bg-black/70 border border-[var(--green-primary)]/50 text-green font-mono text-xs shadow-[0_0_12px_rgba(0,255,102,0.25)]">
                <Clock size={14} className="text-green animate-pulse" />
                <span className="text-silver-muted text-[10px] hidden sm:inline">24H TIMELOCK:</span>
                <span className="font-bold tracking-widest text-xs sm:text-sm text-green">{countdownStr}</span>
              </div>
            )}
            <div className="text-xs font-mono text-silver-muted hidden lg:block">
              Click <span className="text-green font-bold">[SELECT]</span> to view full directive & lock in.
            </div>
          </div>
        </div>

        {/* Participant's Assigned Domain Badge (Strictly isolated) */}
        <div className="flex items-center gap-2.5 pb-1">
          <div className="px-3.5 py-1.5 rounded text-xs font-mono font-bold bg-[var(--green-primary)] text-black border border-[var(--green-primary)] shadow-[0_0_12px_rgba(0,255,102,0.4)] flex items-center gap-2">
            <Layers size={14} />
            <span>ALLOCATED DOMAIN: {domain?.name?.toUpperCase() || 'ASSIGNED SECTOR'}</span>
          </div>
          <span className="text-[11px] font-mono text-silver-muted hidden sm:inline">
            // DOMAIN ISOLATION ACTIVE
          </span>
        </div>
      </div>

      {/* Empty State when no problems exist for domain */}
      {problems.length === 0 ? (
        <div className="liquid-glass hud-corner p-8 sm:p-12 text-center border border-white/10 my-8">
          <Target size={36} className="mx-auto text-silver-muted mb-3 opacity-60" />
          <h3 className="font-hud text-lg sm:text-xl text-silver-bright mb-2 tracking-wide">
            AWAITING MISSION DIRECTIVES
          </h3>
          <p className="text-xs font-mono text-silver-muted max-w-md mx-auto leading-relaxed">
            No problem statements have been activated for <span className="text-green font-semibold">{domain?.name || 'this domain'}</span> yet. The administrator will upload the official directives shortly.
          </p>
        </div>
      ) : (
        /* Compact, Clean, Scannable Responsive Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-12">
          {problems.map((problem) => {
            const isSelected = selectedId === problem.id;

            return (
              <div
                key={problem.id}
                onClick={() => handleOpenDetail(problem)}
                className={`liquid-glass hud-corner p-3.5 rounded-lg border transition-all duration-200 cursor-pointer flex flex-col justify-between group relative min-h-[96px] ${
                  isSelected
                    ? 'border-[var(--green-primary)] bg-[var(--green-primary)]/10 shadow-[0_0_15px_rgba(0,255,102,0.25)]'
                    : 'border-white/15 bg-black/60 hover:border-[var(--green-primary)] hover:bg-black/85 hover:shadow-[0_0_12px_rgba(0,255,102,0.2)]'
                }`}
              >
                {/* Top Row: [ID] + [SELECT] */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-black/80 text-[var(--green-primary)] border border-[var(--green-primary)]/40 tracking-wider">
                    [{problem.id}]
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenDetail(problem);
                    }}
                    className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--green-primary)] text-black shadow-[0_0_8px_#00FF66]'
                        : 'bg-white/10 text-silver-bright hover:bg-[var(--green-primary)] hover:text-black border border-white/20 hover:border-[var(--green-primary)]'
                    }`}
                  >
                    {isSelected ? 'SELECTED' : 'SELECT'}
                  </button>
                </div>

                {/* Main Content: Title Only */}
                <h3 className="font-hud font-bold text-xs sm:text-sm text-silver-bright leading-snug group-hover:text-white transition-colors line-clamp-2">
                  {problem.title}
                </h3>
              </div>
            );
          })}
        </div>
      )}

      {/* Problem Statement Details Modal */}
      {detailProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="liquid-glass hud-corner w-full max-w-2xl border-2 border-[var(--green-primary)] shadow-[0_0_50px_rgba(0,255,102,0.3)] bg-[#040a06] p-6 sm:p-8 rounded-xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded bg-[var(--green-primary)] text-black shadow-[0_0_8px_#00FF66]">
                  [{detailProblem.id}]
                </span>
                <span className="text-[11px] font-mono text-silver-muted uppercase tracking-wider">
                  {currentDomainObj?.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailProblem(null)}
                className="p-1 rounded text-silver-muted hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Full Title */}
            <h2 className="font-hud text-lg sm:text-2xl font-black text-silver-bright mb-4 leading-snug">
              {detailProblem.title}
            </h2>

            {/* Full Description & Metadata */}
            <div className="space-y-4 mb-6">
              <div>
                <div className="text-[11px] font-mono text-silver-muted uppercase tracking-wider mb-1">
                  PROBLEM DIRECTIVE & BRIEF
                </div>
                <p className="text-xs sm:text-sm font-mono text-silver-main leading-relaxed bg-black/50 p-4 rounded-lg border border-white/10">
                  {detailProblem.description}
                </p>
              </div>

              {detailProblem.keyMetrics && (
                <div>
                  <div className="text-[11px] font-mono text-silver-muted uppercase tracking-wider mb-1">
                    TARGET KEY METRICS
                  </div>
                  <div className="text-xs font-mono text-green bg-black/50 p-3 rounded-lg border border-[var(--green-primary)]/30">
                    {detailProblem.keyMetrics}
                  </div>
                </div>
              )}

              {detailProblem.deliverables && (
                <div>
                  <div className="text-[11px] font-mono text-silver-muted uppercase tracking-wider mb-1">
                    EXPECTED DELIVERABLES
                  </div>
                  <div className="text-xs font-mono text-silver-bright bg-black/50 p-3 rounded-lg border border-white/10">
                    {detailProblem.deliverables}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDetailProblem(null)}
                className="btn-secondary w-full sm:w-auto py-2.5 px-5 text-xs font-mono cursor-pointer"
              >
                Back to Missions
              </button>

              <button
                type="button"
                onClick={() => handleConfirmSelection(detailProblem.id)}
                disabled={localFiring || isFiring}
                className="btn-primary w-full sm:w-auto py-3 px-8 text-sm font-black shadow-[0_0_25px_rgba(0,255,102,0.5)] flex items-center justify-center gap-2 cursor-pointer"
              >
                {localFiring ? (
                  <>
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    <span>INITIALIZING MISSION...</span>
                  </>
                ) : (
                  <>
                    <span>🔥</span>
                    <span>LOCK IN & FIRE OBJECTIVE</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
