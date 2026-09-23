import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// Serve static uploads
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Serve public directory (icons, etc.)
const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

// Serve built frontend assets if dist exists
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// Configure Multer for image uploads - no file count limits
const storageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.png';
    const uniqueName = `slide_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: storageEngine,
  // Removed restrictive limits: supports unlimited number of photos and up to 500MB per file
  limits: { fileSize: 500 * 1024 * 1024, files: Infinity },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('UPLOAD FAILED: Please select valid image files.'));
    }
  },
});

// Configure Multer for PPT / Presentation templates
const templatesDir = path.join(uploadsDir, 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

const pptStorageEngine = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, templatesDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pptx';
    const cleanBase = path.parse(file.originalname).name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueName = `template_${Date.now()}_${cleanBase}${ext}`;
    cb(null, uniqueName);
  },
});

const pptUpload = multer({
  storage: pptStorageEngine,
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.pptx', '.ppt', '.pdf', '.odp', '.key', '.zip'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      allowedExts.includes(ext) ||
      file.mimetype.includes('presentation') ||
      file.mimetype.includes('powerpoint') ||
      file.mimetype.includes('pdf') ||
      file.mimetype.includes('octet-stream')
    ) {
      cb(null, true);
    } else {
      cb(new Error('INVALID FILE FORMAT: Please upload a PowerPoint (.pptx, .ppt) or PDF presentation file.'));
    }
  },
});

// Helper for extracting bearer token
function getBearerToken(req) {
  const auth = req.headers.authorization;
  if (!auth) return null;
  const parts = auth.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}

// Participant Auth Middleware
function requireParticipantAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'SESSION EXPIRED: Please authenticate to access mission.' });
  }
  const session = Storage.getSession(token);
  if (!session || !session.isParticipant) {
    return res.status(401).json({ error: 'INVALID SESSION: Authentication required.' });
  }
  req.session = session;
  req.token = token;
  next();
}

// Admin Auth Middleware
function requireAdminAuth(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'ADMIN ACCESS RESTRICTED: Authentication required.' });
  }
  const session = Storage.getSession(token);
  if (!session || !session.isAdmin) {
    return res.status(403).json({ error: 'ACCESS FORBIDDEN: High security admin rights required.' });
  }
  req.session = session;
  req.token = token;
  next();
}

// ==================== AUTH ROUTES ====================

// Participant Login
app.post('/api/auth/login', (req, res) => {
  const { identifier } = req.body;
  if (!identifier) {
    return res.status(400).json({ error: 'IDENTIFIER REQUIRED: Please enter your Gmail or Phone number.' });
  }

  const participant = Storage.findParticipant(identifier);
  if (!participant) {
    return res.status(404).json({
      error: 'PARTICIPANT NOT FOUND: Identity unverified. Please check your registered Gmail or Phone number.'
    });
  }

  // Find or create session
  const token = 'part_' + uuidv4();
  const sessionData = {
    token,
    isParticipant: true,
    name: participant.name,
    phone: participant.phone,
    gmail: participant.gmail,
    domain: participant.domain,
    selectedProblemId: null,
    hasFired: false,
    loginAt: Date.now(),
  };

  // Check if participant already has a session to restore selected problem
  const allSessions = Storage.getSessions();
  const existingSession = Object.values(allSessions).find(
    s => s.isParticipant && (s.gmail === participant.gmail || s.phone === participant.phone)
  );

  if (existingSession) {
    sessionData.selectedProblemId = existingSession.selectedProblemId || null;
    sessionData.hasFired = existingSession.hasFired || false;
  }

  Storage.saveSession(token, sessionData);

  const domainInfo = Storage.getDomainById(participant.domain);

  res.json({
    message: 'AUTHENTICATION GRANTED',
    token,
    participant: {
      name: participant.name,
      gmail: participant.gmail,
      phone: participant.phone,
      domain: participant.domain,
      domainInfo,
      selectedProblemId: sessionData.selectedProblemId,
      hasFired: sessionData.hasFired,
    },
    hackathon: Storage.getTimerStatus(),
  });
});

// Admin Login
app.post('/api/auth/admin-login', (req, res) => {
  const { password } = req.body;
  const config = Storage.getConfig();

  if (!password || password !== config.adminPassword) {
    return res.status(401).json({ error: 'ACCESS DENIED: Invalid Command Security Passcode.' });
  }

  const token = 'adm_' + uuidv4();
  Storage.saveSession(token, {
    token,
    isAdmin: true,
    name: 'Command Administrator',
    loginAt: Date.now(),
  });

  res.json({
    message: 'ADMIN CREDENTIALS ACCEPTED',
    token,
  });
});

// Verify Current Session
app.get('/api/auth/session', (req, res) => {
  const token = getBearerToken(req);
  if (!token) {
    return res.status(401).json({ error: 'No active session.' });
  }
  const session = Storage.getSession(token);
  if (!session) {
    return res.status(401).json({ error: 'Session expired or not found.' });
  }

  const hackathon = Storage.getTimerStatus();

  if (session.isAdmin) {
    return res.json({
      role: 'admin',
      name: session.name,
      hackathon,
    });
  }

  const domainInfo = Storage.getDomainById(session.domain);
  const selectedProblem = session.selectedProblemId
    ? Storage.getProblemById(session.selectedProblemId)
    : null;

  res.json({
    role: 'participant',
    participant: {
      name: session.name,
      gmail: session.gmail,
      phone: session.phone,
      domain: session.domain,
      domainInfo,
      selectedProblemId: session.selectedProblemId,
      selectedProblem,
      hasFired: session.hasFired,
    },
    hackathon,
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const token = getBearerToken(req);
  if (token) {
    Storage.deleteSession(token);
  }
  res.json({ message: 'TERMINAL SESSION TERMINATED' });
});

// ==================== DOMAINS & PROBLEMS ====================

// Get all domain definitions
app.get('/api/domains', (req, res) => {
  res.json(Storage.getDomains());
});

// Participant problem statements (strictly isolated to participant's allocated domain)
app.get('/api/problems', requireParticipantAuth, (req, res) => {
  const domainId = req.session.domain;
  const problems = Storage.getProblemsByDomain(domainId);
  const domainInfo = Storage.getDomainById(domainId);

  res.json({
    domain: domainId,
    domainInfo,
    count: problems.length,
    problems,
  });
});

// Select a problem statement
app.post('/api/participant/select-problem', requireParticipantAuth, (req, res) => {
  const { problemId } = req.body;
  if (!problemId) {
    return res.status(400).json({ error: 'Problem ID is required.' });
  }

  const problem = Storage.getProblemById(problemId);
  if (!problem) {
    return res.status(404).json({ error: 'Problem statement not found.' });
  }

  Storage.saveSession(req.token, {
    selectedProblemId: problemId,
    domain: problem.domainId,
    selectedAt: Date.now(),
  });

  res.json({
    message: 'PROBLEM LOCKED IN',
    problem,
  });
});

// FIRE action: Commits problem and transitions to hackathon workspace
app.post('/api/participant/fire-problem', requireParticipantAuth, (req, res) => {
  const { problemId } = req.body;
  const pId = problemId || req.session.selectedProblemId;

  if (!pId) {
    return res.status(400).json({ error: 'No problem selected for activation.' });
  }

  const problem = Storage.getProblemById(pId);
  if (!problem) {
    return res.status(404).json({ error: 'Problem statement not found.' });
  }

  Storage.saveSession(req.token, {
    selectedProblemId: pId,
    domain: problem.domainId,
    hasFired: true,
    firedAt: Date.now(),
  });

  res.json({
    message: 'MISSION ACTIVATED — FIRE SEQUENCE ENGAGED',
    problem,
  });
});

// ==================== ADMIN PROBLEM STATEMENT MANAGEMENT ====================

// Admin: Get all problems (optionally filtered by ?domain=)
app.get('/api/admin/problems', requireAdminAuth, (req, res) => {
  const { domain } = req.query;
  if (domain && domain !== 'all') {
    const problems = Storage.getProblemsByDomain(domain);
    return res.json({ domain, count: problems.length, problems });
  }
  const allProblems = Storage.getAllProblemsFlat();
  const groups = Storage.getAllProblems();
  res.json({ total: allProblems.length, problems: allProblems, groups });
});

// Admin: Create a new single problem statement
app.post('/api/admin/problems', requireAdminAuth, (req, res) => {
  const { domain, id, title, description, keyMetrics, deliverables, difficulty } = req.body;
  if (!domain || !id || !title || !description) {
    return res.status(400).json({ error: 'Domain, ID, Title, and Description are all required.' });
  }

  try {
    const created = Storage.addProblem({ domain, id, title, description, keyMetrics, deliverables, difficulty });
    res.status(201).json({ message: `PROBLEM STATEMENT ${created.id} CREATED`, problem: created });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: Update an existing problem statement
app.put('/api/admin/problems/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  try {
    const updated = Storage.updateProblem(id, req.body);
    res.json({ message: `PROBLEM STATEMENT ${updated.id} UPDATED`, problem: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: Delete a problem statement
app.delete('/api/admin/problems/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  try {
    const deleted = Storage.deleteProblem(id);
    res.json({ message: `PROBLEM STATEMENT ${deleted.id} DELETED`, problem: deleted });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Admin: Bulk upload problem statements
app.post('/api/admin/problems/bulk', requireAdminAuth, (req, res) => {
  const { problems } = req.body;
  if (!Array.isArray(problems) || problems.length === 0) {
    return res.status(400).json({ error: 'Expected an array of problem statements.' });
  }

  try {
    const result = Storage.bulkImportProblems(problems);
    res.json({
      message: `BULK IMPORT SUCCESS: Processed ${result.total} problems (${result.added} added, ${result.updated} updated).`,
      ...result,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==================== HACKATHON & TIMER ====================

// Authoritative timer endpoint
app.get('/api/hackathon/status', (req, res) => {
  res.json(Storage.getTimerStatus());
});

// Reset timer endpoint (accessible from student dashboard / workspace)
app.post('/api/hackathon/reset', (req, res) => {
  const { durationHours } = req.body || {};
  const dur = Number(durationHours) || 24;
  const config = Storage.resetHackathon(dur);
  res.json({ message: 'HACKATHON SESSION RESET TO 24 HOURS', config, timer: Storage.getTimerStatus() });
});

// ==================== CAROUSEL ====================

// Public carousel images
app.get('/api/carousel', (req, res) => {
  res.json(Storage.getCarousel());
});

// ==================== ADMIN ROUTES ====================

// Admin stats
app.get('/api/admin/stats', requireAdminAuth, (req, res) => {
  res.json(Storage.getStats());
});

// Admin all 40 problems
app.get('/api/admin/problems', requireAdminAuth, (req, res) => {
  res.json(Storage.getAllProblems());
});

// Admin all participants list
app.get('/api/admin/participants', requireAdminAuth, (req, res) => {
  res.json(Storage.getParticipants());
});

// Admin upload/replace participants JSON
app.post('/api/admin/participants/upload', requireAdminAuth, (req, res) => {
  const { participants } = req.body;
  if (!Array.isArray(participants) || participants.length === 0) {
    return res.status(400).json({ error: 'INVALID FORMAT: Expected an array of participant objects.' });
  }

  const validDomains = ['generative-ai', 'ai-healthcare', 'ai-education', 'fintech'];
  const formatted = participants.map((p, idx) => {
    let d = String(p.domain || '').toLowerCase().trim();
    if (!validDomains.includes(d)) {
      if (d.includes('gen') || d.includes('llm')) d = 'generative-ai';
      else if (d.includes('health') || d.includes('med')) d = 'ai-healthcare';
      else if (d.includes('edu')) d = 'ai-education';
      else if (d.includes('fin')) d = 'fintech';
      else d = 'generative-ai';
    }

    return {
      name: String(p.name || `Participant ${idx + 1}`).trim(),
      phone: String(p.phone || '').trim(),
      gmail: String(p.gmail || p.email || '').trim().toLowerCase(),
      domain: d,
    };
  });

  Storage.saveParticipants(formatted);
  res.json({
    message: `ROSTER UPDATED: ${formatted.length} verified participant records loaded.`,
    count: formatted.length,
    participants: formatted,
  });
});

// Admin delete participant
app.delete('/api/admin/participants/:identifier', requireAdminAuth, (req, res) => {
  const { identifier } = req.params;
  const deleted = Storage.deleteParticipant(identifier);
  if (!deleted) {
    return res.status(404).json({ error: 'Participant record not found on roster.' });
  }
  const updatedList = Storage.getParticipants();
  res.json({
    message: 'PARTICIPANT RECORD EXPUNGED FROM ROSTER',
    participants: updatedList,
    count: updatedList.length,
  });
});

// Admin carousel upload (supports uploading as many photos as needed, single or bulk)
app.post('/api/admin/carousel/upload', requireAdminAuth, upload.any(), (req, res) => {
  const files = req.files || (req.file ? [req.file] : []);
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'UPLOAD FAILED: No image files received.' });
  }

  const { title, caption } = req.body;
  const addedItems = [];

  files.forEach((file, index) => {
    const imageUrl = `/uploads/${file.filename}`;
    const baseTitle = title 
      ? (files.length > 1 ? `${title} (${index + 1})` : title) 
      : path.parse(file.originalname).name.replace(/[-_]/g, ' ').toUpperCase();

    const item = Storage.addCarouselItem({
      title: baseTitle || 'TACTICAL ANNOUNCEMENT',
      caption: caption || 'LIVE HACKATHON BROADCAST',
      imageUrl,
    });
    addedItems.push(item);
  });

  res.json({
    message: `${addedItems.length} IMAGE(S) UPLOADED SUCCESSFULLY`,
    items: addedItems,
    count: addedItems.length,
  });
});

// Admin carousel delete
app.delete('/api/admin/carousel/:id', requireAdminAuth, (req, res) => {
  const item = Storage.deleteCarouselItem(req.params.id);
  if (item && item.imageUrl && item.imageUrl.startsWith('/uploads/')) {
    const filename = path.basename(item.imageUrl);
    const fullPath = path.join(uploadsDir, filename);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (e) {
        console.warn('Could not delete physical file:', e.message);
      }
    }
  }
  res.json({ message: 'SLIDE REMOVED', id: req.params.id });
});

// Admin carousel reorder
app.post('/api/admin/carousel/reorder', requireAdminAuth, (req, res) => {
  const { orderedIds } = req.body;
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'orderedIds array is required.' });
  }
  const updated = Storage.reorderCarousel(orderedIds);
  res.json({ message: 'CAROUSEL ORDER UPDATED', items: updated });
});

// Admin update hackathon timing / settings
app.post('/api/admin/hackathon/update', requireAdminAuth, (req, res) => {
  const { durationHours, startTime, feedbackFormUrl, pptSubmissionUrl, hackathonTitle } = req.body;
  const updates = {};
  if (durationHours !== undefined) updates.durationHours = Number(durationHours);
  if (startTime !== undefined) updates.hackathonStartTime = Number(startTime);
  if (feedbackFormUrl !== undefined) updates.feedbackFormUrl = feedbackFormUrl;
  if (pptSubmissionUrl !== undefined) updates.pptSubmissionUrl = pptSubmissionUrl;
  if (hackathonTitle !== undefined) updates.hackathonTitle = hackathonTitle;

  const config = Storage.updateConfig(updates);
  res.json({ message: 'HACKATHON CONFIGURATION UPDATED', config, timer: Storage.getTimerStatus() });
});

// Admin reset hackathon session
app.post('/api/admin/hackathon/reset', requireAdminAuth, (req, res) => {
  const { durationHours } = req.body;
  const dur = Number(durationHours) || 24;
  const config = Storage.resetHackathon(dur);
  res.json({ message: 'HACKATHON SESSION RESET TO 24 HOURS', config, timer: Storage.getTimerStatus() });
});

// ==================== PPT TEMPLATE ROUTES ====================

// Public / Participant: Get current PPT template info
app.get('/api/hackathon/ppt-template/info', (req, res) => {
  const template = Storage.getPptTemplate();
  res.json({
    hasTemplate: !!template,
    template,
  });
});

// Public / Participant: Download the official PPT template
app.get('/api/hackathon/ppt-template/download', (req, res) => {
  const template = Storage.getPptTemplate();
  if (!template || !template.filename) {
    return res.status(404).json({ error: 'NO PPT TEMPLATE FOUND: Organizers have not uploaded a presentation template yet.' });
  }

  const filePath = path.join(templatesDir, template.filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'PPT TEMPLATE FILE MISSING: File not found on server.' });
  }

  const downloadName = template.originalName || template.filename;
  res.download(filePath, downloadName, (err) => {
    if (err && !res.headersSent) {
      console.error('Download error:', err);
      res.status(500).json({ error: 'Failed to download PPT template.' });
    }
  });
});

// Admin: Upload official PPT template
app.post('/api/admin/ppt-template/upload', requireAdminAuth, pptUpload.single('template'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'UPLOAD FAILED: No template file received.' });
  }

  // Check if an existing template was already stored; delete old file
  const existingTemplate = Storage.getPptTemplate();
  if (existingTemplate && existingTemplate.filename) {
    const oldPath = path.join(templatesDir, existingTemplate.filename);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (e) {
        console.warn('Could not delete old template file:', e.message);
      }
    }
  }

  const templateInfo = {
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: Date.now(),
    downloadUrl: '/api/hackathon/ppt-template/download',
  };

  Storage.savePptTemplate(templateInfo);

  res.json({
    message: 'OFFICIAL PPT TEMPLATE UPLOADED & BROADCASTED SUCCESSFULLY',
    template: templateInfo,
  });
});

// Admin: Delete current PPT template
app.delete('/api/admin/ppt-template', requireAdminAuth, (req, res) => {
  const existingTemplate = Storage.getPptTemplate();
  if (existingTemplate && existingTemplate.filename) {
    const filePath = path.join(templatesDir, existingTemplate.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (e) {
        console.warn('Could not delete template file:', e.message);
      }
    }
  }

  Storage.deletePptTemplate();
  res.json({ message: 'PPT TEMPLATE REMOVED SUCCESSFULLY' });
});

// SPA Fallback to index.html for non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/icons')) {
    return next();
  }
  const indexPath = path.join(distDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  next();
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: err.message || 'SYSTEM CONNECTION LOST: Unexpected command anomaly.'
  });
});

app.listen(PORT, () => {
  console.log(`[DOOMSDAY COMMAND CENTER SERVER] Online and listening on port ${PORT}`);
});
