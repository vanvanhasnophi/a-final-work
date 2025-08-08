import axios from 'axios';
import { message } from 'antd';
import { translateMessage, showTranslatedMessage } from '../utils/messageTranslator';

// 创建axios实例
const instance = axios.create({
  baseURL: process.env.NODE_ENV === 'production'
    ? process.env.REACT_APP_API_URL || '/api'
    : 'http://localhost:8080/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // 允许携带 Cookie 以支持 CSRF Cookie
});

// CSRF 管理：仅依赖服务器下发的 XSRF-TOKEN Cookie，不在控制台 / JSON 暴露 token
let csrfEnabled = true;

export async function probeCsrfEnabled() {
  if (!csrfEnabled) return false;
  try {
    const resp = await instance.get('/csrf', { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    if (resp?.data?.enabled === false) {
      csrfEnabled = false;
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export function readCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

// 请求拦截器
instance.interceptors.request.use(
  async (config) => {
    // JWT
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // CSRF 仅针对会修改服务器状态的方法
    const method = (config.method || 'get').toLowerCase();
    const needsCsrf = ['post', 'put', 'patch', 'delete'].includes(method);
    if (needsCsrf && csrfEnabled) {
      // 尝试从 Cookie 读取 XSRF-TOKEN
      const tokenFromCookie = readCookie('XSRF-TOKEN');
      if (tokenFromCookie) {
        config.headers['X-XSRF-TOKEN'] = tokenFromCookie;
      } else {
        // 探测一次（可能首次未下发）
        await probeCsrfEnabled();
        const retryToken = readCookie('XSRF-TOKEN');
        if (retryToken) {
          config.headers['X-XSRF-TOKEN'] = retryToken;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      const { status, data, config } = error.response;
  // 403 可能为 CSRF 或权限不足；若是修改类请求且可能 token 缺失尝试一次 CSRF token 重试
  if (status === 403 && csrfEnabled && !config.__csrfRetried && config.method && ['post','put','patch','delete'].includes(config.method.toLowerCase())) {
        await probeCsrfEnabled();
        const tokenFromCookie = readCookie('XSRF-TOKEN');
        if (tokenFromCookie) {
          config.__csrfRetried = true;
          config.headers['X-XSRF-TOKEN'] = tokenFromCookie;
          return instance(config);
        }
      }
      switch (status) {
        case 401:
          if (data && typeof data === 'object' && data.error) {
            const errorMessage = data.error;
            if (errorMessage.includes('其他地方登录') || errorMessage.includes('会话已失效')) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('sessionId');
              window.location.href = '/login?kickout=true';
              return Promise.reject(error);
            } else if (errorMessage.includes('Token已过期') || errorMessage.includes('登录已过期')) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('sessionId');
              window.location.href = '/login?expired=true';
              return Promise.reject(error);
            } else {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              localStorage.removeItem('sessionId');
              window.location.href = '/login?unauthorized=true';
              return Promise.reject(error);
            }
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('sessionId');
            window.location.href = '/login?expired=true';
            return Promise.reject(error);
          }
        case 403: {
          const fallback = '权限不足或操作被禁止';
          let payload = data;
          if (data && typeof data === 'object' && data.error) payload = data.error;
          showTranslatedMessage(message, 'warning', payload, fallback);
          break;
        }
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
      showTranslatedMessage(message, 'error', 'Network error', '网络连接失败，请检查网络设置');
    } else {
      showTranslatedMessage(message, 'error', error.message, '请求配置错误');
    }
    return Promise.reject(error);
  }
);

// 探测一次（非阻塞）
probeCsrfEnabled().catch(() => {});

export default instance; 