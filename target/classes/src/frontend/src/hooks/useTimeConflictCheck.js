import { useState, useCallback } from 'react';
import { applicationAPI } from '../api/application';
import { formatDateTimeForBackend } from '../utils/dateUtils';

export const useTimeConflictCheck = (roomId) => {
  const [isChecking, setIsChecking] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [conflictMessage, setConflictMessage] = useState('');

  const checkTimeConflict = useCallback(async (startTime, endTime, excludeApplicationId = null) => {
    if (!roomId || !startTime || !endTime) {
      setHasConflict(false);
      setConflictMessage('');
      return;
    }

    setIsChecking(true);
    try {
      const response = await applicationAPI.checkTimeConflict(
        roomId,
        formatDateTimeForBackend(startTime),
        formatDateTimeForBackend(endTime),
        excludeApplicationId
      );
      
      setHasConflict(response.data);
      setConflictMessage(response.data ? '所选时间段与已有预约冲突' : '');
    } catch (error) {
      console.error('检查时间冲突失败:', error);
      setHasConflict(false);
      setConflictMessage('检查时间冲突失败');
    } finally {
      setIsChecking(false);
    }
  }, [roomId]);

  const clearConflict = useCallback(() => {
    setHasConflict(false);
    setConflictMessage('');
  }, []);

  return {
    isChecking,
    hasConflict,
    conflictMessage,
    checkTimeConflict,
    clearConflict
  };
}; 