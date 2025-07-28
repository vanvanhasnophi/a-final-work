import api from './index';

// 用户相关API
export const userAPI = {
  // 获取当前用户信息
  getCurrentUser: () => {
    return api.get('/user/me');
  },

  // 获取用户详情
  getUserById: (id) => {
    return api.get(`/user/${id}`);
  },

  // 更新用户信息
  updateUser: (id, data) => {
    return api.put(`/user/${id}`, data);
  }
}; 