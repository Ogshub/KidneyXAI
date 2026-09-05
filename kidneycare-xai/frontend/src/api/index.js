import apiClient from './client';

export const authApi = {
  login: async (credentials) => {
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  register: async (data) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
};

export const profileApi = {
  getProfile: async () => {
    const res = await apiClient.get('/profile');
    return res.data;
  },
  updateProfile: async (data) => {
    const res = await apiClient.put('/profile', data);
    return res.data;
  },
  getHealthProfile: async () => {
    const res = await apiClient.get('/health-profile');
    return res.data;
  },
  updateHealthProfile: async (data) => {
    const res = await apiClient.put('/health-profile', data);
    return res.data;
  },
};

export const assessmentApi = {
  createAssessment: async (data) => {
    const res = await apiClient.post('/assessments', data);
    return res.data;
  },
  getAssessments: async () => {
    const res = await apiClient.get('/assessments');
    return res.data;
  },
  getAssessmentById: async (id) => {
    const res = await apiClient.get(`/assessments/${id}`);
    return res.data;
  },
  getModelEvaluation: async () => {
    const res = await apiClient.get('/assessments/model-evaluation');
    return res.data;
  },
};

export const activityApi = {
  logActivity: async (data) => {
    const res = await apiClient.post('/activities', data);
    return res.data;
  },
  getActivities: async (from, to) => {
    const params = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiClient.get('/activities', { params });
    return res.data;
  },
};

export const recommendationApi = {
  getRecommendations: async (assessmentId) => {
    const params = assessmentId ? { assessmentId } : {};
    const res = await apiClient.get('/recommendations', { params });
    return res.data;
  },
};

export const dashboardApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/dashboard');
    return res.data;
  },
};

export const researchApi = {
  submitSurvey: async (data) => {
    const res = await apiClient.post('/research/responses', data);
    return res.data;
  },
  getAnalytics: async () => {
    const res = await apiClient.get('/research/analytics');
    return res.data;
  },
};
