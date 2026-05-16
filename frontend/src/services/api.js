import axios from 'axios';

// ─── FIX 1: CORS — use env variable for base URL ─────────────────────────────
// In development  → REACT_APP_API_URL is not set → falls back to localhost:5000
// In production   → set REACT_APP_API_URL=https://your-backend.railway.app
//
// Without this every request goes to the React dev server (port 3000) instead
// of the backend (port 5000), causing a CORS preflight failure or 404.
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  // withCredentials only needed if backend sets Set-Cookie; kept false to avoid
  // triggering extra CORS preflight without a matching server-side Allow-Credentials.
  withCredentials: false,
});

// ─── Request interceptor: attach JWT from localStorage ───────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── FIX 2: Token expiry — redirect to login on 401 expired ─────────────────
// Before: an expired token produced an unhandled network error; the user saw
//         a broken page with no explanation.
// After:  any 401 with { expired: true } clears localStorage and sends the user
//         to /login with a message they can actually read.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        // Clear stale credentials regardless of reason
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (data?.expired) {
          // Preserve the page they were on so we can redirect back after login
          const returnTo = encodeURIComponent(window.location.pathname);
          window.location.href = `/login?reason=expired&returnTo=${returnTo}`;
        } else {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ─── API calls ───────────────────────────────────────────────────────────────

// Auth
export const login = (email, role) =>
  api.post('/api/auth/login', { email, role });

// Goals
export const getGoals = () =>
  api.get('/api/goals');

export const createGoal = (goalData) =>
  api.post('/api/goals', goalData);

export const updateGoal = (goalId, goalData) =>
  api.put(`/api/goals/${goalId}`, goalData);

export const deleteGoal = (goalId) =>
  api.delete(`/api/goals/${goalId}`);

export const submitGoals = () =>
  api.post('/api/goals/submit');

export const getTeamGoals = () =>
  api.get('/api/goals/team');

export const approveGoal = (goalId, approved, comment) =>
  api.post(`/api/goals/approve/${goalId}`, { approved, comment });

// Achievements
export const submitAchievement = (data) =>
  api.post('/api/achievements/submit', data);

export const getAchievements = () =>
  api.get('/api/achievements');

export const getTeamAchievements = () =>
  api.get('/api/achievements/team');

export const addCheckInComment = (goalId, comment) =>
  api.post(`/api/achievements/checkin/${goalId}`, { comment });

// Reports
export const getCompletionStatus = () =>
  api.get('/api/reports/completion-status');

export const triggerExport = () =>
  api.get('/api/reports/achievements-export', { responseType: 'blob' });

// Audit log
export const getAuditLog = () =>
  api.get('/api/audit-log');

export const getGoalAuditLog = (goalId) =>
  api.get(`/api/audit-log/${goalId}`);

export default api;
