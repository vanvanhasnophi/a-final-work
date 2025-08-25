import { request } from '../utils/request';

export const dutyAPI = {
  // 创建值班安排
  createDutySchedule: (data) => {
    return request({
      url: '/duty',
      method: 'POST',
      data
    });
  },

  // 更新值班安排
  updateDutySchedule: (id, data) => {
    return request({
      url: `/duty/${id}`,
      method: 'PUT',
      data
    });
  },

  // 删除值班安排
  deleteDutySchedule: (id) => {
    return request({
      url: `/duty/${id}`,
      method: 'DELETE'
    });
  },

  // 获取值班安排详情
  getDutySchedule: (id) => {
    return request({
      url: `/duty/${id}`,
      method: 'GET'
    });
  },

  // 分页查询值班安排
  getDutySchedules: (params) => {
    return request({
      url: '/duty/page',
      method: 'GET',
      params
    });
  },

  // 按日期范围查询值班安排
  getDutySchedulesByDateRange: (startDate, endDate) => {
    return request({
      url: '/duty/range',
      method: 'GET',
      params: {
        startDate,
        endDate
      }
    });
  },

  // 获取今日值班人
  getTodayDuty: () => {
    return request({
      url: '/duty/today',
      method: 'GET'
    });
  },

  // 获取可值班人员列表
  getAvailableDutyUsers: () => {
    return request({
      url: '/duty/available-users',
      method: 'GET'
    });
  }
};
