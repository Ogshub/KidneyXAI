import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync('kidneycare_token');
    if (token && !config.url?.includes('/auth/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 unauthenticated
    if (error.response && error.response.status === 401) {
      // In a real scenario with Redux/Context we might trigger a global logout here.
      // We will handle the token deletion here just in case.
      await SecureStore.deleteItemAsync('kidneycare_token');
      await SecureStore.deleteItemAsync('kidneycare_user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (credentials: any) => {
    try {
      const res = await apiClient.post('/auth/login', credentials);
      return res.data;
    } catch (error: any) {
      console.error(`Login Error [POST ${API_BASE_URL}/auth/login]:`, {
        status: error.response?.status,
        message: error.response?.data?.message || error.message
      });
      throw error;
    }
  },
  register: async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
};

export const dashboardApi = {
  getDashboard: async () => {
    const res = await apiClient.get('/dashboard');
    return res.data;
  },
};

export const assessmentApi = {
  createAssessment: async (data: any) => {
    const res = await apiClient.post('/assessments', data);
    return res.data;
  },
  getAssessments: async () => {
    const res = await apiClient.get('/assessments');
    return res.data;
  },
  getAssessmentById: async (id: string) => {
    const res = await apiClient.get(`/assessments/${id}`);
    return res.data;
  },
  getModelEvaluation: async () => {
    const res = await apiClient.get('/assessments/model-evaluation');
    return res.data;
  }
};

export const profileApi = {
  getProfile: async () => {
    const res = await apiClient.get('/profile');
    return res.data;
  },
  updateProfile: async (data: any) => {
    const res = await apiClient.put('/profile', data);
    return res.data;
  },
  getHealthProfile: async () => {
    const res = await apiClient.get('/health-profile');
    return res.data;
  },
  updateHealthProfile: async (data: any) => {
    const res = await apiClient.put('/health-profile', data);
    return res.data;
  }
};

export const activityApi = {
  logActivity: async (data: any) => {
    const res = await apiClient.post('/activities', data);
    return res.data;
  },
  getActivities: async (from?: string, to?: string) => {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await apiClient.get('/activities', { params });
    return res.data;
  }
};

export const recommendationApi = {
  getRecommendations: async (assessmentId?: string) => {
    const params = assessmentId ? { assessmentId } : {};
    const res = await apiClient.get('/recommendations', { params });
    return res.data;
  }
};

export const researchApi = {
  submitSurvey: async (data: any) => {
    const res = await apiClient.post('/research/responses', data);
    return res.data;
  },
  getAnalytics: async () => {
    const res = await apiClient.get('/research/analytics');
    return res.data;
  }
};

export default apiClient;
