import axios from 'axios';

let rawUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api';
if (rawUrl.endsWith('/')) {
  rawUrl = rawUrl.slice(0, -1);
}
if (rawUrl.startsWith('http') && !rawUrl.endsWith('/api')) {
  rawUrl = `${rawUrl}/api`;
}
const API_BASE_URL = rawUrl;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 second timeout (accommodates Render cold-starts gracefully)
});

// Request interceptor: attach JWT token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('kidneycare_token');
    if (token && !config.url?.includes('/auth/')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthenticated and 503 cold-start retry
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    // Retry once on 503 (Render cold start) or network timeout
    if (
      !config?._retried &&
      (error.response?.status === 503 || error.code === 'ECONNABORTED' || !error.response)
    ) {
      config._retried = true;
      // Wait 2s before retry on cold-start
      await new Promise((r) => setTimeout(r, 2000));
      return apiClient(config);
    }

    if (error.response && error.response.status === 401) {
      localStorage.removeItem('kidneycare_token');
      localStorage.removeItem('kidneycare_user');
      if (
        window.location.pathname !== '/login' &&
        window.location.pathname !== '/register' &&
        window.location.pathname !== '/'
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
