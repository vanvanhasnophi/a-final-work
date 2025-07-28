import axios from 'axios';
import { message } from 'antd';

// 创建axios实例
const instance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL || 'http://localhost:8080/api'
    : 'http://localhost:8080/api', // 开发环境直接使用后端URL
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
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
instance.interceptors.response.use(
  (response) => {
    console.log('API响应成功:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('API请求失败:', error);
    if (error.response) {
      // 服务器返回错误状态码
      const { status, data } = error.response;
      console.error('服务器错误:', status, data);
      
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          message.error('权限不足');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        default:
          message.error(data || '请求失败');
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误:', error.request);
      message.error('网络连接失败，请检查网络设置');
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
      message.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

export default instance; 