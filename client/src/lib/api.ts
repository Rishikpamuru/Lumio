import axios from 'axios';
import { useAuthStore } from '../state/authStore';

export const api = axios.create({ baseURL: 'http://localhost:4000' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(r => r, (err) => {
  if (err.response?.status === 401) {
    useAuthStore.getState().logout();
  }
  return Promise.reject(err);
});

export interface LoginPayload { email: string; password: string; }

export const AuthAPI = {
  login: (data: LoginPayload) => api.post('/api/auth/login', data).then(r => r.data)
};

export const ClassAPI = {
  create: (data: { name: string }) => api.post('/api/classes', data).then(r => r.data),
  list: () => api.get('/api/classes').then(r => r.data),
  join: (data: { code: string }) => api.post('/api/classes/join', data).then(r => r.data),
  detail: (id: string) => api.get(`/api/classes/${id}`).then(r => r.data),
  delete: (id: string) => api.delete(`/api/classes/${id}`).then(r => r.data)
};

export const AssignmentAPI = {
  create: (data: { classId: string; title: string; description?: string; dueDate?: string }) => api.post('/api/assignments', data).then(r => r.data),
  listForClass: (classId: string) => api.get(`/api/assignments/class/${classId}`).then(r => r.data),
  submissions: (assignmentId: string) => api.get(`/api/assignments/${assignmentId}/submissions`).then(r => r.data),
  aiGrade: (submissionId: string) => api.post(`/api/submissions/${submissionId}/ai-grade`).then(r => r.data)
};
