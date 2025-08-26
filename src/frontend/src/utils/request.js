import axios from 'axios';

// 创建axios实例
// 动态获取API地址：优先用环境变量，否则用当前页面origin
const getApiBaseUrl = () => {
  let url = process.env.REACT_APP_API_BASE_URL || (window && window.location && window.location.origin) || '';
  url = url.replace(/\/?api\/?$/, '');
  return url+'/api';
};

const instance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    // 只在开发环境打印详细日志
    if (process.env.NODE_ENV === 'development') {
      console.debug('Request拦截器 - 当前请求URL:', config.url);
      console.debug('Request拦截器 - 获取到的token:', token ? token.substring(0, 50) + '...' : 'null');
    }
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (process.env.NODE_ENV === 'development') {
        console.debug('Request拦截器 - 已设置Authorization头');
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.debug('Request拦截器 - 未找到token，跳过Authorization头设置');
      }
    }
    return config;
  },
  (error) => {
    console.error('Request拦截器 - 错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
instance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理401未授权错误
    if (error.response?.status === 401) {
      console.error('Token已过期或无效');
      
      // 检查是否在用户管理页面
      const currentPath = window.location.pathname;
      const isUserManagementPage = currentPath.includes('/users');
      
      // 只有在非用户管理页面时才自动清理token和跳转
      if (!isUserManagementPage) {
        // 清理本地存储的认证信息
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // 延迟跳转，避免在组件卸载时跳转
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      } else {
        // 在用户管理页面，只记录错误，不自动清理token
        console.log('在用户管理页面遇到401错误，不自动清理token');
      }
    }
    // 处理403禁止访问错误
    if (error.response?.status === 403) {
      console.error('权限不足');
      // 对于权限不足的情况，不自动跳转，让组件自己处理
    }
    return Promise.reject(error);
  }
);

export function request(config) {
  return instance(config);
}