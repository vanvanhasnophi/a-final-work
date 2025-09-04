import request from './index';

export const footprintAPI = {
  // 创建FootPrint记录
  createFootprint: (data) => {
    return request.post('/footprint', data);
  },

  // 获取用户相关的FootPrint记录
  getUserFootprints: (userId, params) => {
    return request.get(`/footprint/user/${userId}`, { params });
  },

  // 获取所有FootPrint记录（分页）
  getAllFootprints: (params) => {
    return request.get('/footprint', { params });
  },

  // 根据用户角色获取可见的FootPrint记录
  getVisibleFootprints: (params) => {
    return request.get('/footprint/visible', { params });
  },

  // 获取FootPrint详情
  getFootprintDetail: (id) => {
    return request.get(`/footprint/${id}`);
  },

  // 批量创建FootPrint记录
  batchCreateFootprints: (dataList) => {
    return request.post('/footprint/batch', dataList);
  },

  // 删除FootPrint记录（管理员功能）
  deleteFootprint: (id) => {
    return request.delete(`/footprint/${id}`);
  },

  // 获取FootPrint统计信息
  getFootprintStats: (params) => {
    return request.get('/footprint/stats', { params });
  }
};
