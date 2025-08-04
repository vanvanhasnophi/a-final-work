import { ActivityType } from '../utils/activityTypes';

// 活动服务类
class ActivityService {
  constructor() {
    this.activities = [];
    this.maxActivities = 100; // 最大保存活动数量
  }

  // 添加新活动
  addActivity(activity) {
    const newActivity = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      ...activity
    };

    // 添加到活动列表开头
    this.activities.unshift(newActivity);

    // 限制活动数量
    if (this.activities.length > this.maxActivities) {
      this.activities = this.activities.slice(0, this.maxActivities);
    }

    // 保存到本地存储
    this.saveToLocalStorage();

    return newActivity;
  }

  // 获取用户活动
  getUserActivities(userId, limit = 10) {
    return this.activities
      .filter(activity => activity.userId === userId)
      .slice(0, limit);
  }

  // 根据用户角色获取活动
  getActivitiesByRole(userRole, userId, limit = 10) {
    if (userRole === 'ADMIN') {
      // 管理员可以看到所有活动
      return this.getAllActivities(limit);
    } else {
      // 其他用户只能看到自己的活动和系统活动
      const userActivities = this.getUserActivities(userId, limit);
      const systemActivities = this.getSystemActivities(Math.floor(limit / 2));
      
      // 合并用户活动和系统活动，按时间排序
      const allActivities = [...userActivities, ...systemActivities];
      allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      
      return allActivities.slice(0, limit);
    }
  }

  // 获取所有活动
  getAllActivities(limit = 20) {
    return this.activities.slice(0, limit);
  }

  // 获取系统活动
  getSystemActivities(limit = 10) {
    return this.activities
      .filter(activity => activity.type.startsWith('SYSTEM_'))
      .slice(0, limit);
  }

  // 获取申请相关活动
  getApplicationActivities(limit = 10) {
    return this.activities
      .filter(activity => activity.type.startsWith('APPLICATION_'))
      .slice(0, limit);
  }

  // 获取房间相关活动
  getRoomActivities(limit = 10) {
    return this.activities
      .filter(activity => activity.type.startsWith('ROOM_'))
      .slice(0, limit);
  }

  // 清除活动
  clearActivities() {
    this.activities = [];
    this.saveToLocalStorage();
  }

  // 保存到本地存储
  saveToLocalStorage() {
    try {
      localStorage.setItem('roomX_activities', JSON.stringify(this.activities));
    } catch (error) {
      console.error('保存活动到本地存储失败:', error);
    }
  }

  // 从本地存储加载
  loadFromLocalStorage() {
    try {
      const stored = localStorage.getItem('roomX_activities');
      if (stored) {
        this.activities = JSON.parse(stored);
      }
    } catch (error) {
      console.error('从本地存储加载活动失败:', error);
      this.activities = [];
    }
  }

  // 生成模拟活动数据
  generateMockActivities() {
    const mockActivities = [
      {
        type: ActivityType.APPLICATION_CREATED,
        user: '张三',
        userId: 1,
        room: '会议室A',
        roomId: 1,
        description: '申请使用会议室A进行项目讨论'
      },
      {
        type: ActivityType.APPLICATION_APPROVED,
        user: '李四',
        userId: 2,
        room: '培训室B',
        roomId: 2,
        description: '培训申请已获批，可以开始准备'
      },
      {
        type: ActivityType.APPLICATION_REJECTED,
        user: '王五',
        userId: 3,
        room: '实验室C',
        roomId: 3,
        description: '申请被拒绝，时间冲突'
      },
      {
        type: ActivityType.USER_LOGIN,
        user: '赵六',
        userId: 4,
        description: '用户登录系统'
      },
      {
        type: ActivityType.ROOM_CREATED,
        user: '管理员',
        userId: 999,
        room: '新会议室D',
        roomId: 4,
        description: '创建了新的会议室'
      },
      {
        type: ActivityType.USER_UPDATED,
        user: '张三',
        userId: 1,
        description: '更新了个人信息'
      },
      {
        type: ActivityType.APPLICATION_CANCELLED,
        user: '李四',
        userId: 2,
        room: '会议室A',
        roomId: 1,
        description: '取消了会议室预约'
      },
      {
        type: ActivityType.APPLICATION_COMPLETED,
        user: '王五',
        userId: 3,
        room: '培训室B',
        roomId: 2,
        description: '培训已完成'
      }
    ];

    // 为每个活动添加时间戳（最近7天内）
    const now = new Date();
    mockActivities.forEach((activity, index) => {
      const daysAgo = Math.floor(Math.random() * 7);
      const hoursAgo = Math.floor(Math.random() * 24);
      const minutesAgo = Math.floor(Math.random() * 60);
      
      const timestamp = new Date(now);
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(timestamp.getHours() - hoursAgo);
      timestamp.setMinutes(timestamp.getMinutes() - minutesAgo);
      
      activity.timestamp = timestamp.toISOString();
      activity.id = Date.now() + index;
    });

    this.activities = mockActivities;
    this.saveToLocalStorage();
  }

  // 根据用户ID生成个性化活动
  generateUserActivities(userId, username) {
    const userActivities = [
      {
        type: ActivityType.APPLICATION_CREATED,
        user: username,
        userId: userId,
        room: '会议室A',
        roomId: 1,
        description: '申请使用会议室进行团队会议'
      },
      {
        type: ActivityType.APPLICATION_APPROVED,
        user: username,
        userId: userId,
        room: '培训室B',
        roomId: 2,
        description: '培训申请已获批'
      },
      {
        type: ActivityType.USER_UPDATED,
        user: username,
        userId: userId,
        description: '更新了个人信息'
      },
      {
        type: ActivityType.APPLICATION_COMPLETED,
        user: username,
        userId: userId,
        room: '实验室C',
        roomId: 3,
        description: '实验已完成'
      }
    ];

    // 为每个活动添加时间戳
    const now = new Date();
    userActivities.forEach((activity, index) => {
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

    return userActivities;
  }
}

// 创建全局活动服务实例
const activityService = new ActivityService();

// 初始化时加载本地存储的活动
activityService.loadFromLocalStorage();

// 如果没有活动数据，生成模拟数据
if (activityService.activities.length === 0) {
  activityService.generateMockActivities();
}

export default activityService; 