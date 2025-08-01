import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { canAccessPage, hasPermission } from '../utils/permissionUtils';

/**
 * 权限控制组件
 * 根据用户角色控制子组件的显示
 */
const PermissionGuard = ({ 
  children, 
  requiredRoles = [], 
  pageName = null,
  fallback = null,
  showIfNoPermission = false 
}) => {
  const { user } = useAuth();
  
  if (!user) {
    return fallback || null;
  }
  
  let hasAccess = false;
  
  // 如果指定了页面名称，检查页面访问权限
  if (pageName) {
    hasAccess = canAccessPage(user.role, pageName);
  }
  // 如果指定了所需角色，检查角色权限
  else if (requiredRoles.length > 0) {
    hasAccess = hasPermission(user.role, requiredRoles);
  }
  // 如果没有指定权限要求，默认显示
  else {
    hasAccess = true;
  }
  
  // 根据权限和配置决定是否显示
  if (showIfNoPermission) {
    return hasAccess ? null : children;
  } else {
    return hasAccess ? children : fallback;
  }
};

export default PermissionGuard; 