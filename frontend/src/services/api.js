import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Attach token to every request automatically
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth APIs
export const authAPI = {
    login:      (email, role) => apiClient.post('/auth/login', { email, role }),
    getMe:      ()            => apiClient.get('/auth/me'),
    getProfile: ()            => apiClient.get('/auth/profile')
};

// Goals APIs
export const goalsAPI = {
    getMyGoals:  ()                         => apiClient.get('/goals'),
    createGoals: (goals)                    => apiClient.post('/goals', goals),
    submitGoals: ()                         => apiClient.post('/goals/submit'),
    updateGoal:  (goalId, data)             => apiClient.put(`/goals/${goalId}`, data),
    deleteGoal:  (goalId)                   => apiClient.delete(`/goals/${goalId}`),
    getTeamGoals:()                         => apiClient.get('/goals/team'),
    approveGoal: (goalId, approved, reason) => apiClient.post(`/goals/approve/${goalId}`, { approved, reason }),
    getAuditLog: (goalId)                   => apiClient.get(`/goals/audit/${goalId}`)
};

// Achievements APIs
export const achievementsAPI = {
    submitAchievement: (data)            => apiClient.post('/achievements/submit', data),
    getAchievements:   (goalId)          => apiClient.get(`/achievements/${goalId}`),
    submitCheckIn:     (achievementId, data) => apiClient.post(`/achievements/checkin/${achievementId}`, data),
    getCheckIns:       (achievementId)   => apiClient.get(`/achievements/checkin/${achievementId}`)
};

// Reports APIs
export const reportsAPI = {
    exportAchievements: () => apiClient.get('/reports/achievements-export', { responseType: 'blob' }),
    getCompletionStatus:() => apiClient.get('/reports/completion-status'),
    getAuditLog:        (goalId) => apiClient.get(`/reports/audit-log/${goalId}`),
    getAdminSummary:    () => apiClient.get('/reports/admin-summary')
};

export default apiClient;
