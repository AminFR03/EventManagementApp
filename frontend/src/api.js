import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('eventio_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Events API
export const eventsAPI = {
  getAll: (params) => api.get('/events', { params }),
  getOne: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  share: (id) => api.post(`/events/${id}/share`),
  getComments: (id) => api.get(`/events/${id}/comments`),
  addComment: (id, data) => api.post(`/events/${id}/comments`, data),
  updateComment: (id, commentId, data) => api.put(`/events/${id}/comments/${commentId}`, data),
  deleteComment: (id, commentId) => api.delete(`/events/${id}/comments/${commentId}`),
};

// Tickets API
export const ticketsAPI = {
  purchase: (data) => api.post('/tickets/purchase', data),
  getMyTickets: () => api.get('/tickets/my-tickets'),
  getPaymentHistory: () => api.get('/tickets/payment-history'),
  requestRefund: (id, data) => api.post(`/tickets/${id}/refund`, data),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
};

// Categories API
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
  toggleUserSuspension: (id, suspend) => api.put(`/admin/users/${id}/suspend`, { suspend }),
  getRefunds: () => api.get('/admin/refunds'),
  resolveRefund: (id, data) => api.put(`/admin/refunds/${id}/resolve`, data),
};

export default api;
