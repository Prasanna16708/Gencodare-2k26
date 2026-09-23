import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const PARTICIPANTS_FILE = path.join(DATA_DIR, 'participants.json');
const PROBLEMS_FILE = path.join(DATA_DIR, 'problems.json');
const DOMAINS_FILE = path.join(DATA_DIR, 'domains.json');
const CAROUSEL_FILE = path.join(DATA_DIR, 'carousel.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Ensure data files exist
function readJson(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2), 'utf-8');
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

function writeJson(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

// Initialize sessions file if needed
if (!fs.existsSync(SESSIONS_FILE)) {
  writeJson(SESSIONS_FILE, {});
}

export const Storage = {
  // Hackathon Config & Authoritative Timer
  getConfig() {
    let config = readJson(CONFIG_FILE, {
      durationHours: 24,
      feedbackFormUrl: 'https://forms.google.com/PLACEHOLDER',
      hackathonTitle: 'GENCODARE 2K26',
      organization: 'ACTioner',
      adminPassword: 'admin',
      hackathonStartTime: null,
      hackathonEndTime: null,
      status: 'RUNNING',
      pptTemplate: null,
    });

    // Authoritative timestamp initialization:
    // If not set, start from 18 minutes ago so that ~23h 42m is remaining
    // or from Date.now() for full 24h
    const now = Date.now();
    if (!config.hackathonStartTime) {
      config.hackathonStartTime = now - 18 * 60 * 1000; // 18 mins in
      config.hackathonEndTime = config.hackathonStartTime + config.durationHours * 3600 * 1000;
      writeJson(CONFIG_FILE, config);
    }

    return config;
  },

  updateConfig(updates) {
    const current = this.getConfig();
    const updated = { ...current, ...updates };
    if (updates.durationHours || updates.hackathonStartTime) {
      const start = updated.hackathonStartTime || Date.now();
      const dur = updated.durationHours || 24;
      updated.hackathonStartTime = start;
      updated.hackathonEndTime = start + dur * 3600 * 1000;
    }
    writeJson(CONFIG_FILE, updated);
    return updated;
  },

  resetHackathon(durationHours = 24) {
    const now = Date.now();
    const config = this.getConfig();
    config.durationHours = durationHours;
    config.hackathonStartTime = now;
    config.hackathonEndTime = now + durationHours * 3600 * 1000;
    config.status = 'RUNNING';
    writeJson(CONFIG_FILE, config);
    return config;
  },

  getTimerStatus() {
    const config = this.getConfig();
    const now = Date.now();
    const startTime = config.hackathonStartTime;
    const endTime = config.hackathonEndTime;
    const remainingMs = Math.max(0, endTime - now);
    const isExpired = remainingMs <= 0;
    const isStarted = now >= startTime;

    return {
      startTime,
      endTime,
      durationHours: config.durationHours,
      serverTime: now,
      remainingMs,
      isExpired,
      isStarted,
      status: isExpired ? 'EXPIRED' : (isStarted ? 'RUNNING' : 'NOT_STARTED'),
      feedbackFormUrl: config.feedbackFormUrl,
      pptSubmissionUrl: config.pptSubmissionUrl || 'https://drive.google.com/drive/folders/PLACEHOLDER',
      pptTemplate: config.pptTemplate || null,
      hackathonTitle: config.hackathonTitle,
    };
  },

  // PPT Template Management
  getPptTemplate() {
    const config = this.getConfig();
    return config.pptTemplate || null;
  },

  savePptTemplate(templateInfo) {
    return this.updateConfig({ pptTemplate: templateInfo });
  },

  deletePptTemplate() {
    return this.updateConfig({ pptTemplate: null });
  },

  // Participants
  getParticipants() {
    return readJson(PARTICIPANTS_FILE, []);
  },

  saveParticipants(list) {
    writeJson(PARTICIPANTS_FILE, list);
    return list;
  },

  findParticipant(identifier) {
    if (!identifier) return null;
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    const participants = this.getParticipants();
    return participants.find(p => {
      const pEmail = (p.gmail || p.email || '').trim().toLowerCase();
      const pPhone = String(p.phone || '').trim();
      const pPhoneDigits = pPhone.replace(/\D/g, '');
      const pName = String(p.name || '').trim().toLowerCase();

      return (
        (pEmail && pEmail === clean) ||
        (pPhone && pPhone === identifier.trim()) ||
        (cleanDigits.length >= 7 && pPhoneDigits.endsWith(cleanDigits)) ||
        (pName && pName === clean)
      );
    }) || null;
  },

  deleteParticipant(identifier) {
    if (!identifier) return false;
    const clean = identifier.trim().toLowerCase();
    const cleanDigits = identifier.replace(/\D/g, '');
    const list = this.getParticipants();
    
    // Find target
    const target = list.find(p => {
      const pEmail = (p.gmail || p.email || '').trim().toLowerCase();
      const pPhone = String(p.phone || '').trim();
      const pPhoneDigits = pPhone.replace(/\D/g, '');
      const pName = String(p.name || '').trim().toLowerCase();
      return (
        (pEmail && pEmail === clean) ||
        (pPhone && pPhone === identifier.trim()) ||
        (cleanDigits.length >= 7 && pPhoneDigits.endsWith(cleanDigits)) ||
        (pName && pName === clean)
      );
    });

    if (!target) return false;

    const targetEmail = (target.gmail || target.email || '').trim().toLowerCase();
    const targetPhone = String(target.phone || '').trim();

    const filtered = list.filter(p => {
      const pEmail = (p.gmail || p.email || '').trim().toLowerCase();
      const pPhone = String(p.phone || '').trim();
      if (targetEmail && pEmail === targetEmail) return false;
      if (targetPhone && pPhone === targetPhone) return false;
      return true;
    });

    this.saveParticipants(filtered);

    // Also clear associated session(s)
    const sessions = this.getSessions();
    let sessionsChanged = false;
    for (const [token, s] of Object.entries(sessions)) {
      if (s.isParticipant) {
        const sEmail = (s.gmail || s.email || '').trim().toLowerCase();
        const sPhone = String(s.phone || '').trim();
        if ((targetEmail && sEmail === targetEmail) || (targetPhone && sPhone === targetPhone)) {
          delete sessions[token];
          sessionsChanged = true;
        }
      }
    }
    if (sessionsChanged) {
      writeJson(SESSIONS_FILE, sessions);
    }

    return true;
  },

  // Domains & Problems
  getDomains() {
    return readJson(DOMAINS_FILE, []);
  },

  getDomainById(domainId) {
    const domains = this.getDomains();
    return domains.find(d => d.id === domainId) || null;
  },

  getAllProblems() {
    return readJson(PROBLEMS_FILE, []);
  },

  getAllProblemsFlat() {
    const all = this.getAllProblems();
    const flat = [];
    all.forEach(group => {
      if (Array.isArray(group.problems)) {
        group.problems.forEach(p => {
          flat.push({
            ...p,
            domain: group.domain,
            domainName: group.domainName,
          });
        });
      }
    });
    return flat;
  },

  getProblemsByDomain(domainId) {
    const all = this.getAllProblems();
    const domainGroup = all.find(g => g.domain === domainId);
    return domainGroup ? domainGroup.problems : [];
  },

  getProblemById(problemId) {
    const all = this.getAllProblems();
    for (const group of all) {
      const match = group.problems.find(p => p.id === problemId);
      if (match) {
        return { ...match, domainId: group.domain, domainName: group.domainName };
      }
    }
    return null;
  },

  addProblem(problemData) {
    const all = this.getAllProblems();
    const cleanId = String(problemData.id || '').trim().toUpperCase();
    if (!cleanId) throw new Error('Problem ID is required.');

    for (const group of all) {
      if (group.problems.some(p => p.id.toUpperCase() === cleanId)) {
        throw new Error(`Problem ID '${cleanId}' already exists in ${group.domainName || group.domain}.`);
      }
    }

    const domainId = String(problemData.domain || '').trim().toLowerCase();
    const domains = this.getDomains();
    const domainObj = domains.find(d => d.id === domainId) || { id: domainId, name: domainId };

    let group = all.find(g => g.domain === domainId);
    if (!group) {
      group = {
        domain: domainId,
        domainName: domainObj.name,
        problems: [],
      };
      all.push(group);
    }

    const newProblem = {
      id: cleanId,
      title: String(problemData.title || '').trim(),
      description: String(problemData.description || '').trim(),
      difficulty: problemData.difficulty || 'Advanced',
      keyMetrics: problemData.keyMetrics || '',
      deliverables: problemData.deliverables || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    group.problems.push(newProblem);
    writeJson(PROBLEMS_FILE, all);
    return { ...newProblem, domain: group.domain, domainName: group.domainName };
  },

  updateProblem(originalId, updates) {
    const all = this.getAllProblems();
    const cleanOrigId = String(originalId).trim().toUpperCase();
    let foundGroup = null;
    let foundIndex = -1;

    for (const group of all) {
      const idx = group.problems.findIndex(p => p.id.toUpperCase() === cleanOrigId);
      if (idx !== -1) {
        foundGroup = group;
        foundIndex = idx;
        break;
      }
    }

    if (!foundGroup || foundIndex === -1) {
      throw new Error(`Problem statement '${originalId}' not found.`);
    }

    const existing = foundGroup.problems[foundIndex];
    const newId = updates.id ? String(updates.id).trim().toUpperCase() : existing.id;

    if (newId !== existing.id) {
      for (const group of all) {
        if (group.problems.some(p => p.id.toUpperCase() === newId)) {
          throw new Error(`Problem ID '${newId}' already exists.`);
        }
      }
    }

    const targetDomain = updates.domain ? String(updates.domain).trim().toLowerCase() : foundGroup.domain;

    const updatedProblem = {
      ...existing,
      id: newId,
      title: updates.title !== undefined ? String(updates.title).trim() : existing.title,
      description: updates.description !== undefined ? String(updates.description).trim() : existing.description,
      difficulty: updates.difficulty !== undefined ? updates.difficulty : existing.difficulty,
      keyMetrics: updates.keyMetrics !== undefined ? updates.keyMetrics : existing.keyMetrics,
      deliverables: updates.deliverables !== undefined ? updates.deliverables : existing.deliverables,
      updatedAt: new Date().toISOString(),
    };

    if (targetDomain !== foundGroup.domain) {
      foundGroup.problems.splice(foundIndex, 1);
      let destGroup = all.find(g => g.domain === targetDomain);
      if (!destGroup) {
        const domains = this.getDomains();
        const dObj = domains.find(d => d.id === targetDomain);
        destGroup = {
          domain: targetDomain,
          domainName: dObj ? dObj.name : targetDomain,
          problems: [],
        };
        all.push(destGroup);
      }
      destGroup.problems.push(updatedProblem);
      writeJson(PROBLEMS_FILE, all);
      return { ...updatedProblem, domain: destGroup.domain, domainName: destGroup.domainName };
    } else {
      foundGroup.problems[foundIndex] = updatedProblem;
      writeJson(PROBLEMS_FILE, all);
      return { ...updatedProblem, domain: foundGroup.domain, domainName: foundGroup.domainName };
    }
  },

  deleteProblem(problemId) {
    const all = this.getAllProblems();
    const cleanId = String(problemId).trim().toUpperCase();
    let deleted = null;

    for (const group of all) {
      const idx = group.problems.findIndex(p => p.id.toUpperCase() === cleanId);
      if (idx !== -1) {
        deleted = { ...group.problems[idx], domain: group.domain, domainName: group.domainName };
        group.problems.splice(idx, 1);
        break;
      }
    }

    if (!deleted) {
      throw new Error(`Problem '${problemId}' not found.`);
    }

    writeJson(PROBLEMS_FILE, all);
    return deleted;
  },

  bulkImportProblems(problemsList) {
    if (!Array.isArray(problemsList)) {
      throw new Error('Expected array of problems.');
    }
    const all = this.getAllProblems();
    const domains = this.getDomains();
    let addedCount = 0;
    let updatedCount = 0;

    for (const item of problemsList) {
      const cleanId = String(item.id || '').trim().toUpperCase();
      if (!cleanId || !item.title) continue;

      let domainId = String(item.domain || '').trim().toLowerCase();
      if (!domains.some(d => d.id === domainId)) {
        if (domainId.includes('gen') || domainId.includes('llm')) domainId = 'generative-ai';
        else if (domainId.includes('health') || domainId.includes('med') || domainId.includes('hc')) domainId = 'ai-healthcare';
        else if (domainId.includes('edu') || domainId.includes('learn')) domainId = 'ai-education';
        else if (domainId.includes('fin')) domainId = 'fintech';
        else domainId = 'generative-ai';
      }

      let existingGroup = null;
      let existingIdx = -1;
      for (const group of all) {
        const idx = group.problems.findIndex(p => p.id.toUpperCase() === cleanId);
        if (idx !== -1) {
          existingGroup = group;
          existingIdx = idx;
          break;
        }
      }

      if (existingGroup) {
        existingGroup.problems[existingIdx] = {
          ...existingGroup.problems[existingIdx],
          title: String(item.title).trim(),
          description: String(item.description || '').trim(),
          difficulty: item.difficulty || existingGroup.problems[existingIdx].difficulty || 'Advanced',
          keyMetrics: item.keyMetrics || existingGroup.problems[existingIdx].keyMetrics || '',
          deliverables: item.deliverables || existingGroup.problems[existingIdx].deliverables || '',
          updatedAt: new Date().toISOString(),
        };
        updatedCount++;
      } else {
        let targetGroup = all.find(g => g.domain === domainId);
        if (!targetGroup) {
          const dObj = domains.find(d => d.id === domainId);
          targetGroup = {
            domain: domainId,
            domainName: dObj ? dObj.name : domainId,
            problems: [],
          };
          all.push(targetGroup);
        }
        targetGroup.problems.push({
          id: cleanId,
          title: String(item.title).trim(),
          description: String(item.description || '').trim(),
          difficulty: item.difficulty || 'Advanced',
          keyMetrics: item.keyMetrics || '',
          deliverables: item.deliverables || '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        addedCount++;
      }
    }

    writeJson(PROBLEMS_FILE, all);
    return {
      total: addedCount + updatedCount,
      added: addedCount,
      updated: updatedCount,
      all: this.getAllProblemsFlat(),
    };
  },

  // Sessions
  getSessions() {
    return readJson(SESSIONS_FILE, {});
  },

  saveSession(token, sessionData) {
    const sessions = this.getSessions();
    sessions[token] = {
      ...sessions[token],
      ...sessionData,
      updatedAt: Date.now(),
    };
    writeJson(SESSIONS_FILE, sessions);
    return sessions[token];
  },

  getSession(token) {
    if (!token) return null;
    const sessions = this.getSessions();
    return sessions[token] || null;
  },

  deleteSession(token) {
    const sessions = this.getSessions();
    if (sessions[token]) {
      delete sessions[token];
      writeJson(SESSIONS_FILE, sessions);
    }
  },

  // Carousel
  getCarousel() {
    const carousel = readJson(CAROUSEL_FILE, []);
    return carousel.sort((a, b) => (a.order || 0) - (b.order || 0));
  },

  saveCarousel(items) {
    writeJson(CAROUSEL_FILE, items);
    return items;
  },

  addCarouselItem(item) {
    const items = this.getCarousel();
    const newItem = {
      id: 'c_' + Date.now(),
      order: items.length + 1,
      createdAt: new Date().toISOString(),
      ...item,
    };
    items.push(newItem);
    this.saveCarousel(items);
    return newItem;
  },

  deleteCarouselItem(id) {
    let items = this.getCarousel();
    const target = items.find(i => i.id === id);
    items = items.filter(i => i.id !== id);
    this.saveCarousel(items);
    return target;
  },

  reorderCarousel(orderedIds) {
    const items = this.getCarousel();
    const map = new Map(items.map(i => [i.id, i]));
    const updated = [];
    orderedIds.forEach((id, index) => {
      const found = map.get(id);
      if (found) {
        found.order = index + 1;
        updated.push(found);
      }
    });
    // Add any remaining items that were not in orderedIds
    items.forEach(i => {
      if (!orderedIds.includes(i.id)) {
        i.order = updated.length + 1;
        updated.push(i);
      }
    });
    this.saveCarousel(updated);
    return updated;
  },

  // Stats for Admin
  getStats() {
    const participants = this.getParticipants();
    const domains = this.getDomains();
    const sessions = this.getSessions();

    const domainCounts = {};
    domains.forEach(d => { domainCounts[d.id] = 0; });
    participants.forEach(p => {
      if (domainCounts[p.domain] !== undefined) {
        domainCounts[p.domain]++;
      }
    });

    const activeSessions = Object.values(sessions);
    const selectedProblems = [];
    activeSessions.forEach(s => {
      if (s.selectedProblemId) {
        selectedProblems.push({
          participantName: s.name,
          gmail: s.gmail,
          phone: s.phone || '',
          domain: s.domain,
          problemId: s.selectedProblemId,
          hasFired: s.hasFired || false,
          selectedAt: s.selectedAt,
        });
      }
    });

    return {
      totalParticipants: participants.length,
      domainCounts,
      activeSessionsCount: activeSessions.length,
      firedParticipantsCount: activeSessions.filter(s => s.hasFired).length,
      selectedProblems,
      timer: this.getTimerStatus(),
    };
  }
};
