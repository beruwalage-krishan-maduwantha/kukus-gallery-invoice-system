import api from './axios';

export const getQuotations = (params) => api.get('/quotations', { params });
export const getQuotation = (id) => api.get(`/quotations/${id}`);
export const createQuotation = (data) => api.post('/quotations', data);
export const updateQuotation = (id, data) => api.put(`/quotations/${id}`, data);
export const updateQuotationStatus = (id, status) => api.patch(`/quotations/${id}/status`, { status });
export const convertQuotationToInvoice = (id) => api.post(`/quotations/${id}/convert`);
export const deleteQuotation = (id) => api.delete(`/quotations/${id}`);
