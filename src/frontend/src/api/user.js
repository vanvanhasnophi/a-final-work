import { request } from '../utils/request';

export const userAPI = {
  // 获取用户列表
  getUserList: (params) => {
    return request({
      url: '/api/user/list',
      method: 'GET',
      params
    });
  },

  // 获取用户详情
  getUserInfo: (id) => {
    return request({
      url: `/api/user/${id}`,
      method: 'GET'
    });
  },

  // 更新用户信息
  updateUser: (id, data) => {
    return request({
      url: `/api/user/${id}`,
      method: 'PUT',
      data
    });
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    return request({
      url: '/api/user/me',
      method: 'GET'
    });
  }
}; 