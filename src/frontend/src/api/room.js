import api from './index';

// 教室相关API
export const roomAPI = {
  // 获取教室列表（分页）
  getRoomList: (params) => {
    return api.get('/room/page', { params });
  },

  // 获取教室详情
  getRoomById: (id) => {
    return api.get(`/room/${id}`);
  },

  // 创建教室
  createRoom: (data) => {
    return api.post('/room/create', data);
  },

  // 更新教室
  updateRoom: (id, data) => {
    return api.put(`/room/${id}`, data);
  },

  // 删除教室
  deleteRoom: (id) => {
    return api.delete(`/room/${id}`);
  },

  // 申请教室
  applyRoom: (data) => {
    return api.post('/room/apply', data);
  }
}; 