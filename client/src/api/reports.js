import api from './axios';

export const getReport = (params) => api.get('/reports', { params });
