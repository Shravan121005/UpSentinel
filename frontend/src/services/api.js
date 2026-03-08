import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const signup = (data) => api.post('/auth/signup', data);
export const login = (data) => api.post('/auth/login', data);

export const getMonitors = () => api.get('/monitors');
export const createMonitor = (data) => api.post('/monitors', data);
export const deleteMonitor = (id) => api.delete(`/monitors/${id}`);
export const getMonitor = (id) => api.get(`/monitors/${id}`);
export const getMonitorHistory = (id) => api.get(`/monitors/${id}/history`);

export default api;
