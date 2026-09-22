import React, { useState, useEffect } from 'react';
import {
  Shield,
  Upload,
  Trash2,
  MoveUp,
  MoveDown,
  RefreshCw,
  Clock,
  Users,
  CheckCircle,
  FileText,
  AlertTriangle,
  ExternalLink,
  Layers,
  ArrowRight,
  Sliders,
  Plus,
  FileSpreadsheet,
  Download,
  Check,
  X,
  Edit,
  Search,
  Target,
  Filter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ApiService } from '../../services/api';

export default function AdminDashboard({ onExitAdmin }) {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);

  // Dashboard Data
  const [activeTab, setActiveTab] = useState('roster'); // 'roster' | 'analytics' | 'carousel' | 'timer' | 'participants'
  const [stats, setStats] = useState(null);
  const [carouselItems, setCarouselItems] = useState([]);
  const [participantsList, setParticipantsList] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Roster Upload State
  const [jsonInput, setJsonInput] = useState('');
  const [rosterError, setRosterError] = useState('');
  const [rosterFilter, setRosterFilter] = useState('');
  const [excelParsedData, setExcelParsedData] = useState(null);
  const [excelFileName, setExcelFileName] = useState('');
  const [isUploadingRoster, setIsUploadingRoster] = useState(false);

  // Single Student Quick Add
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentPhone, setNewStudentPhone] = useState('');
  const [newStudentGmail, setNewStudentGmail] = useState('');
  const [newStudentDomain, setNewStudentDomain] = useState('generative-ai');

  // Problem Statements Management State
  const [problemsList, setProblemsList] = useState([]);
  const [problemDomainFilter, setProblemDomainFilter] = useState('all');
  const [problemSearchQuery, setProblemSearchQuery] = useState('');

  // Problem Modals
  const [problemModalMode, setProblemModalMode] = useState(null); // 'add' | 'edit' | null
  const [problemFormData, setProblemFormData] = useState({
    domain: 'generative-ai',
    id: '',
    title: '',
    description: '',
    difficulty: 'Advanced',
    keyMetrics: '',
    deliverables: '',
  });
  const [problemFormError, setProblemFormError] = useState('');
  const [isSavingProblem, setIsSavingProblem] = useState(false);

  // Delete Problem Confirmation Dialog
  const [deletingProblem, setDeletingProblem] = useState(null);

  // Bulk Upload Modal
  const [bulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [bulkParsedRows, setBulkParsedRows] = useState([]);
  const [bulkFileName, setBulkFileName] = useState('');
  const [bulkUploadError, setBulkUploadError] = useState('');
  const [isImportingBulk, setIsImportingBulk] = useState(false);

  // Timer Control State
  const [durationHours, setDurationHours] = useState(24);
  const [feedbackUrl, setFeedbackUrl] = useState('');
  const [pptUrl, setPptUrl] = useState('');

  // Check if session is already admin
  useEffect(() => {
    async function checkAdmin() {
      try {
        const session = await ApiService.getSession();
        if (session && session.role === 'admin') {
          setIsAdminAuth(true);
        }
      } catch (e) {
        // Not logged in
      }
    }
    checkAdmin();
  }, []);

  const fetchAdminData = async () => {
    setLoadingData(true);
    try {
      const [statsData, carouselData, partData, problemsData] = await Promise.all([
        ApiService.adminGetStats(),
        ApiService.getCarousel(),
        ApiService.adminGetParticipants(),
        ApiService.adminGetAllProblems(),
      ]);
      setStats(statsData);
      setCarouselItems(carouselData || []);
      setParticipantsList(partData || []);
      setProblemsList(problemsData?.problems || []);
      if (statsData?.timer?.durationHours) {
        setDurationHours(statsData.timer.durationHours);
      }
      if (statsData?.timer?.feedbackFormUrl) {
        setFeedbackUrl(statsData.timer.feedbackFormUrl);
      }
      if (statsData?.timer?.pptSubmissionUrl) {
        setPptUrl(statsData.timer.pptSubmissionUrl);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAdminAuth) {
      fetchAdminData();
    }
  }, [isAdminAuth]);

  // Admin Login Submit
  const handleAdminLogin = async (e) => {
    if (e) e.preventDefault();
    if (!password) {
      setLoginError('PLEASE ENTER COMMAND PASSCODE');
      return;
    }
    setLoginError('');
    setLoadingLogin(true);
    try {
      await ApiService.adminLogin(password);
      setIsAdminAuth(true);
    } catch (err) {
      setLoginError(err.message || 'ACCESS DENIED: Invalid Command Passcode.');
    } finally {
      setLoadingLogin(false);
    }
  };

  // Carousel Upload State (Supports multiple images)
  const [uploadFiles, setUploadFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideCaption, setSlideCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  // Carousel Handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadFiles(files);
      setPreviewUrls(files.map((f) => URL.createObjectURL(f)));
    }
  };

  const handleUploadCarousel = async (e) => {
    e.preventDefault();
    if (!uploadFiles || uploadFiles.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    uploadFiles.forEach((file) => {
      formData.append('images', file);
    });
    if (slideTitle) formData.append('title', slideTitle);
    if (slideCaption) formData.append('caption', slideCaption);

    try {
      const res = await ApiService.adminUploadCarousel(formData);
      setActionMessage(res.message || `${uploadFiles.length} IMAGE(S) BROADCASTED TO CAROUSEL`);
      setUploadFiles([]);
      setPreviewUrls([]);
      setSlideTitle('');
      setSlideCaption('');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage(`UPLOAD FAILED: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteCarousel = async (id) => {
    try {
      await ApiService.adminDeleteCarousel(id);
      fetchAdminData();
      setActionMessage('CAROUSEL SLIDE REMOVED');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      setActionMessage(`DELETE ERROR: ${err.message}`);
    }
  };

  const handleMoveSlide = async (index, direction) => {
    const newItems = [...carouselItems];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setCarouselItems(newItems);
    try {
      await ApiService.adminReorderCarousel(newItems.map((i) => i.id));
      setActionMessage('CAROUSEL SEQUENCE UPDATED');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Timer Handlers
  const handleResetHackathon = async () => {
    if (!window.confirm('RESET 24-HOUR HACKATHON COUNTDOWN TO NOW?')) return;
    try {
      await ApiService.adminResetHackathon(durationHours);
      setActionMessage('HACKATHON RESET TO FRESH 24-HOUR COUNTDOWN');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage(`RESET ERROR: ${err.message}`);
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await ApiService.adminUpdateHackathon({
        durationHours: Number(durationHours),
        feedbackFormUrl: feedbackUrl,
        pptSubmissionUrl: pptUrl,
      });
      setActionMessage('SETTINGS & TIMING APPLIED AUTHORITATIVELY');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage(`UPDATE ERROR: ${err.message}`);
    }
  };

  // Roster Parsing Helper
  const parseParticipantRows = (rawRows) => {
    return rawRows.map((row, idx) => {
      let name = '';
      let phone = '';
      let gmail = '';
      let domain = '';

      for (const [key, val] of Object.entries(row)) {
        const k = key.trim().toLowerCase().replace(/[_\s-]+/g, '');
        const strVal = String(val !== undefined && val !== null ? val : '').trim();

        if (!name && (k.includes('name') || k === 'student' || k === 'participant' || k === 'candidate' || k === 'studentname')) {
          name = strVal;
        } else if (!phone && (k.includes('phone') || k.includes('mobile') || k.includes('contact') || k.includes('whatsapp') || k === 'cell' || k === 'tel')) {
          phone = strVal;
        } else if (!gmail && (k.includes('mail') || k.includes('email') || k === 'gmail')) {
          gmail = strVal;
        } else if (!domain && (k.includes('domain') || k.includes('track') || k.includes('category') || k.includes('stream') || k.includes('specialization') || k === 'branch')) {
          domain = strVal;
        }
      }

      // If name is still empty, look at the first non-empty value
      if (!name) {
        const values = Object.values(row).map((v) => String(v).trim()).filter(Boolean);
        if (values.length > 0) {
          name = values[0];
        }
      }

      // Domain normalization
      let d = domain.toLowerCase();
      if (d.includes('gen') || d.includes('llm') || d.includes('gpt')) d = 'generative-ai';
      else if (d.includes('health') || d.includes('med')) d = 'ai-healthcare';
      else if (d.includes('edu') || d.includes('learn') || d.includes('teach')) d = 'ai-education';
      else if (d.includes('fin') || d.includes('bank') || d.includes('crypto')) d = 'fintech';
      else d = 'generative-ai';

      return {
        name: name || `Participant ${idx + 1}`,
        phone: phone,
        gmail: gmail.toLowerCase(),
        domain: d,
      };
    }).filter((p) => p.name || p.phone || p.gmail);
  };

  // Handle Excel File Selection & Parse
  const handleExcelFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setRosterError('');
    setExcelParsedData(null);
    setExcelFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Workbook contains no sheets.');
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('No data rows found in the selected Excel sheet.');
        }

        const parsed = parseParticipantRows(rawRows);
        if (parsed.length === 0) {
          throw new Error('Could not identify student columns. Please ensure columns include Student Name, Email/Gmail, Phone, or Domain.');
        }

        setExcelParsedData(parsed);
      } catch (err) {
        setRosterError(`EXCEL PARSE ERROR: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Confirm Excel Upload to Backend
  const handleConfirmExcelUpload = async () => {
    if (!excelParsedData || excelParsedData.length === 0) return;
    setIsUploadingRoster(true);
    setRosterError('');
    try {
      await ApiService.adminUploadParticipants(excelParsedData);
      setActionMessage(`SUCCESSFULLY SYNCED ${excelParsedData.length} STUDENTS FROM EXCEL TO SERVER`);
      setExcelParsedData(null);
      setExcelFileName('');
      const fileInput = document.getElementById('excelFileInput');
      if (fileInput) fileInput.value = '';
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 5000);
    } catch (err) {
      setRosterError(`UPLOAD FAILED: ${err.message}`);
    } finally {
      setIsUploadingRoster(false);
    }
  };

  // Download Sample Excel Template
  const handleDownloadExcelTemplate = () => {
    const sampleData = [
      {
        "Student Name": "Alex Chen",
        "Email Address": "alex.chen@college.edu",
        "Phone Number": "9876543210",
        "Domain Track": "generative-ai"
      },
      {
        "Student Name": "Sarah Jenkins",
        "Email Address": "sarah.j@college.edu",
        "Phone Number": "9876543211",
        "Domain Track": "ai-healthcare"
      },
      {
        "Student Name": "Dev Patel",
        "Email Address": "dev.patel@college.edu",
        "Phone Number": "9876543212",
        "Domain Track": "fintech"
      },
      {
        "Student Name": "Aisha Khan",
        "Email Address": "aisha.k@college.edu",
        "Phone Number": "9876543213",
        "Domain Track": "ai-education"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 20 }, { wch: 28 }, { wch: 18 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants");
    XLSX.writeFile(wb, "Hackathon_Participants_Template.xlsx");
  };

  // Export current participants roster to Excel
  const handleExportToExcel = () => {
    if (!participantsList || participantsList.length === 0) return;
    const exportData = participantsList.map((p, idx) => ({
      "S.No": idx + 1,
      "Student Name": p.name,
      "Gmail / Email": p.gmail,
      "Phone Number": p.phone,
      "Domain Track": p.domain,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 8 }, { wch: 22 }, { wch: 30 }, { wch: 18 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Participants_Roster");
    XLSX.writeFile(wb, `Participants_Roster_${Date.now()}.xlsx`);
  };

  const handleExportSelections = () => {
    if (!stats || !stats.selectedProblems || stats.selectedProblems.length === 0) {
      alert('NO PARTICIPANT PROBLEM SELECTIONS TO EXPORT');
      return;
    }

    const exportData = stats.selectedProblems.map((sp, idx) => ({
      "S.No": idx + 1,
      "Participant Name": sp.participantName || "N/A",
      "Gmail / Email": sp.gmail || "N/A",
      "Phone Number": sp.phone || "N/A",
      "Domain Track": sp.domain || "N/A",
      "Selected Problem ID": sp.problemId || "N/A",
      "Fire Status": sp.hasFired ? "FIRED & ARMED" : "Selected",
      "Selection Timestamp": sp.selectedAt ? new Date(sp.selectedAt).toLocaleString() : "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 24 },
      { wch: 32 },
      { wch: 18 },
      { wch: 22 },
      { wch: 24 },
      { wch: 18 },
      { wch: 24 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mission_Selections");
    const dateStr = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `Participant_Mission_Selections_${dateStr}.xlsx`);
    setActionMessage('MISSION SELECTIONS EXPORTED TO EXCEL (.XLSX)');
    setTimeout(() => setActionMessage(''), 3500);
  };

  const handleJsonPasteSubmit = async (e) => {
    e.preventDefault();
    if (!jsonInput.trim()) return;
    setRosterError('');
    try {
      let parsed = [];
      const trimmed = jsonInput.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        const jsonResult = JSON.parse(trimmed);
        parsed = Array.isArray(jsonResult) ? jsonResult : [jsonResult];
      } else {
        const workbook = XLSX.read(trimmed, { type: 'string' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json(firstSheet, { defval: '' });
        parsed = parseParticipantRows(rawRows);
      }

      if (parsed.length === 0) {
        throw new Error('No valid participant records found in the pasted content.');
      }

      await ApiService.adminUploadParticipants(parsed);
      setActionMessage(`UPLOADED ${parsed.length} CREDENTIALS TO PARTICIPANT ROSTER`);
      setJsonInput('');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setRosterError(`PARSE ERROR: ${err.message}`);
    }
  };

  const handleQuickAddStudent = async (e) => {
    e.preventDefault();
    if (!newStudentName.trim() || (!newStudentGmail.trim() && !newStudentPhone.trim())) {
      setRosterError('STUDENT NAME AND AT LEAST GMAIL OR PHONE NUMBER ARE REQUIRED');
      return;
    }
    const updated = [
      ...participantsList,
      {
        name: newStudentName.trim(),
        phone: newStudentPhone.trim(),
        gmail: newStudentGmail.trim().toLowerCase(),
        domain: newStudentDomain,
      },
    ];
    try {
      await ApiService.adminUploadParticipants(updated);
      setActionMessage(`REGISTERED ${newStudentName.trim()} IN ${newStudentDomain.toUpperCase()}`);
      setNewStudentName('');
      setNewStudentPhone('');
      setNewStudentGmail('');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setRosterError(`REGISTRATION ERROR: ${err.message}`);
    }
  };

  const handleDeleteParticipant = async (participant) => {
    const idToUse = participant.gmail || participant.phone || participant.name;
    if (!idToUse) return;

    const confirmed = window.confirm(
      `EXPUNGE PARTICIPANT:\n\nAre you sure you want to permanently delete "${participant.name}" (${idToUse}) from the active roster?`
    );
    if (!confirmed) return;

    try {
      await ApiService.adminDeleteParticipant(idToUse);
      setActionMessage(`AGENT ${participant.name.toUpperCase()} EXPUNGED FROM ROSTER`);
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage(`DELETE ERROR: ${err.message}`);
    }
  };

  // ==================== PROBLEM STATEMENT HANDLERS ====================

  const handleOpenAddProblem = () => {
    setProblemModalMode('add');
    setProblemFormData({
      domain: problemDomainFilter !== 'all' ? problemDomainFilter : 'generative-ai',
      id: '',
      title: '',
      description: '',
      difficulty: 'Advanced',
      keyMetrics: '',
      deliverables: '',
    });
    setProblemFormError('');
  };

  const handleOpenEditProblem = (p) => {
    setProblemModalMode('edit');
    setProblemFormData({
      domain: p.domain || 'generative-ai',
      id: p.id,
      title: p.title || '',
      description: p.description || '',
      difficulty: p.difficulty || 'Advanced',
      keyMetrics: p.keyMetrics || '',
      deliverables: p.deliverables || '',
      originalId: p.id,
    });
    setProblemFormError('');
  };

  const handleSaveProblemSubmit = async (e) => {
    e.preventDefault();
    if (!problemFormData.id.trim() || !problemFormData.title.trim() || !problemFormData.description.trim()) {
      setProblemFormError('DOMAIN, ID, TITLE, AND DESCRIPTION ARE ALL REQUIRED.');
      return;
    }
    setProblemFormError('');
    setIsSavingProblem(true);
    try {
      if (problemModalMode === 'add') {
        const res = await ApiService.adminCreateProblem(problemFormData);
        setActionMessage(res.message || `PROBLEM STATEMENT ${problemFormData.id} CREATED`);
      } else {
        const res = await ApiService.adminUpdateProblem(problemFormData.originalId || problemFormData.id, problemFormData);
        setActionMessage(res.message || `PROBLEM STATEMENT ${problemFormData.id} UPDATED`);
      }
      setProblemModalMode(null);
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setProblemFormError(`SAVE FAILED: ${err.message}`);
    } finally {
      setIsSavingProblem(false);
    }
  };

  const handleConfirmDeleteProblem = async () => {
    if (!deletingProblem) return;
    try {
      await ApiService.adminDeleteProblem(deletingProblem.id);
      setActionMessage(`PROBLEM STATEMENT ${deletingProblem.id} EXPUNGED FROM DATABASE`);
      setDeletingProblem(null);
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setActionMessage(`DELETE FAILED: ${err.message}`);
    }
  };

  const handleBulkFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkUploadError('');
    setBulkFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('Workbook contains no sheets.');
        }
        const sheet = workbook.Sheets[firstSheetName];
        const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('No data rows found in the selected Excel sheet.');
        }

        const validDomains = ['generative-ai', 'ai-healthcare', 'ai-education', 'fintech'];
        const domainMap = {
          'gen': 'generative-ai',
          'generative': 'generative-ai',
          'llm': 'generative-ai',
          'health': 'ai-healthcare',
          'med': 'ai-healthcare',
          'hc': 'ai-healthcare',
          'edu': 'ai-education',
          'education': 'ai-education',
          'learn': 'ai-education',
          'fin': 'fintech',
          'finance': 'fintech',
        };

        const parsed = rawRows.map((row, idx) => {
          let id = '';
          let domain = '';
          let title = '';
          let description = '';

          for (const [key, val] of Object.entries(row)) {
            const k = key.trim().toLowerCase().replace(/[_\s-]+/g, '');
            const strVal = String(val !== undefined && val !== null ? val : '').trim();

            if (!id && (k === 'id' || k === 'problemid' || k === 'code' || k === 'statementid')) {
              id = strVal.toUpperCase();
            } else if (!domain && (k === 'domain' || k === 'track' || k === 'category' || k === 'stream')) {
              domain = strVal;
            } else if (!title && (k === 'title' || k === 'name' || k === 'problemtitle' || k === 'statementtitle')) {
              title = strVal;
            } else if (!description && (k.includes('desc') || k.includes('brief') || k.includes('detail'))) {
              description = strVal;
            }
          }

          let normDomain = domain.toLowerCase().trim();
          if (!validDomains.includes(normDomain)) {
            let matched = false;
            for (const [kw, dId] of Object.entries(domainMap)) {
              if (normDomain.includes(kw)) {
                normDomain = dId;
                matched = true;
                break;
              }
            }
            if (!matched) normDomain = 'generative-ai';
          }

          let isValid = true;
          let errorReason = '';

          if (!id) {
            isValid = false;
            errorReason = 'Missing Problem ID';
          } else if (!title) {
            isValid = false;
            errorReason = 'Missing Problem Title';
          }

          return {
            id,
            domain: normDomain,
            title,
            description: description || title,
            isValid,
            errorReason,
          };
        });

        setBulkParsedRows(parsed);
      } catch (err) {
        setBulkUploadError(`PARSE ERROR: ${err.message}`);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleConfirmBulkImport = async () => {
    const validRows = bulkParsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;
    setIsImportingBulk(true);
    setBulkUploadError('');
    try {
      const res = await ApiService.adminBulkUploadProblems(validRows);
      setActionMessage(res.message || `IMPORTED ${validRows.length} PROBLEM STATEMENTS`);
      setBulkUploadModalOpen(false);
      setBulkParsedRows([]);
      setBulkFileName('');
      fetchAdminData();
      setTimeout(() => setActionMessage(''), 4000);
    } catch (err) {
      setBulkUploadError(`IMPORT FAILED: ${err.message}`);
    } finally {
      setIsImportingBulk(false);
    }
  };

  const handleDownloadProblemTemplate = () => {
    const sampleData = [
      {
        "ID": "GEN-11",
        "DOMAIN": "Generative AI & LLM",
        "TITLE": "Multi-Modal Autonomous Agent for Automated System Forensics",
        "DESCRIPTION": "Design an autonomous agent capable of analyzing telemetry and server logs to determine root cause and suggest automated remediation."
      },
      {
        "ID": "HLT-11",
        "DOMAIN": "AI for Healthcare",
        "TITLE": "Edge-Powered Diagnostic Triaging for Emergency Telemedicine",
        "DESCRIPTION": "Build an offline-capable edge model assisting field paramedics in triaging vital patient signs with instant anomaly alerts."
      },
      {
        "ID": "EDU-11",
        "DOMAIN": "AI for Education",
        "TITLE": "Adaptive Multi-Lingual STEM Curriculum Synthesizer",
        "DESCRIPTION": "Create an intelligent tutor adjusting explanation complexity and generating custom practice challenges dynamically."
      },
      {
        "ID": "FIN-11",
        "DOMAIN": "FinTech",
        "TITLE": "Real-Time Graph Forensic Network for Synthesized Fraud Rings",
        "DESCRIPTION": "Engineer an on-chain and off-chain transaction graph analyzer uncovering synthetic identity fraud clusters in real-time."
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws['!cols'] = [{ wch: 12 }, { wch: 24 }, { wch: 40 }, { wch: 60 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Problems");
    XLSX.writeFile(wb, "Problem_Statements_Template.xlsx");
  };

  const handleExportProblemsToExcel = () => {
    if (!problemsList || problemsList.length === 0) return;
    const exportData = problemsList.map((p, idx) => ({
      "S.No": idx + 1,
      "ID": p.id,
      "Domain": p.domainName || p.domain,
      "Title": p.title,
      "Description": p.description,
      "Difficulty": p.difficulty || 'Advanced',
      "Key Metrics": p.keyMetrics || '',
      "Deliverables": p.deliverables || '',
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    ws['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 24 }, { wch: 40 }, { wch: 60 }, { wch: 14 }, { wch: 30 }, { wch: 30 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "All_Problems");
    XLSX.writeFile(wb, `Problem_Statements_Catalog_${Date.now()}.xlsx`);
  };

  // Unauthenticated Admin Passcode Screen
  if (!isAdminAuth) {
    return (
      <div className="w-full flex-1 flex items-center justify-center py-6 sm:py-10 px-4">
        <div className="w-full max-w-[390px] mx-auto liquid-glass hud-corner p-5 sm:p-7 border border-[var(--green-primary)]/40 shadow-[0_0_45px_rgba(0,0,0,0.9)] relative overflow-hidden animate-fade-in">
          
          {/* Ambient Top Glow */}
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-40 h-16 bg-[var(--green-primary)]/15 blur-2xl pointer-events-none" />

          {/* Tactical Header */}
          <div className="text-center mb-5 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[var(--green-dim)] border border-[var(--green-primary)]/30 text-[10px] font-mono text-green mb-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--green-primary)] animate-pulse" />
              SECURITY // CLEARANCE LEVEL-0
            </div>

            <div className="w-11 h-11 mx-auto mb-2.5 rounded-lg bg-black/70 border border-[var(--green-primary)]/60 flex items-center justify-center text-[var(--green-primary)] shadow-[0_0_15px_rgba(0,255,102,0.3)]">
              <Shield size={20} />
            </div>

            <h2 className="font-hud text-xl font-black text-silver-bright tracking-wide mb-1">
              COMMAND <span className="text-green">ADMIN</span>
            </h2>
            <p className="text-silver-muted text-xs font-mono max-w-xs mx-auto leading-relaxed">
              Authorized organizers only. Enter command passcode.
            </p>
          </div>

          {/* Error Notification */}
          {loginError && (
            <div className="mb-4 p-3 rounded-md bg-black/85 border border-red-500/70 text-silver-bright text-xs font-mono flex items-start gap-2.5 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-fade-in">
              <AlertTriangle size={15} className="text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1 text-left">
                <div className="text-red-400 font-bold text-[11px] tracking-wide">ACCESS DENIED</div>
                <div className="text-[11px] text-silver-muted leading-tight">{loginError}</div>
              </div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAdminLogin} className="space-y-4 relative z-10">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider text-silver-main mb-1.5">
                <span>Command Passcode</span>
                <span className="text-[10px] text-silver-dark font-normal">[DEFAULT: admin]</span>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (loginError) setLoginError('');
                }}
                placeholder="••••••••"
                className="cyber-input text-center text-xs sm:text-sm py-2.5 font-mono tracking-widest"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loadingLogin}
              className="btn-primary w-full py-2.5 px-4 text-xs sm:text-sm font-bold tracking-wider shadow-[0_0_20px_rgba(0,255,102,0.35)] hover:shadow-[0_0_30px_rgba(0,255,102,0.55)] transition-all flex items-center justify-center gap-2"
            >
              {loadingLogin ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>VERIFYING...</span>
                </>
              ) : (
                <>
                  <Shield size={14} />
                  <span>UNLOCK COMMAND CONSOLE</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Return link */}
          <div className="mt-5 pt-3.5 border-t border-white/10 text-center relative z-10">
            <button
              onClick={onExitAdmin}
              className="text-[11px] font-mono text-silver-muted hover:text-green inline-flex items-center gap-1.5 transition-colors"
            >
              ← Return to Participant Terminal
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="layout-container py-8 px-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[var(--green-dim)] border border-[var(--green-primary)] text-green text-xs font-mono mb-2">
            <Shield size={14} />
            HIGH-SECURITY COMMAND CONSOLE // ORGANIZER ACCESS
          </div>
          <h1 className="font-hud text-2xl sm:text-3xl font-extrabold text-silver-bright tracking-wide">
            ADMIN <span className="text-green">BATTLEFIELD DASHBOARD</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAdminData}
            className="btn-silver text-xs py-2 px-3 flex items-center gap-2"
            title="Refresh Server Data"
          >
            <RefreshCw size={14} className={loadingData ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>
          <button
            onClick={onExitAdmin}
            className="btn-primary text-xs py-2 px-4"
          >
            <span>Exit to Workspace</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className="mb-6 p-4 rounded-lg bg-black/80 border border-[var(--green-primary)] text-green font-mono text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(0,255,102,0.3)] animate-fade-in">
          <CheckCircle size={16} />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'roster'
              ? 'bg-[var(--green-primary)] text-black shadow-[0_0_12px_rgba(0,255,102,0.5)]'
              : 'text-silver-muted hover:text-white bg-black/40'
          }`}
        >
          <Users size={14} />
          <span>STUDENT CREDENTIALS & UPLOAD ({participantsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('problems')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'problems'
              ? 'bg-[var(--green-primary)] text-black shadow-[0_0_12px_rgba(0,255,102,0.5)]'
              : 'text-silver-muted hover:text-white bg-black/40'
          }`}
        >
          <Target size={14} />
          <span>PROBLEM STATEMENTS ({problemsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-[var(--green-primary)] text-black shadow-[0_0_12px_rgba(0,255,102,0.5)]'
              : 'text-silver-muted hover:text-white bg-black/40'
          }`}
        >
          <Sliders size={14} />
          <span>OVERVIEW & ANALYTICS</span>
        </button>

        <button
          onClick={() => setActiveTab('carousel')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'carousel'
              ? 'bg-[var(--green-primary)] text-black shadow-[0_0_12px_rgba(0,255,102,0.5)]'
              : 'text-silver-muted hover:text-white bg-black/40'
          }`}
        >
          <Upload size={14} />
          <span>CAROUSEL BROADCAST MANAGER ({carouselItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('timer')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'timer'
              ? 'bg-[var(--green-primary)] text-black shadow-[0_0_12px_rgba(0,255,102,0.5)]'
              : 'text-silver-muted hover:text-white bg-black/40'
          }`}
        >
          <Clock size={14} />
          <span>HACKATHON TIMELOCK CONTROL</span>
        </button>

        <button
          onClick={() => setActiveTab('participants')}
          className={`px-4 py-2 rounded-lg font-mono text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'participants'
              ? 'bg-[var(--green-primary)] text-black shadow-[0_0_12px_rgba(0,255,102,0.5)]'
              : 'text-silver-muted hover:text-white bg-black/40'
          }`}
        >
          <FileText size={14} />
          <span>MISSION SELECTIONS ({stats?.selectedProblems?.length || 0})</span>
        </button>
      </div>

      {/* TAB: STUDENT CREDENTIALS & UPLOAD ROSTER */}
      {activeTab === 'roster' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Instructions Box */}
          <div className="liquid-glass hud-corner p-6 border border-[var(--green-primary)]/60">
            <h3 className="font-hud text-base font-bold text-silver-bright mb-2 flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-green" />
              STUDENT CREDENTIALS & SPREADSHEET MANAGEMENT
            </h3>
            <p className="text-xs sm:text-sm font-mono text-silver-main leading-relaxed mb-3">
              Upload your official college hackathon participant roster directly via Excel spreadsheet (<code className="text-green font-bold">.xlsx / .xls</code>) or CSV. The system automatically extracts Student Name, Gmail/Email, Phone Number, and Domain Track.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <button
                type="button"
                onClick={handleDownloadExcelTemplate}
                className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-2 text-green border-[var(--green-primary)]/40 hover:border-[var(--green-primary)] shadow-[0_0_10px_rgba(0,255,102,0.15)] cursor-pointer"
              >
                <Download size={14} />
                <span>Download Sample Excel Template (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleExportToExcel}
                className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-2 text-silver-bright border-white/20 hover:border-white/40 cursor-pointer"
              >
                <FileSpreadsheet size={14} />
                <span>Export Current Roster ({participantsList.length} Students)</span>
              </button>
            </div>
          </div>

          {rosterError && (
            <div className="p-4 rounded-lg bg-black/80 border border-red-500 text-red-400 font-mono text-xs">
              {rosterError}
            </div>
          )}

          {/* Parsed Excel Preview Section (Shows upon selecting an Excel file) */}
          {excelParsedData && (
            <div className="liquid-glass hud-corner p-6 border-2 border-[var(--green-primary)] shadow-[0_0_25px_rgba(0,255,102,0.15)] animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green" size={18} />
                    <h4 className="font-hud text-base font-bold text-silver-bright">
                      EXCEL FILE PARSED SUCCESSFULLY
                    </h4>
                  </div>
                  <p className="text-xs font-mono text-silver-muted mt-1">
                    File: <span className="text-white font-bold">{excelFileName}</span> • Found <span className="text-green font-bold">{excelParsedData.length} students</span> ready to import
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setExcelParsedData(null);
                      setExcelFileName('');
                      const fileInput = document.getElementById('excelFileInput');
                      if (fileInput) fileInput.value = '';
                    }}
                    className="px-3 py-2 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <X size={14} />
                    <span>Discard</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmExcelUpload}
                    disabled={isUploadingRoster}
                    className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,255,102,0.5)] cursor-pointer"
                  >
                    {isUploadingRoster ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>SAVING TO SERVER...</span>
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        <span>CONFIRM & SYNC {excelParsedData.length} STUDENTS TO SERVER</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview table: first 5 rows */}
              <div className="text-xs font-mono text-silver-muted mb-2 flex items-center justify-between">
                <span>PREVIEW OF DETECTED RECORDS (Showing first {Math.min(5, excelParsedData.length)} of {excelParsedData.length}):</span>
                <span className="text-[11px] text-silver-dark">Domain tracks: Generative AI, AI Healthcare, AI Education, FinTech</span>
              </div>
              <div className="overflow-x-auto rounded border border-white/10 bg-black/60">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-silver-muted bg-white/5">
                      <th className="py-2 px-3">#</th>
                      <th className="py-2 px-3">NAME</th>
                      <th className="py-2 px-3">EMAIL / GMAIL</th>
                      <th className="py-2 px-3">PHONE</th>
                      <th className="py-2 px-3">ASSIGNED DOMAIN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {excelParsedData.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-2 px-3 text-silver-dark">{i + 1}</td>
                        <td className="py-2 px-3 font-bold text-white">{row.name}</td>
                        <td className="py-2 px-3 text-silver-main">{row.gmail || '—'}</td>
                        <td className="py-2 px-3 text-silver-muted">{row.phone || '—'}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-black/60 border border-[var(--green-primary)]/40 text-green font-bold text-[10px]">
                            {row.domain}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Upload and Paste Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 1. Upload Excel File */}
            <div className="liquid-glass hud-corner p-6 border border-white/15 flex flex-col justify-between">
              <div>
                <h4 className="font-hud text-sm font-bold text-silver-bright mb-2 flex items-center gap-2">
                  <FileSpreadsheet size={16} className="text-green" />
                  OPTION A: UPLOAD EXCEL SPREADSHEET (.XLSX / .XLS / .CSV)
                </h4>
                <p className="text-xs font-mono text-silver-muted mb-4">
                  Select your college hackathon Excel file. Column headers like <code className="text-green">Name</code>, <code className="text-green">Email / Gmail</code>, <code className="text-green">Phone</code>, and <code className="text-green">Domain</code> are automatically mapped.
                </p>
                
                <input
                  id="excelFileInput"
                  type="file"
                  accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                  onChange={handleExcelFileUpload}
                  className="block w-full text-xs font-mono text-silver-muted cursor-pointer border border-dashed border-white/20 p-3 rounded-lg hover:border-[var(--green-primary)]/50 transition-all bg-black/50"
                />
              </div>

              <div className="mt-4 flex items-center justify-between text-[11px] font-mono text-silver-dark pt-3 border-t border-white/5">
                <span>Supported: .xlsx, .xls, .csv</span>
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="btn-secondary text-[11px] py-1 px-2.5 text-green border-[var(--green-primary)]/30 hover:border-[var(--green-primary)] flex items-center gap-1.5 cursor-pointer shadow-[0_0_8px_rgba(0,255,102,0.15)]"
                >
                  <Download size={12} />
                  <span>Get Template</span>
                </button>
              </div>
            </div>

            {/* 2. Paste CSV / Text Content */}
            <div className="liquid-glass hud-corner p-6 border border-white/15">
              <h4 className="font-hud text-sm font-bold text-silver-bright mb-2 flex items-center gap-2">
                <FileText size={16} className="text-green" />
                OPTION B: PASTE CREDENTIALS (CSV OR JSON)
              </h4>
              
              <form onSubmit={handleJsonPasteSubmit} className="space-y-3">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder={`Paste CSV or JSON rows, e.g.:
Name, Email, Phone, Domain
John Doe, john@college.edu, 9876543210, generative-ai
Jane Smith, jane@college.edu, 9876543211, ai-healthcare`}
                  rows={4}
                  className="cyber-input text-xs font-mono"
                />
                
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setJsonInput(`Name, Email, Phone, Domain
Student 1, student1@college.edu, 9999999901, generative-ai
Student 2, student2@college.edu, 9999999902, ai-healthcare
Student 3, student3@college.edu, 9999999903, ai-education
Student 4, student4@college.edu, 9999999904, fintech`);
                    }}
                    className="btn-secondary text-[11px] py-1 px-2.5 text-silver-muted hover:text-white border-white/10 hover:border-white/25 flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText size={12} />
                    <span>Insert CSV Sample</span>
                  </button>

                  <button
                    type="submit"
                    className="btn-primary py-2 px-4 text-xs font-bold cursor-pointer"
                  >
                    Apply Pasted Data
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* Quick Register Single Student */}
          <div className="liquid-glass hud-corner p-6 border border-white/15">
            <h4 className="font-hud text-sm font-bold text-silver-bright mb-4 flex items-center gap-2">
              <Plus size={16} className="text-green" />
              QUICK REGISTER SINGLE STUDENT
            </h4>

            <form onSubmit={handleQuickAddStudent} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-mono text-silver-muted uppercase mb-1">Student Name</label>
                <input
                  type="text"
                  value={newStudentName}
                  onChange={(e) => setNewStudentName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="cyber-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-silver-muted uppercase mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newStudentPhone}
                  onChange={(e) => setNewStudentPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="cyber-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-silver-muted uppercase mb-1">Gmail / Email</label>
                <input
                  type="email"
                  value={newStudentGmail}
                  onChange={(e) => setNewStudentGmail(e.target.value)}
                  placeholder="e.g. student@gmail.com"
                  className="cyber-input text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-silver-muted uppercase mb-1">Assigned Domain</label>
                <select
                  value={newStudentDomain}
                  onChange={(e) => setNewStudentDomain(e.target.value)}
                  className="cyber-input text-xs"
                >
                  <option value="generative-ai">Generative AI & LLM</option>
                  <option value="ai-healthcare">AI for Healthcare</option>
                  <option value="ai-education">AI for Education</option>
                  <option value="fintech">FinTech</option>
                </select>
              </div>

              <div>
                <button
                  type="submit"
                  className="btn-primary w-full py-2 text-xs font-bold"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>

          {/* Active Roster Table */}
          <div className="liquid-glass hud-corner p-6 border border-white/15">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex flex-wrap items-center gap-3">
                <h4 className="font-hud text-sm font-bold text-silver-bright">
                  REGISTERED CREDENTIALS ON SERVER ({participantsList.length} TOTAL)
                </h4>
                <button
                  type="button"
                  onClick={handleExportToExcel}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/20 hover:border-green text-silver-muted hover:text-green text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Export entire student roster to Excel spreadsheet"
                >
                  <Download size={13} />
                  <span>Export Excel (.xlsx)</span>
                </button>
              </div>
              <input
                type="text"
                value={rosterFilter}
                onChange={(e) => setRosterFilter(e.target.value)}
                placeholder="Filter by name, email, or domain..."
                className="cyber-input text-xs max-w-xs py-1.5"
              />
            </div>

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead className="sticky top-0 bg-black/90">
                  <tr className="border-b border-white/20 text-silver-muted">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">STUDENT NAME</th>
                    <th className="py-2.5 px-3">GMAIL / EMAIL</th>
                    <th className="py-2.5 px-3">PHONE</th>
                    <th className="py-2.5 px-3">DOMAIN</th>
                    <th className="py-2.5 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {participantsList
                    .filter((p) => {
                      if (!rosterFilter.trim()) return true;
                      const q = rosterFilter.toLowerCase();
                      return (
                        (p.name && p.name.toLowerCase().includes(q)) ||
                        (p.gmail && p.gmail.toLowerCase().includes(q)) ||
                        (p.phone && p.phone.includes(q)) ||
                        (p.domain && p.domain.toLowerCase().includes(q))
                      );
                    })
                    .map((p, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                        <td className="py-2 px-3 text-silver-dark">{idx + 1}</td>
                        <td className="py-2 px-3 font-bold text-silver-bright">{p.name}</td>
                        <td className="py-2 px-3 text-silver-main">{p.gmail || '—'}</td>
                        <td className="py-2 px-3 text-silver-muted">{p.phone || '—'}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-black/60 border border-[var(--green-primary)]/40 text-green font-bold text-[11px]">
                            {p.domain}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteParticipant(p)}
                            className="p-1.5 rounded hover:bg-red-500/20 text-silver-muted hover:text-red-400 border border-transparent hover:border-red-500/40 transition-all cursor-pointer inline-flex items-center gap-1 text-[11px]"
                            title={`Delete ${p.name} from roster`}
                          >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB: PROBLEM STATEMENT MANAGEMENT */}
      {activeTab === 'problems' && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Directive & Action Card */}
          <div className="liquid-glass hud-corner p-6 border border-[var(--green-primary)]/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-green font-hud text-base font-bold mb-1">
                <Target size={18} />
                <span>PROBLEM STATEMENT REPOSITORY & DIRECTORY</span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-silver-main leading-relaxed">
                Manage challenge statements across all 4 competition domains. Any added, edited, or deleted problems immediately stream to participant terminals.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleOpenAddProblem}
                className="btn-primary text-xs py-2.5 px-4 font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.4)] cursor-pointer"
              >
                <Plus size={15} />
                <span>+ ADD PROBLEM STATEMENT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBulkUploadModalOpen(true);
                  setBulkParsedRows([]);
                  setBulkFileName('');
                  setBulkUploadError('');
                }}
                className="btn-secondary text-xs py-2.5 px-4 font-bold flex items-center gap-1.5 text-green border-[var(--green-primary)]/40 hover:border-[var(--green-primary)] cursor-pointer"
              >
                <FileSpreadsheet size={15} />
                <span>BULK UPLOAD (EXCEL/CSV)</span>
              </button>

              <button
                type="button"
                onClick={handleExportProblemsToExcel}
                className="btn-secondary text-xs py-2.5 px-3.5 flex items-center gap-1.5 text-silver-bright cursor-pointer"
                title="Download entire catalog as Excel sheet"
              >
                <Download size={14} />
                <span>Export Catalog ({problemsList.length})</span>
              </button>
            </div>
          </div>

          {/* Search & Domain Filter Toolbar */}
          <div className="liquid-glass hud-corner p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Domain Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'ALL DOMAINS', count: problemsList.length },
                { id: 'generative-ai', label: 'GEN AI & LLM', count: problemsList.filter((p) => p.domain === 'generative-ai').length },
                { id: 'ai-healthcare', label: 'HEALTHCARE', count: problemsList.filter((p) => p.domain === 'ai-healthcare').length },
                { id: 'ai-education', label: 'EDUCATION', count: problemsList.filter((p) => p.domain === 'ai-education').length },
                { id: 'fintech', label: 'FINTECH', count: problemsList.filter((p) => p.domain === 'fintech').length },
              ].map((tab) => {
                const isActive = problemDomainFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setProblemDomainFilter(tab.id)}
                    className={`px-3 py-1.5 rounded text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-[var(--green-primary)] text-black shadow-[0_0_10px_rgba(0,255,102,0.4)]'
                        : 'bg-black/50 text-silver-muted hover:text-white border border-white/10'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className="ml-1.5 opacity-70 text-[10px]">({tab.count})</span>
                  </button>
                );
              })}
            </div>

            {/* Compact Search Input */}
            <div className="relative min-w-[260px]">
              <input
                type="text"
                value={problemSearchQuery}
                onChange={(e) => setProblemSearchQuery(e.target.value)}
                placeholder="Search by ID, title, domain..."
                className="cyber-input text-xs py-1.5 pl-8 pr-3 w-full"
              />
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-silver-dark pointer-events-none" />
            </div>
          </div>

          {/* Grouped Problem Statement Cards */}
          {['generative-ai', 'ai-healthcare', 'ai-education', 'fintech']
            .filter((domId) => problemDomainFilter === 'all' || problemDomainFilter === domId)
            .map((domId) => {
              const domName =
                domId === 'generative-ai'
                  ? 'GENERATIVE AI & LLM'
                  : domId === 'ai-healthcare'
                  ? 'AI FOR HEALTHCARE'
                  : domId === 'ai-education'
                  ? 'AI FOR EDUCATION'
                  : 'FINTECH';

              const domainFiltered = problemsList.filter((p) => {
                if (p.domain !== domId) return false;
                if (!problemSearchQuery.trim()) return true;
                const q = problemSearchQuery.toLowerCase();
                return (
                  (p.id && p.id.toLowerCase().includes(q)) ||
                  (p.title && p.title.toLowerCase().includes(q)) ||
                  (p.description && p.description.toLowerCase().includes(q)) ||
                  (p.domain && p.domain.toLowerCase().includes(q))
                );
              });

              if (domainFiltered.length === 0 && problemSearchQuery.trim()) {
                return null;
              }

              return (
                <div key={domId} className="liquid-glass hud-corner p-5 border border-white/15">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--green-primary)] shadow-[0_0_8px_#00FF66]" />
                      <h4 className="font-hud text-sm font-bold text-silver-bright tracking-wider">
                        {domName}
                      </h4>
                    </div>
                    <span className="text-xs font-mono text-silver-muted">
                      {domainFiltered.length} Challenges
                    </span>
                  </div>

                  {domainFiltered.length === 0 ? (
                    <div className="py-6 text-center text-xs font-mono text-silver-dark">
                      NO PROBLEMS RECORDED IN THIS SECTOR
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {domainFiltered.map((problem) => (
                        <div
                          key={problem.id}
                          className="p-3.5 rounded bg-black/60 border border-white/10 hover:border-white/30 transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className="font-mono text-xs font-bold text-green px-2 py-0.5 rounded bg-black/80 border border-[var(--green-primary)]/40 tracking-wider">
                                [{problem.id}]
                              </span>
                              
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditProblem(problem)}
                                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 border border-white/20 text-silver-bright hover:text-green text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Edit problem statement"
                                >
                                  <Edit size={11} />
                                  <span>EDIT</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeletingProblem(problem)}
                                  className="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-[11px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                                  title="Delete problem statement"
                                >
                                  <Trash2 size={11} />
                                  <span>DELETE</span>
                                </button>
                              </div>
                            </div>

                            <h5 className="font-hud font-bold text-xs sm:text-sm text-silver-bright leading-snug mb-2">
                              {problem.title}
                            </h5>

                            <p className="text-[11px] font-mono text-silver-muted line-clamp-2 leading-relaxed">
                              {problem.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-8 animate-fade-in">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="liquid-glass hud-corner p-5 border border-white/10">
              <div className="text-xs font-mono text-silver-muted mb-1">TOTAL PARTICIPANTS</div>
              <div className="font-hud text-3xl font-black text-silver-bright">
                {stats.totalParticipants}
              </div>
              <div className="text-[11px] font-mono text-green mt-1">Verified Roster</div>
            </div>

            <div className="liquid-glass hud-corner p-5 border border-white/10">
              <div className="text-xs font-mono text-silver-muted mb-1">ACTIVE SESSIONS</div>
              <div className="font-hud text-3xl font-black text-[var(--green-primary)]">
                {stats.activeSessionsCount}
              </div>
              <div className="text-[11px] font-mono text-silver-muted mt-1">Currently in battlefield</div>
            </div>

            <div className="liquid-glass hud-corner p-5 border border-white/10">
              <div className="text-xs font-mono text-silver-muted mb-1">MISSIONS FIRED</div>
              <div className="font-hud text-3xl font-black text-silver-bright">
                {stats.firedParticipantsCount}
              </div>
              <div className="text-[11px] font-mono text-green mt-1">Problems Locked & Active</div>
            </div>

            <div className="liquid-glass hud-corner p-5 border border-white/10">
              <div className="text-xs font-mono text-silver-muted mb-1">EVENT STATUS</div>
              <div className="font-hud text-xl font-black text-[var(--green-primary)] truncate">
                {stats.timer.status}
              </div>
              <div className="text-[11px] font-mono text-silver-muted mt-1">
                {stats.timer.durationHours} Hours Session
              </div>
            </div>
          </div>

          {/* Domain Distribution */}
          <div className="liquid-glass hud-corner p-6 border border-white/10">
            <h3 className="font-hud text-lg font-bold text-silver-bright mb-4 flex items-center gap-2">
              <Layers size={18} className="text-green" />
              PARTICIPANTS BY DOMAIN (4 SECTORS)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(stats.domainCounts || {}).map(([domainId, count]) => (
                <div key={domainId} className="p-4 rounded-lg bg-black/40 border border-white/10">
                  <div className="text-xs font-mono text-silver-muted uppercase truncate mb-1">
                    {domainId}
                  </div>
                  <div className="font-hud text-2xl font-bold text-silver-bright">
                    {count} <span className="text-xs font-mono font-normal text-silver-muted">agents</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CAROUSEL BROADCAST MANAGER */}
      {activeTab === 'carousel' && (
        <div className="space-y-8 animate-fade-in">
          {/* Upload New Slide Form */}
          <div className="liquid-glass hud-corner p-6 sm:p-8 border border-[var(--green-primary)]/50">
            <h3 className="font-hud text-lg font-bold text-silver-bright mb-2 flex items-center gap-2">
              <Upload size={18} className="text-green" />
              UPLOAD LIVE CAROUSEL BROADCAST IMAGE
            </h3>
            <p className="text-xs font-mono text-silver-muted mb-6">
              Images uploaded here immediately stream to the participant hackathon workspace carousel.
            </p>

            <form onSubmit={handleUploadCarousel} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-silver-muted uppercase mb-1">
                    Slide Headline / Title
                  </label>
                  <input
                    type="text"
                    value={slideTitle}
                    onChange={(e) => setSlideTitle(e.target.value)}
                    placeholder="e.g. WORKSHOP SCHEDULE 15:00 UTC"
                    className="cyber-input text-xs sm:text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-silver-muted uppercase mb-1">
                    Slide Subtitle / Caption
                  </label>
                  <input
                    type="text"
                    value={slideCaption}
                    onChange={(e) => setSlideCaption(e.target.value)}
                    placeholder="e.g. Room 402 - Mentor evaluation criteria"
                    className="cyber-input text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-mono text-silver-muted uppercase">
                    Select Image File(s) — Unlimited photos (no limit on count or size)
                  </label>
                  {uploadFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadFiles([]);
                        setPreviewUrls([]);
                      }}
                      className="text-[11px] font-mono text-red-400 hover:underline cursor-pointer"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs font-mono text-silver-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[var(--green-dim)] file:text-green hover:file:bg-[var(--green-primary)] hover:file:text-black cursor-pointer"
                />
              </div>

              {previewUrls.length > 0 && (
                <div className="p-3 bg-black/60 rounded border border-white/15">
                  <div className="text-[11px] font-mono text-silver-muted mb-2 flex items-center justify-between">
                    <span>SELECTED {uploadFiles.length} IMAGE(S) FOR UPLOAD (NO LIMIT):</span>
                    <span className="text-green font-bold">Ready to broadcast</span>
                  </div>
                  <div className="flex gap-2 overflow-x-auto py-1">
                    {previewUrls.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        alt={`Upload Preview ${i + 1}`}
                        className="h-24 w-36 object-cover rounded border border-white/20 shrink-0"
                      />
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={uploadFiles.length === 0 || uploading}
                className="btn-primary py-2.5 px-6 text-xs sm:text-sm font-bold cursor-pointer"
              >
                {uploading
                  ? 'TRANSMITTING ALL IMAGES TO CAROUSEL...'
                  : `PUBLISH ${uploadFiles.length > 0 ? uploadFiles.length : ''} IMAGE(S) TO CAROUSEL`}
              </button>
            </form>
          </div>

          {/* Current Carousel Slides List */}
          <div className="liquid-glass hud-corner p-6 border border-white/10">
            <h3 className="font-hud text-lg font-bold text-silver-bright mb-4 flex items-center justify-between">
              <span>ACTIVE CAROUSEL SLIDES ({carouselItems.length})</span>
              <span className="text-xs font-mono text-silver-muted">Reorder or Delete</span>
            </h3>

            <div className="space-y-3">
              {carouselItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 p-4 rounded-lg bg-black/40 border border-white/10 flex-wrap"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs font-bold text-green w-6">
                      #{idx + 1}
                    </span>
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-20 h-12 object-cover rounded border border-white/20"
                    />
                    <div>
                      <div className="font-hud text-sm font-bold text-silver-bright">
                        {item.title}
                      </div>
                      <div className="text-xs font-mono text-silver-muted truncate max-w-sm">
                        {item.caption}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(idx, -1)}
                      disabled={idx === 0}
                      className="btn-silver p-2 text-xs"
                      title="Move Up"
                    >
                      <MoveUp size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveSlide(idx, 1)}
                      disabled={idx === carouselItems.length - 1}
                      className="btn-silver p-2 text-xs"
                      title="Move Down"
                    >
                      <MoveDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCarousel(item.id)}
                      className="btn-silver p-2 text-xs text-red-400 hover:text-red-300 hover:border-red-500"
                      title="Delete Slide"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: HACKATHON TIMELOCK & CONFIG CONTROL */}
      {activeTab === 'timer' && (
        <div className="space-y-8 animate-fade-in max-w-3xl">
          <div className="liquid-glass hud-corner p-6 sm:p-8 border border-white/10">
            <h3 className="font-hud text-lg font-bold text-silver-bright mb-2 flex items-center gap-2">
              <Clock size={18} className="text-green" />
              AUTHORITATIVE TIMELOCK CONTROLLER
            </h3>
            <p className="text-xs font-mono text-silver-muted mb-6">
              Configure the real-world countdown timestamp without editing code.
            </p>

            <form onSubmit={handleUpdateSettings} className="space-y-6">
              <div>
                <label className="block text-xs font-mono text-silver-muted uppercase mb-1">
                  Hackathon Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={durationHours}
                  onChange={(e) => setDurationHours(e.target.value)}
                  className="cyber-input text-sm"
                />
                <span className="text-[11px] font-mono text-silver-dark mt-1 block">
                  Default: 24 Hours
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-silver-muted uppercase mb-1">
                  Centralized Google Feedback Form URL
                </label>
                <input
                  type="url"
                  value={feedbackUrl}
                  onChange={(e) => setFeedbackUrl(e.target.value)}
                  placeholder="https://forms.google.com/..."
                  className="cyber-input text-sm"
                />
                <span className="text-[11px] font-mono text-silver-dark mt-1 block">
                  Changes apply immediately to the participant's FEEDBACK FORM button.
                </span>
              </div>

              <div>
                <label className="block text-xs font-mono text-silver-muted uppercase mb-1">
                  PPT Submission Google Drive Link
                </label>
                <input
                  type="url"
                  value={pptUrl}
                  onChange={(e) => setPptUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="cyber-input text-sm"
                />
                <span className="text-[11px] font-mono text-silver-dark mt-1 block">
                  Changes apply immediately to the participant's PPT SUBMISSION button.
                </span>
              </div>

              <div className="flex items-center gap-4 flex-wrap pt-2">
                <button
                  type="submit"
                  className="btn-primary py-2.5 px-6 text-xs sm:text-sm font-bold"
                >
                  SAVE CONFIGURATION
                </button>

                <button
                  type="button"
                  onClick={handleResetHackathon}
                  className="btn-silver py-2.5 px-6 text-xs sm:text-sm font-bold text-red-400 border-red-500/40 hover:border-red-500"
                >
                  RESET 24-HOUR CLOCK (START NOW)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: PARTICIPANT SELECTIONS */}
      {activeTab === 'participants' && stats && (
        <div className="space-y-6 animate-fade-in">
          <div className="liquid-glass hud-corner p-6 border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
              <div>
                <h3 className="font-hud text-lg font-bold text-silver-bright flex items-center gap-2">
                  <span>LIVE PARTICIPANT MISSION SELECTIONS</span>
                  <span className="text-xs font-mono text-green px-2 py-0.5 rounded bg-black/60 border border-[var(--green-primary)]/40">
                    {stats.selectedProblems?.length || 0} Locked
                  </span>
                </h3>
                <div className="text-xs font-mono text-silver-muted mt-0.5">
                  Real-time problem lock-ins & armed participants
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportSelections}
                disabled={!stats.selectedProblems || stats.selectedProblems.length === 0}
                className="btn-primary text-xs py-1.5 px-3.5 flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,255,102,0.35)] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Export mission selections to Excel (.xlsx)"
              >
                <FileSpreadsheet size={14} />
                <span>EXPORT TO EXCEL (.XLSX)</span>
                <Download size={13} />
              </button>
            </div>

            {stats.selectedProblems && stats.selectedProblems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/20 text-silver-muted">
                      <th className="py-3 px-4">PARTICIPANT</th>
                      <th className="py-3 px-4">GMAIL</th>
                      <th className="py-3 px-4">DOMAIN</th>
                      <th className="py-3 px-4">SELECTED PROBLEM</th>
                      <th className="py-3 px-4">FIRE STATUS</th>
                      <th className="py-3 px-4 text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.selectedProblems.map((sp, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-white/5 hover:bg-white/5 transition-all"
                      >
                        <td className="py-3 px-4 font-bold text-silver-bright">
                          {sp.participantName}
                        </td>
                        <td className="py-3 px-4 text-silver-muted">{sp.gmail}</td>
                        <td className="py-3 px-4 text-green">{sp.domain}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded bg-black/60 border border-[var(--green-primary)] font-bold text-green">
                            {sp.problemId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {sp.hasFired ? (
                            <span className="text-green font-bold flex items-center gap-1">
                              🔥 FIRED & ARMED
                            </span>
                          ) : (
                            <span className="text-silver-muted">Selected</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteParticipant({ name: sp.participantName, gmail: sp.gmail, phone: sp.phone })}
                            className="p-1.5 rounded hover:bg-red-500/20 text-silver-muted hover:text-red-400 border border-transparent hover:border-red-500/40 transition-all cursor-pointer inline-flex items-center gap-1 text-[11px]"
                            title={`Delete ${sp.participantName} from roster`}
                          >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-xs font-mono text-silver-muted">
                NO PARTICIPANT PROBLEM SELECTIONS LOGGED YET
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== MODAL: ADD / EDIT PROBLEM STATEMENT ==================== */}
      {problemModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="liquid-glass hud-corner w-full max-w-xl border-2 border-[var(--green-primary)] shadow-[0_0_40px_rgba(0,255,102,0.3)] bg-[#040a06] p-6 rounded-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-hud text-base font-bold text-silver-bright flex items-center gap-2">
                <Target size={16} className="text-green" />
                <span>
                  {problemModalMode === 'add'
                    ? '+ ADD NEW PROBLEM STATEMENT'
                    : `EDIT PROBLEM STATEMENT [${problemFormData.id}]`}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setProblemModalMode(null)}
                className="p-1 rounded text-silver-muted hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {problemFormError && (
              <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/50 text-red-400 font-mono text-xs">
                {problemFormError}
              </div>
            )}

            <form onSubmit={handleSaveProblemSubmit} className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-silver-muted uppercase text-[11px] mb-1">
                    Domain Track *
                  </label>
                  <select
                    value={problemFormData.domain}
                    onChange={(e) => setProblemFormData({ ...problemFormData, domain: e.target.value })}
                    className="cyber-input text-xs"
                  >
                    <option value="generative-ai">Generative AI & LLM</option>
                    <option value="ai-healthcare">AI for Healthcare</option>
                    <option value="ai-education">AI for Education</option>
                    <option value="fintech">FinTech</option>
                  </select>
                </div>

                <div>
                  <label className="block text-silver-muted uppercase text-[11px] mb-1">
                    Problem ID * (e.g. GEN-11, HLT-08)
                  </label>
                  <input
                    type="text"
                    value={problemFormData.id}
                    onChange={(e) => setProblemFormData({ ...problemFormData, id: e.target.value.toUpperCase() })}
                    placeholder="e.g. GEN-11"
                    className="cyber-input text-xs uppercase"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-silver-muted uppercase text-[11px] mb-1">
                  Problem Statement Title *
                </label>
                <input
                  type="text"
                  value={problemFormData.title}
                  onChange={(e) => setProblemFormData({ ...problemFormData, title: e.target.value })}
                  placeholder="e.g. Autonomous Multi-Agent Incident Response Engine"
                  className="cyber-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-silver-muted uppercase text-[11px] mb-1">
                  Full Problem Description *
                </label>
                <textarea
                  value={problemFormData.description}
                  onChange={(e) => setProblemFormData({ ...problemFormData, description: e.target.value })}
                  placeholder="Detailed breakdown of the problem, background scenario, and technical scope..."
                  rows={4}
                  className="cyber-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-silver-muted uppercase text-[11px] mb-1">
                    Target Metrics (Optional)
                  </label>
                  <input
                    type="text"
                    value={problemFormData.keyMetrics}
                    onChange={(e) => setProblemFormData({ ...problemFormData, keyMetrics: e.target.value })}
                    placeholder="e.g. Latency < 100ms, 95% accuracy"
                    className="cyber-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-silver-muted uppercase text-[11px] mb-1">
                    Expected Deliverables (Optional)
                  </label>
                  <input
                    type="text"
                    value={problemFormData.deliverables}
                    onChange={(e) => setProblemFormData({ ...problemFormData, deliverables: e.target.value })}
                    placeholder="e.g. Functional prototype, live demo"
                    className="cyber-input text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setProblemModalMode(null)}
                  className="btn-secondary py-2 px-4 text-xs cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSavingProblem}
                  className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {isSavingProblem ? (
                    <>
                      <RefreshCw size={13} className="animate-spin" />
                      <span>SAVING...</span>
                    </>
                  ) : (
                    <>
                      <Check size={14} />
                      <span>{problemModalMode === 'add' ? 'SAVE PROBLEM' : 'UPDATE PROBLEM'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== MODAL: DELETE CONFIRMATION DIALOG ==================== */}
      {deletingProblem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="liquid-glass hud-corner w-full max-w-md border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.3)] bg-[#0a0404] p-6 rounded-xl relative">
            <div className="flex items-center gap-2.5 text-red-400 font-hud text-base font-bold mb-3">
              <AlertTriangle size={20} />
              <span>DELETE PROBLEM STATEMENT?</span>
            </div>

            <div className="p-3 bg-black/60 rounded border border-white/10 font-mono text-xs mb-4">
              <div className="text-green font-bold mb-1">[{deletingProblem.id}]</div>
              <div className="text-silver-bright font-bold mb-1">{deletingProblem.title}</div>
              <div className="text-silver-muted text-[11px]">Domain: {deletingProblem.domain}</div>
            </div>

            <p className="text-xs font-mono text-silver-muted mb-6">
              This action cannot be undone and will permanently remove this problem statement from the database.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingProblem(null)}
                className="btn-secondary py-2 px-4 text-xs font-mono cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteProblem}
                className="py-2 px-5 rounded bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold shadow-[0_0_15px_rgba(239,68,68,0.4)] cursor-pointer"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== MODAL: BULK UPLOAD EXCEL/CSV ==================== */}
      {bulkUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="liquid-glass hud-corner w-full max-w-3xl border-2 border-[var(--green-primary)] shadow-[0_0_50px_rgba(0,255,102,0.3)] bg-[#040a06] p-6 rounded-xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
              <h3 className="font-hud text-base font-bold text-silver-bright flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-green" />
                <span>BULK UPLOAD PROBLEM STATEMENTS (EXCEL / CSV)</span>
              </h3>
              <button
                type="button"
                onClick={() => setBulkUploadModalOpen(false)}
                className="p-1 rounded text-silver-muted hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {bulkUploadError && (
              <div className="mb-4 p-3 rounded bg-red-500/10 border border-red-500/50 text-red-400 font-mono text-xs">
                {bulkUploadError}
              </div>
            )}

            {/* File Picker & Instructions */}
            <div className="p-4 rounded-lg bg-black/60 border border-white/10 mb-4 font-mono text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-silver-bright font-bold mb-1">
                  Upload .xlsx, .xls, or .csv file
                </div>
                <div className="text-silver-muted text-[11px]">
                  Columns supported: <code className="text-green">ID</code>, <code className="text-green">DOMAIN</code>, <code className="text-green">TITLE</code>, <code className="text-green">DESCRIPTION</code>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadProblemTemplate}
                className="btn-secondary text-xs py-2 px-3 flex items-center gap-1.5 text-green border-[var(--green-primary)]/40 hover:border-[var(--green-primary)] shrink-0 cursor-pointer"
              >
                <Download size={13} />
                <span>Download Excel Template</span>
              </button>
            </div>

            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleBulkFileChange}
              className="block w-full text-xs font-mono text-silver-muted file:mr-4 file:py-2.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-[var(--green-primary)] file:text-black hover:file:opacity-90 cursor-pointer border border-dashed border-white/20 p-3 rounded-lg hover:border-[var(--green-primary)]/50 transition-all mb-4"
            />

            {/* BULK IMPORT PREVIEW TABLE */}
            {bulkParsedRows.length > 0 && (
              <div className="mt-4 border border-white/15 rounded-lg overflow-hidden font-mono text-xs">
                <div className="p-3 bg-white/5 border-b border-white/10 flex items-center justify-between">
                  <span className="font-bold text-silver-bright">
                    BULK IMPORT PREVIEW ({bulkParsedRows.length} ROWS FOUND)
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-green/20 text-green font-bold text-[11px]">
                      {bulkParsedRows.filter((r) => r.isValid).length} VALID
                    </span>
                    {bulkParsedRows.filter((r) => !r.isValid).length > 0 && (
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[11px]">
                        {bulkParsedRows.filter((r) => !r.isValid).length} ERRORS
                      </span>
                    )}
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-black/90 text-silver-muted text-[11px] border-b border-white/10">
                      <tr>
                        <th className="py-2 px-3">ID</th>
                        <th className="py-2 px-3">DOMAIN</th>
                        <th className="py-2 px-3">TITLE</th>
                        <th className="py-2 px-3 text-right">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkParsedRows.map((row, i) => (
                        <tr
                          key={i}
                          className={`border-b border-white/5 ${
                            row.isValid ? 'hover:bg-white/5' : 'bg-red-500/10 text-red-300'
                          }`}
                        >
                          <td className="py-2 px-3 font-bold text-white">{row.id || '—'}</td>
                          <td className="py-2 px-3 text-silver-muted">{row.domain}</td>
                          <td className="py-2 px-3 truncate max-w-xs">{row.title || '—'}</td>
                          <td className="py-2 px-3 text-right">
                            {row.isValid ? (
                              <span className="text-green font-bold text-[11px]">VALID</span>
                            ) : (
                              <span className="text-red-400 font-bold text-[11px]">{row.errorReason}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10 mt-4">
              <button
                type="button"
                onClick={() => setBulkUploadModalOpen(false)}
                className="btn-secondary py-2 px-4 text-xs font-mono cursor-pointer"
              >
                CANCEL
              </button>

              <button
                type="button"
                onClick={handleConfirmBulkImport}
                disabled={isImportingBulk || bulkParsedRows.filter((r) => r.isValid).length === 0}
                className="btn-primary py-2.5 px-6 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,255,102,0.4)] cursor-pointer disabled:opacity-40"
              >
                {isImportingBulk ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    <span>IMPORTING...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>
                      IMPORT ALL VALID ({bulkParsedRows.filter((r) => r.isValid).length})
                    </span>
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
