import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── Auth ───────────────────────────────────────────────────────────────────

export const login = (email) =>
  api.post('/auth/login', { email });

export const getMe = () =>
  api.get('/auth/me');

export const getProfile = () =>
  api.get('/auth/profile');

// ─── Goals ──────────────────────────────────────────────────────────────────

export const getMyGoals = () =>
  api.get('/goals');

export const createGoal = (goalData) =>
  api.post('/goals', goalData);

export const updateGoal = (goalId, goalData) =>
  api.put(`/goals/${goalId}`, goalData);

export const deleteGoal = (goalId) =>
  api.delete(`/goals/${goalId}`);

export const submitGoals = () =>
  api.post('/goals/submit');

export const getGoalAudit = (goalId) =>
  api.get(`/goals/audit/${goalId}`);

// ─── Manager Approval ────────────────────────────────────────────────────────

export const getTeamGoals = () =>
  api.get('/goals/team');

export const approveGoal = (goalId, action, reason) =>
  api.post(`/goals/approve/${goalId}`, { action, reason });

// ─── Achievements (Check-in) ─────────────────────────────────────────────────

/**
 * Employee: get all own approved goals with their achievement data
 */
export const getMyAchievements = () =>
  api.get('/achievements');

/**
 * Employee: submit / update actual value for a single goal
 */
export const submitAchievement = (goalId, data) =>
  api.post(`/achievements/${goalId}`, data);

/**
 * Manager: get all team goals with achievement data
 */
export const getTeamAchievements = () =>
  api.get('/achievements/team');

/**
 * Manager: add a check-in comment to a specific goal's achievement
 */
export const addCheckInComment = (goalId, data) =>
  api.post(`/achievements/checkin/${goalId}`, data);
