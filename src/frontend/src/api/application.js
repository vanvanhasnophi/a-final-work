import api from './index';

// 申请相关API
export const applicationAPI = {
  // 获取申请列表（分页）
  getApplicationList: (params) => {
    return api.get('/application/page', { params });
  },

  // 获取所有申请列表
  getAllApplications: () => {
    return api.get('/application/list');
  },

  // 获取申请详情
  getApplicationById: (id) => {
    return api.get(`/application/${id}`);
  },

  // 创建申请
  createApplication: (data) => {
    return api.post('/application/post', data);
  },

  // 审批申请
  approveApplication: (data) => {
    return api.post('/application/approve', data);
  },

  // 获取房间未来的已批准预约
  getFutureApprovedApplications: (roomId) => {
    return api.get(`/application/room/${roomId}/future-approved`);
  },

  // 检查时间冲突
  checkTimeConflict: (roomId, startTime, endTime, excludeApplicationId = null) => {
    const params = {
      startTime: startTime,
      endTime: endTime
    };
    if (excludeApplicationId) {
      params.excludeApplicationId = excludeApplicationId;
    }
    return api.get(`/application/room/${roomId}/check-conflict`, { params });
  }
}; 