import { request } from '../utils/request';

export const notificationAPI = {
  // 获取通知列表
  getNotifications: (params) => {
    return request({
      url: '/api/notifications',
      method: 'GET',
      params
    });
  },

  // 标记通知为已读
  markAsRead: (notificationId) => {
    return request({
      url: `/api/notifications/${notificationId}/read`,
      method: 'PUT'
    });
  },

  // 标记所有通知为已读
  markAllAsRead: () => {
    return request({
      url: '/api/notifications/read-all',
      method: 'PUT'
    });
  },

  // 删除通知
  deleteNotification: (notificationId) => {
    return request({
      url: `/api/notifications/${notificationId}`,
      method: 'DELETE'
    });
  },

  // 获取未读通知数量
  getUnreadCount: () => {
    return request({
      url: '/api/notifications/unread-count',
      method: 'GET'
    });
  }
}; 