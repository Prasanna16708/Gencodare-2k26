import React, { useState, useEffect } from 'react';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import CyberCursor from './components/common/CyberCursor';
import LoginScreen from './components/auth/LoginScreen';
import BootSequence from './components/auth/BootSequence';
import DomainReveal from './components/domain/DomainReveal';
import ProblemSelection from './components/problems/ProblemSelection';
import HackathonWorkspace from './components/workspace/HackathonWorkspace';
import AdminDashboard from './components/admin/AdminDashboard';
import { ApiService } from './services/api';

export default function App() {
  // Navigation / View state:
  // 'loading' | 'login' | 'boot' | 'domain-reveal' | 'problem-selection' | 'workspace' | 'admin'
  const [currentView, setCurrentView] = useState('loading');
  const [participant, setParticipant] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [domainProblems, setDomainProblems] = useState([]);
  const [hackathonStatus, setHackathonStatus] = useState(null);
  const [isFiring, setIsFiring] = useState(false);

  // Restore authenticated session on initial mount
  useEffect(() => {
    async function initSession() {
      try {
        const status = await ApiService.getHackathonStatus();
        setHackathonStatus(status);

        const token = ApiService.getToken();
        if (!token) {
          setCurrentView('login');
          return;
        }

        const session = await ApiService.getSession();
        if (session.role === 'admin') {
          setIsAdmin(true);
          setCurrentView('admin');
        } else if (session.role === 'participant') {
          setParticipant(session.participant);

          // Fetch the 10 problems for this participant's domain
          const problemsData = await ApiService.getProblems();
          setDomainProblems(problemsData.problems || []);

          // If the user already locked in & clicked FIRE in past session, jump straight to workspace!
          if (session.participant.hasFired && session.participant.selectedProblemId) {
            setCurrentView('workspace');
          } else {
            setCurrentView('problem-selection');
          }
        } else {
          setCurrentView('login');
        }
      } catch (err) {
        console.warn('Session restoration note:', err.message);
        ApiService.setToken(null);
        setCurrentView('login');
      }
    }

    initSession();
  }, []);

  // Handle Participant Login
  const handleLoginSuccess = async (identifier) => {
    const data = await ApiService.login(identifier);
    setParticipant(data.participant);
    setHackathonStatus(data.hackathon);

    // Fetch the 10 problems for this domain
    const problemsData = await ApiService.getProblems();
    setDomainProblems(problemsData.problems || []);

    // Check if returning user already fired
    if (data.participant.hasFired && data.participant.selectedProblemId) {
      // Direct restoration
      setCurrentView('workspace');
    } else {
      // First time / uncompleted: run cinematic boot sequence!
      setCurrentView('boot');
    }
  };

  // Boot sequence 3 -> 2 -> 1 finished
  const handleBootComplete = () => {
    setCurrentView('domain-reveal');
  };

  // Domain reveal screen finished
  const handleDomainRevealContinue = () => {
    setCurrentView('problem-selection');
  };

  // Select problem statement
  const handleSelectProblem = async (problemId) => {
    const res = await ApiService.selectProblem(problemId);
    setParticipant((prev) => ({
      ...prev,
      selectedProblemId: problemId,
      selectedProblem: res.problem,
    }));
  };

  // FIRE action: Locks problem, triggers cinematic energy and transitions to workspace
  const handleFireProblem = async (problemId) => {
    setIsFiring(true);
    try {
      const res = await ApiService.fireProblem(problemId);
      setParticipant((prev) => ({
        ...prev,
        selectedProblemId: problemId,
        selectedProblem: res.problem,
        hasFired: true,
      }));
      // Smoothly transition into workspace
      setCurrentView('workspace');
    } finally {
      setIsFiring(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await ApiService.logout();
    setParticipant(null);
    setIsAdmin(false);
    setCurrentView('login');
  };

  // Switch to Admin Terminal
  const handleToggleAdmin = () => {
    if (currentView === 'admin') {
      if (participant) {
        setCurrentView(participant.hasFired ? 'workspace' : 'problem-selection');
      } else {
        setCurrentView('login');
      }
    } else {
      setCurrentView('admin');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#030705] text-[#E2E8F0]">
      {/* Sleek Normal Green Glow Cursor (No Trail) */}
      <CyberCursor />

      {/* Header */}
      <Header
        participant={participant}
        isAdmin={isAdmin || currentView === 'admin'}
        onLogout={handleLogout}
        onToggleAdmin={handleToggleAdmin}
        currentView={currentView}
      />

      {/* Main View Router */}
      <main className={`flex-1 flex flex-col ${currentView === 'login' ? 'justify-center' : ''}`}>
        {/* Loading State */}
        {currentView === 'loading' && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-12 h-12 border-2 border-[var(--green-primary)] border-t-transparent rounded-full animate-spin mb-4" />
            <div className="text-xs font-mono text-green tracking-widest uppercase">
              DECRYPTING COMMAND TERMINAL...
            </div>
          </div>
        )}

        {/* 1. Login Screen */}
        {currentView === 'login' && (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onAdminDirect={() => setCurrentView('admin')}
          />
        )}

        {/* 2. Boot Sequence (3 -> 2 -> 1) */}
        {currentView === 'boot' && (
          <BootSequence onComplete={handleBootComplete} />
        )}

        {/* 3. Domain Reveal */}
        {currentView === 'domain-reveal' && (
          <DomainReveal
            domain={participant?.domainInfo}
            participant={participant}
            onContinue={handleDomainRevealContinue}
          />
        )}

        {/* 4. Problem Selection (10 Domain Problems + 🔥 FIRE button) */}
        {currentView === 'problem-selection' && (
          <ProblemSelection
            domain={participant?.domainInfo}
            problems={domainProblems}
            selectedProblemId={participant?.selectedProblemId}
            onSelectProblem={handleSelectProblem}
            onFireProblem={handleFireProblem}
            isFiring={isFiring}
          />
        )}

        {/* 5. Main Hackathon Workspace (Carousel -> 24h Timer -> Selected Problem -> Feedback Form) */}
        {currentView === 'workspace' && (
          <HackathonWorkspace
            participant={participant}
            domain={participant?.domainInfo}
            hackathon={hackathonStatus}
          />
        )}

        {/* 6. Protected Admin Dashboard */}
        {currentView === 'admin' && (
          <AdminDashboard
            onExitAdmin={() => {
              if (participant) {
                setCurrentView(participant.hasFired ? 'workspace' : 'problem-selection');
              } else {
                setCurrentView('login');
              }
            }}
          />
        )}
      </main>

      {/* Footer (Strictly: © 2026 PRASANNA — ACTioner) */}
      <Footer />
    </div>
  );
}
