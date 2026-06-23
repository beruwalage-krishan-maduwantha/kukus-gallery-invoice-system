import api from './axios';

export const loginApi = (email, password) => api.post('/auth/login', { email, password });
export const getMeApi = () => api.get('/auth/me');
export const changePasswordApi = (data) => api.put('/auth/change-password', data);
