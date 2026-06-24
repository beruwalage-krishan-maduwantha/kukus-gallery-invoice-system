import api from './axios';

export const getReport = () => api.get('/reports');
