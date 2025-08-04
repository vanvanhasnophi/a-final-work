// 活动类型定义和工具函数
export const ActivityType = {
  // 申请相关
  APPLICATION_CREATED: 'APPLICATION_CREATED',
  APPLICATION_APPROVED: 'APPLICATION_APPROVED',
  APPLICATION_REJECTED: 'APPLICATION_REJECTED',
  APPLICATION_CANCELLED: 'APPLICATION_CANCELLED',
  APPLICATION_COMPLETED: 'APPLICATION_COMPLETED',
  APPLICATION_EXPIRED: 'APPLICATION_EXPIRED',
  
  // 房间相关
  ROOM_CREATED: 'ROOM_CREATED',
  ROOM_UPDATED: 'ROOM_UPDATED',
  ROOM_DELETED: 'ROOM_DELETED',
  ROOM_STATUS_CHANGED: 'ROOM_STATUS_CHANGED',
  ROOM_MAINTENANCE_STARTED: 'ROOM_MAINTENANCE_STARTED',
  ROOM_MAINTENANCE_COMPLETED: 'ROOM_MAINTENANCE_COMPLETED',
  ROOM_CLEANING_STARTED: 'ROOM_CLEANING_STARTED',
  ROOM_CLEANING_COMPLETED: 'ROOM_CLEANING_COMPLETED',
  
  // 用户相关
  USER_REGISTERED: 'USER_REGISTERED',
  USER_UPDATED: 'USER_UPDATED',
  USER_LOGIN: 'USER_LOGIN',
  
  // 系统相关
  SYSTEM_MAINTENANCE: 'SYSTEM_MAINTENANCE',
  SYSTEM_BACKUP: 'SYSTEM_BACKUP'
};

// 活动类型中文映射
export const getActivityTypeDisplayName = (type) => {
  const typeMapping = {
    [ActivityType.APPLICATION_CREATED]: '申请房间',
    [ActivityType.APPLICATION_APPROVED]: '申请获批',
    [ActivityType.APPLICATION_REJECTED]: '申请被拒',
    [ActivityType.APPLICATION_CANCELLED]: '取消申请',
    [ActivityType.APPLICATION_COMPLETED]: '申请完成',
    [ActivityType.APPLICATION_EXPIRED]: '申请过期',
    [ActivityType.ROOM_CREATED]: '创建房间',
    [ActivityType.ROOM_UPDATED]: '更新房间',
    [ActivityType.ROOM_DELETED]: '删除房间',
    [ActivityType.ROOM_STATUS_CHANGED]: '房间状态变更',
    [ActivityType.ROOM_MAINTENANCE_STARTED]: '开始维修',
    [ActivityType.ROOM_MAINTENANCE_COMPLETED]: '维修完成',
    [ActivityType.ROOM_CLEANING_STARTED]: '开始清洁',
    [ActivityType.ROOM_CLEANING_COMPLETED]: '清洁完成',
    [ActivityType.USER_REGISTERED]: '用户注册',
    [ActivityType.USER_UPDATED]: '更新信息',
    [ActivityType.USER_LOGIN]: '用户登录',
    [ActivityType.SYSTEM_MAINTENANCE]: '系统维护',
    [ActivityType.SYSTEM_BACKUP]: '系统备份'
  };
  return typeMapping[type] || type || '未知活动';
};

// 活动类型颜色映射 - 使用与applications一致的标准颜色
export const getActivityTypeColor = (type) => {
  const colorMapping = {
    [ActivityType.APPLICATION_CREATED]: 'processing',    // 蓝色 - 处理中
    [ActivityType.APPLICATION_APPROVED]: 'success',      // 绿色 - 成功
    [ActivityType.APPLICATION_REJECTED]: 'error',        // 红色 - 错误
    [ActivityType.APPLICATION_CANCELLED]: 'warning',     // 橙色 - 警告
    [ActivityType.APPLICATION_COMPLETED]: 'default',     // 灰色 - 默认
    [ActivityType.APPLICATION_EXPIRED]: 'error',         // 红色 - 错误
    [ActivityType.ROOM_CREATED]: 'success',              // 绿色 - 成功
    [ActivityType.ROOM_UPDATED]: 'processing',           // 蓝色 - 处理中
    [ActivityType.ROOM_DELETED]: 'error',                // 红色 - 错误
    [ActivityType.ROOM_STATUS_CHANGED]: 'processing',    // 蓝色 - 处理中
    [ActivityType.ROOM_MAINTENANCE_STARTED]: 'warning',  // 橙色 - 警告
    [ActivityType.ROOM_MAINTENANCE_COMPLETED]: 'success', // 绿色 - 成功
    [ActivityType.ROOM_CLEANING_STARTED]: 'processing',  // 蓝色 - 处理中
    [ActivityType.ROOM_CLEANING_COMPLETED]: 'success',   // 绿色 - 成功
    [ActivityType.USER_REGISTERED]: 'success',            // 绿色 - 成功
    [ActivityType.USER_UPDATED]: 'processing',            // 蓝色 - 处理中
    [ActivityType.USER_LOGIN]: 'processing',              // 蓝色 - 处理中
    [ActivityType.SYSTEM_MAINTENANCE]: 'warning',         // 橙色 - 警告
    [ActivityType.SYSTEM_BACKUP]: 'processing'            // 蓝色 - 处理中
  };
  return colorMapping[type] || 'default'; // 默认灰色
};

// 活动类型图标映射（已弃用，保持兼容性）
export const getActivityTypeIcon = (type) => {
  return ''; // 不再使用图标
};

// 生成活动描述
export const generateActivityDescription = (activity) => {
  const { type, user, room, application } = activity;
  
  switch (type) {
    case ActivityType.APPLICATION_CREATED:
      return `${user} 申请了 ${room}`;
    case ActivityType.APPLICATION_APPROVED:
      return `${user} 的申请已获批`;
    case ActivityType.APPLICATION_REJECTED:
      return `${user} 的申请被拒绝`;
    case ActivityType.APPLICATION_CANCELLED:
      return `${user} 取消了申请`;
    case ActivityType.APPLICATION_COMPLETED:
      return `${user} 的申请已完成`;
    case ActivityType.APPLICATION_EXPIRED:
      return `${user} 的申请已过期`;
    case ActivityType.ROOM_CREATED:
      return `创建了新房间 ${room}`;
    case ActivityType.ROOM_UPDATED:
      return `更新了房间 ${room}`;
    case ActivityType.ROOM_DELETED:
      return `删除了房间 ${room}`;
    case ActivityType.ROOM_STATUS_CHANGED:
      return `房间 ${room} 状态发生变更`;
    case ActivityType.ROOM_MAINTENANCE_STARTED:
      return `房间 ${room} 开始维修`;
    case ActivityType.ROOM_MAINTENANCE_COMPLETED:
      return `房间 ${room} 维修完成`;
    case ActivityType.ROOM_CLEANING_STARTED:
      return `房间 ${room} 开始清洁`;
    case ActivityType.ROOM_CLEANING_COMPLETED:
      return `房间 ${room} 清洁完成`;
    case ActivityType.USER_REGISTERED:
      return `新用户 ${user} 注册了账号`;
    case ActivityType.USER_UPDATED:
      return `${user} 更新了个人信息`;
    case ActivityType.USER_LOGIN:
      return `${user} 登录了系统`;
    case ActivityType.SYSTEM_MAINTENANCE:
      return '系统进行了维护';
    case ActivityType.SYSTEM_BACKUP:
      return '系统进行了备份';
    default:
      return '发生了未知活动';
  }
}; 