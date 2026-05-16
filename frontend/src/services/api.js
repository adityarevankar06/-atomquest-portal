import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export const login   = (email) => api.post('/auth/login', { email });
export const getMe   = ()      => api.get('/auth/me');
export const getProfile = ()   => api.get('/auth/profile');

// ─── Goals ───────────────────────────────────────────────────────────────────

export const getMyGoals   = ()              => api.get('/goals');
export const createGoal   = (data)          => api.post('/goals', data);
export const updateGoal   = (id, data)      => api.put(`/goals/${id}`, data);
export const deleteGoal   = (id)            => api.delete(`/goals/${id}`);
export const submitGoals  = ()              => api.post('/goals/submit');
export const getGoalAudit = (id)            => api.get(`/goals/audit/${id}`);

// ─── Manager Approval ─────────────────────────────────────────────────────────

export const getTeamGoals = ()                    => api.get('/goals/team');
export const approveGoal  = (id, action, reason)  => api.post(`/goals/approve/${id}`, { action, reason });

// ─── Achievements (Check-in) ──────────────────────────────────────────────────

export const getMyAchievements    = ()          => api.get('/achievements');
export const submitAchievement    = (id, data)  => api.post(`/achievements/${id}`, data);
export const getTeamAchievements  = ()          => api.get('/achievements/team');
export const addCheckInComment    = (id, data)  => api.post(`/achievements/checkin/${id}`, data);

// ─── Reports ─────────────────────────────────────────────────────────────────

export const getCompletionStatus = () =>
  api.get('/reports/completion-status');

/**
 * Downloads the CSV file. responseType: 'blob' is required so axios
 * returns raw bytes that can be turned into a Blob for download.
 */
export const triggerExport = () =>
  api.get('/reports/achievements-export', { responseType: 'blob' });

// ─── Audit Log ────────────────────────────────────────────────────────────────

/**
 * Admin: full audit log across all goals (flat, newest first)
 * Manager/Employee: pass a goalId to get per-goal audit trail
 */
export const getAuditLog     = ()   => api.get('/audit-log');
export const getGoalAuditLog = (id) => api.get(`/audit-log/${id}`);
