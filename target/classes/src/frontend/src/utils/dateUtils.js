import dayjs from 'dayjs';

// 将前端日期时间转换为后端格式
export const formatDateTimeForBackend = (dateTime) => {
  if (!dateTime) return null;
  
  try {
    const date = dayjs(dateTime);
    if (!date.isValid()) return null;
    
    // 后端期望的格式：YYYY-MM-DD HH:mm:ss
    return date.format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    console.error('日期转换错误:', error);
    return null;
  }
};

// 将后端日期时间转换为前端格式
export const parseDateTimeFromBackend = (dateTimeString) => {
  if (!dateTimeString) return null;
  
  try {
    return dayjs(dateTimeString);
  } catch (error) {
    console.error('日期解析错误:', error);
    return null;
  }
};

// 验证时间范围
export const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) {
    return { valid: false, message: '请选择开始和结束时间' };
  }
  
  if (endTime.isBefore(startTime)) {
    return { valid: false, message: '结束时间不能早于开始时间' };
  }
  
  if (endTime.isSame(startTime)) {
    return { valid: false, message: '结束时间不能等于开始时间' };
  }
  
  // 检查时间间隔是否合理（至少15分钟）
  const duration = endTime.diff(startTime, 'minute');
  if (duration < 15) {
    return { valid: false, message: '使用时间至少需要15分钟' };
  }
  
  return { valid: true };
};

// 获取当前时间
export const getCurrentDateTime = () => {
  return dayjs();
};

// 检查日期是否为今天或未来
export const isDateValid = (date) => {
  if (!date) return false;
  return date.isSame(dayjs(), 'day') || date.isAfter(dayjs(), 'day');
}; 