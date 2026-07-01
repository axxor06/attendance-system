import api from './client.js';

export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  verifyEmail: (payload) => api.post('/auth/verify-email', payload),
  resendOtp: (payload) => api.post('/auth/resend-otp', payload),
  login: (payload) => api.post('/auth/login', payload),
  refresh: () => api.post('/auth/refresh'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (payload) => api.post('/auth/forgot-password', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  changePassword: (payload) => api.post('/auth/change-password', payload),
  getMe: () => api.get('/auth/me'),
};
