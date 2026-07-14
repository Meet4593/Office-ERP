import axios from 'axios';

// Hardcoded for production to avoid Vercel environment variable typos
const API_URL = 'https://office-erp-production.up.railway.app/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});



export const login = (email, password) => api.post('/auth/login', { email, password });
export const register = (userData) => api.post('/auth/register', userData);
export const changePassword = (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword });

export const getDashboardStats = () => api.get('/dashboard/stats');

export const getMasterData = () => api.get('/master-data');
export const addMasterRecord = (type, data) => api.post(`/master-data/${type}`, data);
export const updateMasterRecord = (type, id, data) => api.put(`/master-data/${type}/${id}`, data);
export const deleteMasterRecord = (type, id) => api.delete(`/master-data/${type}/${id}`);

export const getTransactions = () => api.get('/transactions');
export const getTransactionById = (id) => api.get(`/transactions/${id}`);
export const createTransaction = (formData) => api.post('/transactions', formData);
export const updateTransaction = (id, formData) => api.put(`/transactions/${id}`, formData);
export const deleteTransaction = (id, password) => api.delete(`/transactions/${id}`, { data: { password } });

// Journals
export const getJournals = () => api.get('/journals');
export const getJournalById = (id) => api.get(`/journals/${id}`);
export const createJournal = (data) => api.post('/journals', data);
export const updateJournal = (id, data) => api.put(`/journals/${id}`, data);
export const deleteJournal = (id, password) => api.delete(`/journals/${id}`, { data: { password } });

// Vouchers (Cash/Bank/Contra)
export const getVouchers = () => api.get('/vouchers');
export const getVoucherById = (id) => api.get(`/vouchers/${id}`);
export const createVoucher = (data) => api.post('/vouchers', data);
export const updateVoucher = (id, data) => api.put(`/vouchers/${id}`, data);
export const deleteVoucher = (id, password) => api.delete(`/vouchers/${id}`, { data: { password } });

export default api;
