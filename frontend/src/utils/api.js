import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// 请求拦截器：添加token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    console.log('API请求 - URL:', config.url, 'Token:', token ? '存在' : '不存在');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('已添加Authorization头部:', `Bearer ${token.substring(0, 20)}...`);
    } else {
      console.log('未找到token，跳过Authorization头部');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 用户相关API
export const userAPI = {
  // 注册
  register: (username, password) => 
    api.post('/register', { username, password }),
  // 登录
  login: (username, password) => 
    api.post('/login', { username, password }),
  // 获取当前用户信息
  getProfile: () =>
    api.get('/test-jwt'),
};

// 解析相关API
export const parserAPI = {
  // 解析视频
  parse: (url) => 
    api.post('/parse', { url }, { withCredentials: true }),
  // 获取历史记录，支持分页、平台、关键词
  getHistory: ({ page = 1, page_size = 10, platform = '', keyword = '' } = {}) =>
    api.get('/history', {
      params: { page, page_size, platform, keyword },
    }),
  // 删除历史记录
  deleteHistory: (id) =>
    api.delete(`/history/${id}`),
  // 下载视频
  download: (data) => 
    api.post('/download', data),
};

export default api; 