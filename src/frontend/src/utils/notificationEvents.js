// 通知事件管理器 - 用于组件间温柔的通知通信
class NotificationEventManager {
  constructor() {
    this.listeners = new Map();
  }

  // 添加监听器
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // 返回移除监听器的函数
    return () => {
      this.removeEventListener(event, callback);
    };
  }

  // 移除监听器
  removeEventListener(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
      if (this.listeners.get(event).size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  // 触发事件
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`通知事件处理错误 (${event}):`, error);
        }
      });
    }
  }

  // 清除所有监听器
  clear() {
    this.listeners.clear();
  }
}

// 导出单例实例
export const notificationEvents = new NotificationEventManager();

// 预定义的事件类型
export const NOTIFICATION_EVENTS = {
  NEW_NOTIFICATION: 'newNotification',
  UNREAD_COUNT_CHANGED: 'unreadCountChanged',
  NOTIFICATION_READ: 'notificationRead',
  NOTIFICATION_DELETED: 'notificationDeleted'
};
