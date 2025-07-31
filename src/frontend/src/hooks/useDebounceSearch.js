import { useState, useEffect, useCallback } from 'react';

/**
 * 防抖搜索Hook
 * @param {Function} searchFunction 搜索函数
 * @param {number} delay 延迟时间（毫秒）
 * @returns {Object} 返回搜索状态和控制函数
 */
export const useDebounceSearch = (searchFunction, delay = 500) => {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedValue, setDebouncedValue] = useState('');

  // 防抖效果
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchValue, delay]);

  // 当防抖值变化时执行搜索
  useEffect(() => {
    if (debouncedValue !== undefined) {
      searchFunction(debouncedValue);
    }
  }, [debouncedValue]); // 移除searchFunction依赖

  // 更新搜索值
  const updateSearchValue = useCallback((value) => {
    setSearchValue(value);
  }, []);

  // 立即搜索（不防抖）
  const searchImmediately = useCallback((value) => {
    setSearchValue(value);
    setDebouncedValue(value);
  }, []);

  return {
    searchValue,
    debouncedValue,
    updateSearchValue,
    searchImmediately
  };
}; 