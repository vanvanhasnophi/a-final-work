import api from './index';

// 房间相关API
export const roomAPI = {
  // 获取房间列表（分页）
  getRoomList: (params) => {
    return api.get('/room/page', { params });
  },

  // 获取房间详情
  getRoomById: (id) => {
    return api.get(`/room/${id}`);
  },

  // 创建房间
  createRoom: (data) => {
    return api.post('/room/create', data);
  },

  // 更新房间
  updateRoom: (id, data) => {
    return api.put(`/room/${id}`, data);
  },

  // 删除房间
  deleteRoom: (id) => {
    return api.delete(`/room/${id}`);
  }
}; 