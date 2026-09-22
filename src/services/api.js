// API Client Service
const TOKEN_KEY = 'doomsday_auth_token';

export const ApiService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    try {
      const response = await fetch(`/api${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `Command Error: ${response.statusText}`);
      }

      return data;
    } catch (err) {
      if (err.message.includes('SESSION EXPIRED') || err.message.includes('INVALID SESSION')) {
        this.setToken(null);
      }
      throw err;
    }
  },

  // Auth
  async login(identifier) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async adminLogin(password) {
    const data = await this.request('/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  },

  async getSession() {
    return this.request('/auth/session');
  },

  async logout() {
    try {
      await this.request('/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  },

  // Domains & Problems
  async getDomains() {
    return this.request('/domains');
  },

  async getProblems(domain = null) {
    const query = domain ? `?domain=${encodeURIComponent(domain)}` : '';
    return this.request(`/problems${query}`);
  },

  async selectProblem(problemId) {
    return this.request('/participant/select-problem', {
      method: 'POST',
      body: JSON.stringify({ problemId }),
    });
  },

  async fireProblem(problemId) {
    return this.request('/participant/fire-problem', {
      method: 'POST',
      body: JSON.stringify({ problemId }),
    });
  },

  // Authoritative Timer & Status
  async getHackathonStatus() {
    return this.request('/hackathon/status');
  },

  async resetTimer(durationHours = 24) {
    return this.request('/hackathon/reset', {
      method: 'POST',
      body: JSON.stringify({ durationHours }),
    });
  },

  // Carousel
  async getCarousel() {
    return this.request('/carousel');
  },

  // Admin Endpoints
  async adminGetStats() {
    return this.request('/admin/stats');
  },

  async adminGetAllProblems(domain = null) {
    const query = domain && domain !== 'all' ? `?domain=${encodeURIComponent(domain)}` : '';
    return this.request(`/admin/problems${query}`);
  },

  async adminCreateProblem(problemData) {
    return this.request('/admin/problems', {
      method: 'POST',
      body: JSON.stringify(problemData),
    });
  },

  async adminUpdateProblem(id, problemData) {
    return this.request(`/admin/problems/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(problemData),
    });
  },

  async adminDeleteProblem(id) {
    return this.request(`/admin/problems/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  async adminBulkUploadProblems(problems) {
    return this.request('/admin/problems/bulk', {
      method: 'POST',
      body: JSON.stringify({ problems }),
    });
  },

  async adminGetParticipants() {
    return this.request('/admin/participants');
  },

  async adminUploadParticipants(participants) {
    return this.request('/admin/participants/upload', {
      method: 'POST',
      body: JSON.stringify({ participants }),
    });
  },

  async adminDeleteParticipant(identifier) {
    return this.request(`/admin/participants/${encodeURIComponent(identifier)}`, {
      method: 'DELETE',
    });
  },

  async adminUploadCarousel(formData) {
    return this.request('/admin/carousel/upload', {
      method: 'POST',
      body: formData,
    });
  },

  async adminDeleteCarousel(id) {
    return this.request(`/admin/carousel/${id}`, {
      method: 'DELETE',
    });
  },

  async adminReorderCarousel(orderedIds) {
    return this.request('/admin/carousel/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds }),
    });
  },

  async adminUpdateHackathon(settings) {
    return this.request('/admin/hackathon/update', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  },

  async adminResetHackathon(durationHours = 24) {
    return this.request('/admin/hackathon/reset', {
      method: 'POST',
      body: JSON.stringify({ durationHours }),
    });
  },
};
