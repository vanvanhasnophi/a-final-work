import request from './index';

export const notificationAPI = {
  // 获取通知列表
  getNotifications: (params) => {
    return request.get('/notifications', { params });
  },

  // 标记通知为已读
  markAsRead: (notificationId) => {
    return request.put(`/notifications/${notificationId}/read`);
  },

  // 标记所有通知为已读
  markAllAsRead: () => {
    return request.put('/notifications/read-all'); 
  },

  // 删除通知
  deleteNotification: (notificationId) => {
    return request.delete(`/notifications/${notificationId}`);
  },

  // 获取未读通知数量
  getUnreadCount: () => {
    return request.get('/notifications/unread-count');
  }
}; 