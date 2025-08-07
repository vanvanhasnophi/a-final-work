import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 防抖搜索Hook V2 - 更稳定的实现
 * @param {Function} searchFunction 搜索函数
 * @param {number} delay 延迟时间（毫秒）
 * @returns {Object} 返回搜索状态和控制函数
 */
export const useDebounceSearchV2 = (searchFunction, delay = 500) => {
  const [searchValue, setSearchValue] = useState('');
  const searchFunctionRef = useRef(searchFunction);
  
  // 更新搜索函数引用
  searchFunctionRef.current = searchFunction;

  // 防抖效果
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== undefined && searchFunctionRef.current) {
        searchFunctionRef.current(searchValue);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [searchValue, delay]);

  // 更新搜索值
  const updateSearchValue = useCallback((value) => {
    setSearchValue(value);
  }, []);

  // 立即搜索（不防抖）
  const searchImmediately = useCallback((value) => {
    setSearchValue(value);
    if (searchFunctionRef.current) {
      searchFunctionRef.current(value);
    }
  }, []);

  return {
    searchValue,
    updateSearchValue,
    searchImmediately
  };
}; 