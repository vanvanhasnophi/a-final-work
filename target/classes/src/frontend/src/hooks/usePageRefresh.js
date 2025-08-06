import { useCallback, useRef } from 'react';

/**
 * 页面数据刷新Hook
 * 用于在ErrorBoundary返回上一级时触发数据重新加载
 */
export const usePageRefresh = (refreshFunction) => {
  const refreshRef = useRef(refreshFunction);
  
  // 更新refresh函数引用
  refreshRef.current = refreshFunction;
  
  const handlePageRefresh = useCallback(async () => {
    if (refreshRef.current && typeof refreshRef.current === 'function') {
      try {
        await refreshRef.current();
      } catch (error) {
        console.error('Error during page refresh:', error);
      }
    }
  }, []);
  
  return handlePageRefresh;
}; 