import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { canAccessPage } from '../utils/permissionUtils';

/**
 * 基于角色的路由组件
 * @param {Object} props
 * @param {string} props.pageName - 页面名称
 * @param {React.ReactNode} props.children - 子组件
 * @param {string} props.fallbackPath - 权限不足时的重定向路径
 */
const RoleBasedRoute = ({ pageName, children, fallbackPath = '/dashboard' }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!canAccessPage(user.role, pageName)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default RoleBasedRoute; 