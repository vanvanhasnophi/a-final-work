import request  from './index';

export const userAPI = {
  // 获取用户列表
  getUserList: (params) => {
    return request.get('/user/list', { params });
  },

  // 获取用户详情
  getUserInfo: (id) => {
    return request.get(`/user/${id}`);
  },

  // 更新用户信息
  updateUser: (id, data) => {
    return request.put(`/user/${id}`, data);
  },

  // 获取当前用户信息
  getCurrentUser: () => {
    return request.get('/user/me');
  },

  // 修改密码
  updatePassword: (data) => {
    return request.post('/updatePassword', data);
  },

}; 