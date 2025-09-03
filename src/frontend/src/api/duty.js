import  api  from './index';

export const dutyAPI = {
  // 创建值班安排
  createDutySchedule: (data) => {
    return api.post('/duty', data);
  },

  // 更新值班安排
  updateDutySchedule: (id, data) => {
    return api.put(`/duty/${id}`, data);
  },

  // 删除值班安排
  deleteDutySchedule: (id) => {
    return api.delete(`/duty/${id}`);
  },

  // 获取值班安排详情
  getDutySchedule: (id) => {
    return api.get(`/duty/${id}`);
  },

  // 分页查询值班安排
  getDutySchedules: (params) => {
    return api.get('/duty/page', { params });
     
  },

  // 按日期范围查询值班安排
  getDutySchedulesByDateRange: (startDate, endDate) => {
    return api.get('/duty/range', {
      params: {
        startDate,
        endDate
      }
    });
  },

  // 获取今日值班人
  getTodayDuty: () => {
    return api.get('/duty/today');
  },
  // 获取可值班人员列表
  getAvailableDutyUsers: () => {
    return api.get('/duty/available-users');
  }
};
