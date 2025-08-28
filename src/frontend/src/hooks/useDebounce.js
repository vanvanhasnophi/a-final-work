import { useCallback, useRef } from 'react';

export const useDebounce = (delay = 200) => {
  const timeoutRef = useRef(null);

  const debounce = useCallback((callback) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(callback, delay);
  }, [delay]);

  // 清理函数
  const clearDebounce = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { debounce, clearDebounce };
}; 