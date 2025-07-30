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
  }
}; 