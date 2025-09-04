// 活动动态操作类型定义
export const FootprintActionType = {
  // 用户操作
  USER_CREATE: 'user create',
  USER_UPDATE: 'user update', 
  USER_DELETE: 'user delete',
  USER_PASSWORD: 'user password',

  // 申请操作
  APP_SUBMIT: 'app submit',
  APP_APPROVE: 'app approve',
  APP_REJECT: 'app reject',
  APP_CANCEL: 'app cancel',
  APP_CLOSE: 'app close',
  APP_DELETE: 'app delete',
  APP_CHECKIN: 'app checkin',

  // 房间操作
  ROOM_CREATE: 'room create',
  ROOM_UPDATE: 'room update',
  ROOM_DELETE: 'room delete',

  // 值班操作
  DUTY_ASSIGN: 'duty assign',
  DUTY_CREATE: 'duty create',
  DUTY_UPDATE: 'duty update',
  DUTY_DELETE: 'duty delete',

  // 系统操作
  SYSTEM: 'system',
  SYSTEM_UPGRADE: 'system upgrade'
};

// 活动动态可见性级别
export const FootprintVisibilityLevel = {
  ADMIN: 'admin',
  APPROVER: 'approver', 
  OPERATOR: 'operator',
  NONE: 'none'
};

// 操作类型分类
export const FootprintCategory = {
  USER: 'user',
  APP: 'app',
  ROOM: 'room', 
  DUTY: 'duty',
  SYSTEM: 'system'
};

// 获取操作类型的中文显示名称
export const getActionDisplayName = (action) => {
  const actionMap = {
    [FootprintActionType.USER_CREATE]: '创建用户',
    [FootprintActionType.USER_UPDATE]: '更新用户',
    [FootprintActionType.USER_DELETE]: '删除用户',
    [FootprintActionType.USER_PASSWORD]: '修改密码',

    [FootprintActionType.APP_SUBMIT]: '提交申请',
    [FootprintActionType.APP_APPROVE]: '批准申请',
    [FootprintActionType.APP_REJECT]: '驳回申请',
    [FootprintActionType.APP_CANCEL]: '取消申请',
    [FootprintActionType.APP_CLOSE]: '关闭申请',
    [FootprintActionType.APP_DELETE]: '删除申请',
    [FootprintActionType.APP_CHECKIN]: '申请签到',

    [FootprintActionType.ROOM_CREATE]: '创建房间',
    [FootprintActionType.ROOM_UPDATE]: '更新房间',
    [FootprintActionType.ROOM_DELETE]: '删除房间',

    [FootprintActionType.DUTY_ASSIGN]: '安排值班',
    [FootprintActionType.DUTY_CREATE]: '创建值班',
    [FootprintActionType.DUTY_UPDATE]: '更新值班',
    [FootprintActionType.DUTY_DELETE]: '删除值班',

    [FootprintActionType.SYSTEM]: '系统操作',
    [FootprintActionType.SYSTEM_UPGRADE]: '系统升级'
  };

  return actionMap[action] || action;
};



// 获取操作类型的颜色
export const getActionColor = (action) => {
  // 根据操作类别返回不同颜色
  if (action.startsWith('user')) {
    return '#1890ff'; // 蓝色 - 用户操作
  } else if (action.startsWith('app')) {
    return '#52c41a'; // 绿色 - 申请操作
  } else if (action.startsWith('room')) {
    return '#faad14'; // 黄色 - 房间操作
  } else if (action.startsWith('duty')) {
    return '#722ed1'; // 紫色 - 值班操作
  } else if (action.startsWith('system')) {
    return '#f5222d'; // 红色 - 系统操作
  }
  return '#666'; // 默认灰色
};

// 解析操作类型
export const parseActionType = (action) => {
  const parts = action.split(' ');
  return {
    category: parts[0] || 'unknown',
    operation: parts[1] || 'unknown',
    fullAction: action
  };
};

// 检查用户是否有权限查看该操作
export const canViewAction = (action, userRole, footprintVisibilityLevel = FootprintVisibilityLevel.OPERATOR) => {
  const level = footprintVisibilityLevel;
  
  switch (level) {
    case FootprintVisibilityLevel.NONE:
      return false;
    case FootprintVisibilityLevel.ADMIN:
      return userRole === 'ADMIN';
    case FootprintVisibilityLevel.APPROVER:
      return ['ADMIN', 'APPROVER'].includes(userRole);
    case FootprintVisibilityLevel.OPERATOR:
      return ['ADMIN', 'APPROVER', 'APPLIER', 'MAINTAINER', 'SERVICE_STAFF'].includes(userRole);
    default:
      return true;
  }
};

// 根据操作类型获取相关的实体类型
export const getRelatedEntityType = (action) => {
  const category = parseActionType(action).category;
  
  switch (category) {
    case FootprintCategory.USER:
      return 'user';
    case FootprintCategory.APP:
      return 'application';
    case FootprintCategory.ROOM:
      return 'room';
    case FootprintCategory.DUTY:
      return 'duty';
    case FootprintCategory.SYSTEM:
      return 'system';
    default:
      return 'unknown';
  }
};

// 格式化活动动态描述
export const formatFootprintDescription = (footprint) => {
  const { action, desc, tempInfo, operatorName, userName, roomName, applicationName } = footprint;
  
  // 如果有自定义描述，直接使用
  if (desc && desc.trim()) {
    return desc;
  }
  
  // 根据操作类型生成描述
  const actionDisplay = getActionDisplayName(action);
  let description = actionDisplay;
  
  // 添加操作人信息
  if (operatorName) {
    description = `${operatorName} ${actionDisplay}`;
  }
  
  // 添加相关对象信息
  if (userName) {
    description += ` (用户: ${userName})`;
  }
  if (roomName) {
    description += ` (房间: ${roomName})`;
  }
  if (applicationName) {
    description += ` (申请: ${applicationName})`;
  }
  
  // 添加临时信息
  if (tempInfo && tempInfo.trim()) {
    description += ` - ${tempInfo}`;
  }
  
  return description;
};

export default {
  FootprintActionType,
  FootprintVisibilityLevel,
  FootprintCategory,
  getActionDisplayName,
  getActionColor,
  parseActionType,
  canViewAction,
  getRelatedEntityType,
  formatFootprintDescription
};
