import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add token to every request
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth APIs
export const authAPI = {
    login: (email, role) => apiClient.post('/auth/login', { email, role }),
    getProfile: () => apiClient.get('/auth/profile')
};

// Goals APIs
export const goalsAPI = {
    getMyGoals: () => apiClient.get('/goals'),
    createGoals: (goals) => apiClient.post('/goals', goals),
    updateGoal: (goalId, data) => apiClient.put(`/goals/${goalId}`, data),
    deleteGoal: (goalId) => apiClient.delete(`/goals/${goalId}`),
    approveGoal: (goalId, approved) => apiClient.post(`/goals/approve/${goalId}`, { approved }),
    getTeamGoals: () => apiClient.get('/goals/team'),
    getAllGoals: () => apiClient.get('/goals/all')
};

// Achievements APIs
export const achievementsAPI = {
    submitAchievement: (achievementData) => apiClient.post('/achievements/submit', achievementData),
    getAchievements: (goalId) => apiClient.get(`/achievements/${goalId}`),
    submitCheckIn: (achievementId, data) => apiClient.post(`/achievements/checkin/${achievementId}`, data),
    getCheckIns: (achievementId) => apiClient.get(`/achievements/checkin/${achievementId}`)
};

// Reports APIs
export const reportsAPI = {
    exportAchievements: () => apiClient.get('/reports/achievements-export', { responseType: 'blob' }),
    getCompletionStatus: () => apiClient.get('/reports/completion-status'),
    createAuditLog: (data) => apiClient.post('/reports/audit-log', data),
    getAuditLog: (goalId) => apiClient.get(`/reports/audit-log/${goalId}`),
    getAdminSummary: () => apiClient.get('/reports/admin-summary')
};

export default apiClient;
