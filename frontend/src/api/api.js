/**
 * API接口封装
 * 作者: 19920728
 * 创建日期: 2026-05-07 17:15:00
 */

import axios from 'axios';
import useStore from '../store/store';

// 创建axios实例
const getBaseURL = () => {
  // 优先使用环境变量
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  // 开发环境使用代理
  if (process.env.NODE_ENV === 'development') {
    return '/api';
  }
  // 生产环境默认使用当前域名的 /api 路径
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const { token } = useStore.getState();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Token过期处理
    if (error.response?.status === 401) {
      useStore.getState().clearUser();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 频道相关API
export const channelAPI = {
  getChannels: (params) => api.get('/channels', { params }),
  getChannel: (id) => api.get(`/channels/${id}`),
  createChannel: (data) => api.post('/channels', data),
  updateChannel: (id, data) => api.put(`/channels/${id}`, data),
  deleteChannel: (id) => api.delete(`/channels/${id}`),
  batchDeleteChannels: (ids) => api.delete('/channels/batch', { data: { ids } })
};

// 分类相关API
export const categoryAPI = {
  getCategories: () => api.get('/categories'),
  getCategory: (id) => api.get(`/categories/${id}`),
  createCategory: (data) => api.post('/categories', data),
  updateCategory: (id, data) => api.put(`/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/categories/${id}`)
};

// 用户相关API
export const userAPI = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/password', data),
  getUsers: (params) => api.get('/users', { params }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  addFavorite: (data) => api.post('/users/favorites', data),
  getFavorites: () => api.get('/users/favorites'),
  removeFavorite: (channelId) => api.delete(`/users/favorites/${channelId}`),
  addPlayHistory: (data) => api.post('/users/history', data),
  getPlayHistory: () => api.get('/users/history')
};

// 上传相关API
export const uploadAPI = {
  uploadIPTVFile: (data) => api.post('/upload/iptv', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export default api;