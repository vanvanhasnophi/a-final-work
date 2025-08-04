// 权限管理工具类
import { getRoleDisplayName } from './roleMapping';

// 角色枚举
export const UserRole = {
  ADMIN: 'ADMIN',
  APPLIER: 'APPLIER',
  APPROVER: 'APPROVER',
  SERVICE: 'SERVICE',
  MAINTAINER: 'MAINTAINER'
};

// 权限定义
export const Permissions = {
  // 教室管理权限
  ROOM_CREATE: [UserRole.ADMIN],
  ROOM_UPDATE: [UserRole.ADMIN],
  ROOM_DELETE: [UserRole.ADMIN],
  ROOM_VIEW: [UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER],
  
  // 申请管理权限
  APPLICATION_CREATE: [UserRole.APPLIER, UserRole.ADMIN],
  APPLICATION_VIEW_ALL: [UserRole.ADMIN, UserRole.APPROVER],
  APPLICATION_VIEW_OWN: [UserRole.APPLIER],
  APPLICATION_APPROVE: [UserRole.ADMIN, UserRole.APPROVER],
  APPLICATION_CANCEL: [UserRole.APPLIER, UserRole.ADMIN, UserRole.APPROVER],
  
  // 用户管理权限
  USER_MANAGE: [UserRole.ADMIN],
  USER_VIEW: [UserRole.ADMIN, UserRole.APPROVER],
  USER_CREATE: [UserRole.ADMIN],
  USER_DELETE: [UserRole.ADMIN],
  
  // 通知管理权限
  NOTIFICATION_VIEW: [UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER]
};

// 页面权限定义
export const PagePermissions = {
  'dashboard': [UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER],
  'profile': [UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER],
  'notifications': [UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER],
  'user-management': [UserRole.ADMIN],
  'rooms': [UserRole.ADMIN, UserRole.APPLIER, UserRole.APPROVER, UserRole.SERVICE, UserRole.MAINTAINER],
  'application-management': [UserRole.ADMIN, UserRole.APPROVER],
  'my-applications': [UserRole.APPLIER]
};

/**
 * 检查用户是否有指定权限
 * @param {string} userRole - 用户角色
 * @param {Array} requiredRoles - 需要的角色列表
 * @returns {boolean} - 是否有权限
 */
export function hasPermission(userRole, requiredRoles) {
  return requiredRoles.includes(userRole);
}

/**
 * 检查用户是否有教室创建权限
 */
export function canCreateRoom(userRole) {
  return hasPermission(userRole, Permissions.ROOM_CREATE);
}

/**
 * 检查用户是否有教室更新权限
 */
export function canUpdateRoom(userRole) {
  return hasPermission(userRole, Permissions.ROOM_UPDATE);
}

/**
 * 检查用户是否有教室删除权限
 */
export function canDeleteRoom(userRole) {
  return hasPermission(userRole, Permissions.ROOM_DELETE);
}

/**
 * 检查用户是否有教室查看权限
 */
export function canViewRoom(userRole) {
  return hasPermission(userRole, Permissions.ROOM_VIEW);
}

/**
 * 检查用户是否有申请创建权限
 */
export function canCreateApplication(userRole) {
  return hasPermission(userRole, Permissions.APPLICATION_CREATE);
}

/**
 * 检查用户是否有查看所有申请的权限
 */
export function canViewAllApplications(userRole) {
  return hasPermission(userRole, Permissions.APPLICATION_VIEW_ALL);
}

/**
 * 检查用户是否有查看自己申请的权限
 */
export function canViewOwnApplications(userRole) {
  return hasPermission(userRole, Permissions.APPLICATION_VIEW_OWN);
}

/**
 * 检查用户是否有申请审批权限
 */
export function canApproveApplication(userRole) {
  return hasPermission(userRole, Permissions.APPLICATION_APPROVE);
}

/**
 * 检查用户是否有申请撤销权限
 */
export function canCancelApplication(userRole) {
  return hasPermission(userRole, Permissions.APPLICATION_CANCEL);
}

/**
 * 检查用户是否有用户管理权限
 */
export function canManageUsers(userRole) {
  return hasPermission(userRole, Permissions.USER_MANAGE);
}

/**
 * 检查用户是否有用户查看权限
 */
export function canViewUsers(userRole) {
  return hasPermission(userRole, Permissions.USER_VIEW);
}

/**
 * 检查用户是否有用户创建权限
 */
export function canCreateUser(userRole) {
  return hasPermission(userRole, Permissions.USER_CREATE);
}

/**
 * 检查用户是否有用户删除权限
 */
export function canDeleteUser(userRole) {
  return hasPermission(userRole, Permissions.USER_DELETE);
}

/**
 * 检查用户是否有通知查看权限
 */
export function canViewNotifications(userRole) {
  return hasPermission(userRole, Permissions.NOTIFICATION_VIEW);
}

/**
 * 检查用户是否可以访问指定页面
 */
export function canAccessPage(userRole, pageName) {
  const requiredRoles = PagePermissions[pageName];
  return requiredRoles ? hasPermission(userRole, requiredRoles) : false;
}

/**
 * 获取用户可访问的页面列表
 */
export function getAccessiblePages(userRole) {
  const pages = [];
  
  Object.keys(PagePermissions).forEach(pageName => {
    if (canAccessPage(userRole, pageName)) {
      pages.push(pageName);
    }
  });
  
  return pages;
}



/**
 * 获取用户角色的颜色 - 莫兰迪色调（80%透明度）
 */
export function getRoleColor(role) {
  switch (role) {
    case UserRole.ADMIN:
      return '#D4A5A5CC'; // 莫兰迪红色
    case UserRole.APPLIER:
      return '#A5C4A5CC'; // 莫兰迪绿色
    case UserRole.APPROVER:
      return '#A5B8D4CC'; // 莫兰迪蓝色
    case UserRole.SERVICE:
      return '#D4C4A5CC'; // 莫兰迪橙色
    case UserRole.MAINTAINER:
      return '#C4A5D4CC'; // 莫兰迪紫色
    default:
      return '#B8B8B8CC'; // 莫兰迪灰色
  }
}

/**
 * 获取用户角色的菜单配置
 */
export function getRoleMenuConfig(userRole) {
  const baseMenu = [
    { key: 'dashboard', label: '仪表板', icon: 'DashboardOutlined' },
    { key: 'profile', label: '个人资料', icon: 'UserOutlined' }
  ];

  const roleSpecificMenu = [];
  
  switch (userRole) {
    case UserRole.ADMIN:
      roleSpecificMenu.push(
        { key: 'user-management', label: '用户管理', icon: 'TeamOutlined' },
        { key: 'rooms', label: '教室管理', icon: 'HomeOutlined' },
        { key: 'application-management', label: '申请管理', icon: 'FileTextOutlined' }
      );
      break;
    case UserRole.APPLIER:
      roleSpecificMenu.push(
        { key: 'my-applications', label: '我的申请', icon: 'FormOutlined' },
        { key: 'rooms', label: '教室列表', icon: 'HomeOutlined' }
      );
      break;
    case UserRole.APPROVER:
      roleSpecificMenu.push(
        { key: 'application-management', label: '申请管理', icon: 'FileTextOutlined' },
        { key: 'rooms', label: '教室列表', icon: 'HomeOutlined' }
      );
      break;
    case UserRole.SERVICE:
    case UserRole.MAINTAINER:
      roleSpecificMenu.push(
        { key: 'rooms', label: '教室列表', icon: 'HomeOutlined' }
      );
      break;
  }
  
  return [...baseMenu, ...roleSpecificMenu];
}

/**
 * 获取用户角色的操作权限配置
 */
export function getRoleActionConfig(userRole) {
  const config = {
    canCreateRoom: canCreateRoom(userRole),
    canUpdateRoom: canUpdateRoom(userRole),
    canDeleteRoom: canDeleteRoom(userRole),
    canViewRoom: canViewRoom(userRole),
    canCreateApplication: canCreateApplication(userRole),
    canViewAllApplications: canViewAllApplications(userRole),
    canViewOwnApplications: canViewOwnApplications(userRole),
    canApproveApplication: canApproveApplication(userRole),
    canCancelApplication: canCancelApplication(userRole),
    canManageUsers: canManageUsers(userRole),
    canViewUsers: canViewUsers(userRole),
    canViewNotifications: canViewNotifications(userRole)
  };
  
  return config;
} 