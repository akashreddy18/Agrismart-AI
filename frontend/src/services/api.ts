import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to dynamically inject JWT token if present
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration (HTTP 403 / 401)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // Clear session local data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // If we are not already on the login or register page, redirect with hash
      if (!window.location.hash.includes('/login') && !window.location.hash.includes('/register')) {
        window.location.hash = '#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
