import { useState, useEffect, useCallback } from 'react';
import activityService from '../services/activityService';

export const useActivities = (options = {}) => {
  const {
    type = 'all', // 'all', 'user', 'system', 'application', 'room'
    userId = null,
    userRole = null,
    limit = 10,
    autoRefresh = false,
    refreshInterval = 30000 // 30秒
  } = options;

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 获取活动数据
  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let fetchedActivities = [];
      
      switch (type) {
        case 'user':
          if (userId) {
            fetchedActivities = activityService.getUserActivities(userId, limit);
          }
          break;
        case 'system':
          fetchedActivities = activityService.getSystemActivities(limit);
          break;
        case 'application':
          fetchedActivities = activityService.getApplicationActivities(limit);
          break;
        case 'room':
          fetchedActivities = activityService.getRoomActivities(limit);
          break;
        case 'all':
        default:
          // 根据用户角色获取活动
          if (userRole && userId) {
            fetchedActivities = activityService.getActivitiesByRole(userRole, userId, limit);
          } else {
            fetchedActivities = activityService.getAllActivities(limit);
          }
          break;
      }
      
      setActivities(fetchedActivities);
    } catch (err) {
      console.error('获取活动数据失败:', err);
      setError(err.message || '获取活动数据失败');
    } finally {
      setLoading(false);
    }
  }, [type, userId, userRole, limit]);

  // 添加新活动
  const addActivity = useCallback((activity) => {
    const newActivity = activityService.addActivity(activity);
    // 如果新活动符合当前筛选条件，则添加到列表中
    if (type === 'all' || 
        (type === 'user' && activity.userId === userId) ||
        (type === 'system' && activity.type.startsWith('SYSTEM_')) ||
        (type === 'application' && activity.type.startsWith('APPLICATION_')) ||
        (type === 'room' && activity.type.startsWith('ROOM_'))) {
      setActivities(prev => [newActivity, ...prev.slice(0, limit - 1)]);
    }
    return newActivity;
  }, [type, userId, userRole, limit]);

  // 清除活动
  const clearActivities = useCallback(() => {
    activityService.clearActivities();
    setActivities([]);
  }, []);

  // 刷新活动
  const refreshActivities = useCallback(() => {
    fetchActivities();
  }, [fetchActivities]);

  // 初始化加载
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // 自动刷新
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchActivities();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchActivities]);

  return {
    activities,
    loading,
    error,
    addActivity,
    clearActivities,
    refreshActivities,
    fetchActivities
  };
}; 