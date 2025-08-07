import { ActivityType } from '../utils/activityTypes';

class ActivityService {
  constructor() {
    this.activities = [];
    this.maxActivities = 100;
    this.currentUserId = null;
    this.currentUserRole = null;
  }

  setCurrentUser(userId, userRole) {
    this.currentUserId = userId;
    this.currentUserRole = userRole;
    this.loadFromLocalStorage();
  }

  addActivity(activity) {
    const newActivity = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...activity
    };
    this.activities.unshift(newActivity);
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }
    this.saveToLocalStorage();
    return newActivity;
  }

  getUserActivities(userId, limit = 10) {
    return this.activities.filter(activity => activity.userId === userId).slice(0, limit);
  }

  getRoomActivities(limit = 10) {
    return this.activities.filter(activity => String(activity.type).startsWith('ROOM_')).slice(0, limit);
  }

  getApplicationActivities(limit = 10) {
    return this.activities.filter(activity => String(activity.type).startsWith('APPLICATION_')).slice(0, limit);
  }

  getApplicationProcessActivities(limit = 10) {
    // 申请处理相关：审批、拒绝、完成、取消
    return this.activities.filter(activity => [
      ActivityType.APPLICATION_APPROVED,
      ActivityType.APPLICATION_REJECTED,
      ActivityType.APPLICATION_COMPLETED,
      ActivityType.APPLICATION_CANCELLED
    ].includes(activity.type)).slice(0, limit);
  }

  getSystemActivities(limit = 10) {
    return this.activities.filter(activity => String(activity.type).startsWith('SYSTEM_')).slice(0, limit);
  }

  getAllActivities(limit = 20) {
    return this.activities.slice(0, limit);
  }

  // 角色过滤
  getActivitiesByRole(userRole, userId, limit = 10) {
    if (userRole === 'ADMIN') {
      // 只看教室相关
      return this.getRoomActivities(limit);
    } else if (userRole === 'APPROVER') {
      // 申请相关+处理相关
      const apply = this.getApplicationActivities(limit);
      const process = this.getApplicationProcessActivities(limit);
      const all = [...apply, ...process];
      all.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return all.slice(0, limit);
    } else {
      // 普通用户只看自己
      return this.getUserActivities(userId, limit);
    }
  }

  clearActivities() {
    this.activities = [];
    this.saveToLocalStorage();
  }

  saveToLocalStorage() {
    if (!this.currentUserId) return;
    try {
      localStorage.setItem(`roomX_activities_user_${this.currentUserId}`, JSON.stringify(this.activities));
    } catch (error) {
      console.error('保存活动到本地存储失败:', error);
    }
  }

  loadFromLocalStorage() {
    if (!this.currentUserId) return;
    try {
      const stored = localStorage.getItem(`roomX_activities_user_${this.currentUserId}`);
      if (stored) {
        this.activities = JSON.parse(stored);
      } else {
        this.activities = [];
      }
    } catch (error) {
      console.error('从本地存储加载活动失败:', error);
      this.activities = [];
    }
  }

  // 登录后刷新模拟活动数据
  refreshMockActivities(userId, username, userRole) {
    // 生成不同角色的模拟活动
    let mock = [];
    const now = new Date();
    if (userRole === 'ADMIN') {
      // 只生成教室相关
      mock = [
        {
          type: ActivityType.ROOM_CREATED,
          user: username,
          userId,
          room: '会议室A',
          roomId: 1,
          description: '创建了会议室A'
        },
        {
          type: ActivityType.ROOM_UPDATED,
          user: username,
          userId,
          room: '会议室A',
          roomId: 1,
          description: '更新了会议室A信息'
        },
        {
          type: ActivityType.ROOM_DELETED,
          user: username,
          userId,
          room: '会议室B',
          roomId: 2,
          description: '删除了会议室B'
        }
      ];
    } else if (userRole === 'APPROVER') {
      // 申请相关+处理相关
      mock = [
        {
          type: ActivityType.APPLICATION_CREATED,
          user: '张三',
          userId: 2,
          room: '会议室A',
          roomId: 1,
          description: '张三申请了会议室A'
        },
        {
          type: ActivityType.APPLICATION_APPROVED,
          user: username,
          userId,
          room: '会议室A',
          roomId: 1,
          description: '审批通过了张三的申请'
        },
        {
          type: ActivityType.APPLICATION_REJECTED,
          user: username,
          userId,
          room: '会议室B',
          roomId: 2,
          description: '拒绝了李四的申请'
        }
      ];
    } else {
      // 普通用户
      mock = [
        {
          type: ActivityType.APPLICATION_CREATED,
          user: username,
          userId,
          room: '会议室A',
          roomId: 1,
          description: '申请了会议室A'
        },
        {
          type: ActivityType.APPLICATION_COMPLETED,
          user: username,
          userId,
          room: '会议室A',
          roomId: 1,
          description: '会议室A使用完成'
        },
        {
          type: ActivityType.USER_UPDATED,
          user: username,
          userId,
          description: '更新了个人信息'
        }
      ];
    }
    // 时间戳
    mock.forEach((activity, index) => {
      const daysAgo = Math.floor(Math.random() * 3);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(timestamp.getHours() - hoursAgo);
      timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);
      activity.timestamp = timestamp.toISOString();
      activity.id = Date.now() + index + userId;
    });
    this.activities = mock;
    this.saveToLocalStorage();
  }
}

const activityService = new ActivityService();
export default activityService; 