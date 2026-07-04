import api from './axios';

export const getCreditNotes = (params) => api.get('/credit-notes', { params });
export const getCustomerCredits = (params) => api.get('/credit-notes/by-customer', { params });
export const createCreditNote = (data) => api.post('/credit-notes', data);
export const updateCreditNote = (id, data) => api.put(`/credit-notes/${id}`, data);
export const deleteCreditNote = (id) => api.delete(`/credit-notes/${id}`);
