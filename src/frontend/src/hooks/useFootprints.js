import { useState, useEffect, useCallback } from 'react';
import footprintService from '../services/footprintService';
import { canViewAction } from '../utils/footprintTypes';

export const useFootprints = (options = {}) => {
  const {
    type = 'all', // 'all', 'user', 'visible'
    userId = null,
    userRole = null,
    limit = 10,
    autoRefresh = false,
    refreshInterval = 30000 // 30秒
  } = options;

  const [footprints, setFootprints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [initialized, setInitialized] = useState(false);

  // 获取FootPrint数据的核心函数
  const fetchData = async (pageNum = 1, reset = false) => {
    if (loading && !reset) return; // 避免重复请求
    
    setLoading(true);
    setError(null);
    
    try {
      let fetchedFootprints = [];
      
      switch (type) {
        case 'user':
          if (userId) {
            const response = await footprintService.getUserFootprints(userId, 'operations', pageNum - 1, limit);
            fetchedFootprints = response.records || response.content || [];
            setHasMore(response.pageNum < Math.ceil(response.total / response.pageSize) - 1);
          }
          break;
        case 'all':
        case 'visible':
        default:
          // 获取所有可见的FootPrint记录
          const response = await footprintService.getAllFootprints(pageNum - 1, limit);
          let allFootprints = response.records || response.content || [];
          
          // 根据用户角色过滤可见性
          if (type === 'visible' && userRole) {
            allFootprints = allFootprints.filter(footprint => 
              canViewAction(footprint.action, userRole)
            );
          }
          
          fetchedFootprints = allFootprints;
          setHasMore(response.pageNum < Math.ceil(response.total / response.pageSize) - 1);
          break;
      }
      
      if (reset || pageNum === 1) {
        setFootprints(fetchedFootprints);
        setPage(2);
      } else {
        setFootprints(prev => [...prev, ...fetchedFootprints]);
        setPage(prev => prev + 1);
      }
      
    } catch (error) {
      console.error('获取FootPrint数据失败:', error);
      setError(error.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 刷新数据
  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    setError(null);
    fetchData(1, true);
  }, [type, userId, userRole, limit]);

  // 加载更多数据
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchData(page, false);
    }
  }, [loading, hasMore, page, type, userId, userRole, limit]);

  // 清除数据
  const clear = useCallback(() => {
    setFootprints([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setInitialized(false);
  }, []);

  // 初始化加载数据
  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      fetchData(1, true);
    }
  }, [type, userId, userRole, limit]);

  // 自动刷新（仅在组件挂载后启动）
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0 || !initialized) return;

    const intervalId = setInterval(() => {
      fetchData(1, true);
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, initialized]);

  // 统计数据
  const stats = {
    total: footprints.length,
    byAction: footprints.reduce((acc, footprint) => {
      acc[footprint.action] = (acc[footprint.action] || 0) + 1;
      return acc;
    }, {}),
  };

  return {
    footprints,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    clear,
    stats,
    
    // 兼容性别名（已弃用）
    // activities: footprints,
    // fetchActivities: refresh,
  };
};
