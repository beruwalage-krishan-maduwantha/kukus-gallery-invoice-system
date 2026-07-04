import api from './axios';

export const getDashboardStats = (params) => api.get('/dashboard/stats', { params });
