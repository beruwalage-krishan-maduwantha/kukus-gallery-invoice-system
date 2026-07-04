import api from './axios';

export const getOrders = (params) => api.get('/orders', { params });
export const updateOrderStatus = (id, status) => api.patch(`/orders/${id}/status`, { status });
export const approveOrder = (id) => api.patch(`/orders/${id}/approve`);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);
