import request from './index';

export const notificationAPI = {
  // 获取指定用户的通知列表
  getNotificationsByUser: (userId) => request.get(`/notifications/user/${userId}`),
  // 标记指定用户所有通知为已读
  markAllAsReadByUser: (userId) => request.post(`/notifications/user/${userId}/read-all`),
  // 删除指定用户所有通知
  deleteAllByUser: (userId) => request.delete(`/notifications/user/${userId}`),
  // 获取指定用户未读通知数
  getUnreadCountByUser: (userId) => request.get(`/notifications/user/${userId}/unread-count`),
  // 获取指定用户通知统计
  getStatsByUser: (userId) => request.get(`/notifications/user/${userId}/stats`),
  // 标记单条通知为已读（保持原接口）
  markAsRead: (notificationId) => request.put(`/notifications/${notificationId}/read`),
  // 删除单条通知（保持原接口）
  deleteNotification: (notificationId) => request.delete(`/notifications/${notificationId}`),
  // Admin发送测试通知给自己（保持原接口）
  sendTestNotification: () => request.post('/notifications/admin/send-test-notification')
};