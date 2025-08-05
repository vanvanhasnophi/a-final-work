import axios from 'axios';
import { message } from 'antd';
import { translateMessage, showTranslatedMessage } from '../utils/messageTranslator';

// 创建axios实例
const instance = axios.create({
  baseURL: process.env.NODE_ENV === 'production' 
    ? process.env.REACT_APP_API_URL || '/api' 
    : 'http://localhost:8080/api', //到时候要改成部署目标后端地址
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
          // 检查是否是挤下线错误
          if (data && typeof data === 'object' && data.error) {
            const errorMessage = data.error;
            if (errorMessage.includes('其他地方登录') || errorMessage.includes('会话已失效')) {
              // 挤下线错误
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('sessionId');
              window.location.href = '/login?kickout=true';
              return Promise.reject(error);
            } else if (errorMessage.includes('Token已过期') || errorMessage.includes('登录已过期')) {
              // Token过期错误
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('sessionId');
              window.location.href = '/login?expired=true';
              return Promise.reject(error);
            } else {
              // 其他401错误
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('sessionId');
              window.location.href = '/login?unauthorized=true';
              return Promise.reject(error);
            }
          } else {
            // 默认401错误
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionId');
            window.location.href = '/login?expired=true';
            return Promise.reject(error);
          }
          break;
        case 403:
          showTranslatedMessage(message, 'error', data, '权限不足');
          break;
        case 404:
          showTranslatedMessage(message, 'error', data, '请求的资源不存在');
          break;
        case 409:
          showTranslatedMessage(message, 'error', data, '操作冲突，请稍后重试');
          break;
        case 500:
          showTranslatedMessage(message, 'error', data, '服务器内部错误');
          break;
        case 503:
          showTranslatedMessage(message, 'error', data, '服务不可用，可能在维护中');
          break;
        default:
          showTranslatedMessage(message, 'error', data, '请求失败');
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      console.error('网络错误:', error.request);
      showTranslatedMessage(message, 'error', 'Network error', '网络连接失败，请检查网络设置');
    } else {
      // 请求配置出错
      console.error('请求配置错误:', error.message);
      showTranslatedMessage(message, 'error', error.message, '请求配置错误');
    }
    return Promise.reject(error);
  }
);

export default instance; 