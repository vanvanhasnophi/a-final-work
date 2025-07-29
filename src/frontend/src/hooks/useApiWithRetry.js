import { useState, useCallback } from 'react';
import { message } from 'antd';

export const useApiWithRetry = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeWithRetry = useCallback(async (apiCall, options = {}) => {
    const {
      maxRetries = 2,
      retryDelay = 3000,
      showRetryMessage = true,
      errorMessage = '请求失败，请检查网络连接',
      successMessage = null
    } = options;

    if (loading) return null; // 防止重复请求

    setLoading(true);
    setError(null);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await apiCall();
        
        if (successMessage) {
          message.success(successMessage);
        }
        
        return result;
      } catch (error) {
        console.error(`API调用失败 (尝试 ${attempt + 1}/${maxRetries + 1}):`, error);
        
        if (attempt === maxRetries) {
          // 最后一次尝试失败
          setError(error);
          message.error(errorMessage);
          return null;
        } else {
          // 还有重试机会
          if (showRetryMessage) {
            message.warning(`请求失败，${retryDelay / 1000}秒后重试...`);
          }
          
          // 等待后重试
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }
    }
  }, [loading]);

  return {
    loading,
    error,
    executeWithRetry
  };
}; 