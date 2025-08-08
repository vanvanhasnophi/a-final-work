import { useEffect, useCallback } from 'react';
import { preloadStrategies, preloadStatus } from '../utils/preloadUtils';
import { useAuth } from '../contexts/AuthContext';

/**
 * 路由预加载Hook
 * 提供智能预加载功能
 */
export const useRoutePreload = () => {
  const { user, isAuthenticated } = useAuth();

  // 用户登录后的预加载策略
  useEffect(() => {
    if (isAuthenticated && user?.role) {
      preloadStrategies.afterLogin(user.role);
    }
  }, [isAuthenticated, user?.role]);

  // 空闲时间预加载
  useEffect(() => {
    preloadStrategies.onIdle();
  }, []);

  // 导航悬停预加载
  const handleNavigationHover = useCallback((pageName) => {
    preloadStrategies.onNavigationHover(pageName);
  }, []);

  // 手动预加载指定页面
  const manualPreload = useCallback((pageName) => {
    preloadStrategies.onNavigationHover(pageName);
  }, []);

  // 获取预加载状态
  const getPreloadStatus = useCallback((key) => {
    return preloadStatus.getStatus(key);
  }, []);

  // 获取预加载统计
  const getPreloadStats = useCallback(() => {
    return preloadStatus.getStats();
  }, []);

  return {
    handleNavigationHover,
    manualPreload,
    getPreloadStatus,
    getPreloadStats,
  };
};

export default useRoutePreload;
