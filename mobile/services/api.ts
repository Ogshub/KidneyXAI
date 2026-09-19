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
    const res = await apiClient.post('/auth/login', credentials);
    return res.data;
  },
  register: async (data: any) => {
    const res = await apiClient.post('/auth/register', data);
    return res.data;
  },
};

export default apiClient;
