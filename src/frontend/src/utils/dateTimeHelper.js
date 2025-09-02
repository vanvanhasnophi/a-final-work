// 统一的日期时间处理工具 - 合并dateFormat.js和dateUtils.js
import dayjs from 'dayjs';

// ===== 基础格式化函数 =====
export const formatDateTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  try {
    const date = dayjs(dateTimeString);
    if (!date.isValid()) return dateTimeString;
    
    return date.format('YYYY-MM-DD HH:mm');
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateTimeString;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = dayjs(dateString);
    if (!date.isValid()) return dateString;
    
    return date.format('YYYY-MM-DD');
  } catch (error) {
    console.error('日期格式化错误:', error);
    return dateString;
  }
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const time = dayjs(timeString);
    if (!time.isValid()) return timeString;
    
    return time.format('HH:mm');
  } catch (error) {
    console.error('时间格式化错误:', error);
    return timeString;
  }
};

// ===== 后端交互函数 =====
export const formatDateTimeForBackend = (dateTime) => {
  if (!dateTime) return null;
  
  try {
    const date = dayjs(dateTime);
    if (!date.isValid()) return null;
    
    return date.format('YYYY-MM-DD HH:mm:ss');
  } catch (error) {
    console.error('日期转换错误:', error);
    return null;
  }
};

export const parseDateTimeFromBackend = (dateTimeString) => {
  if (!dateTimeString) return null;
  
  try {
    return dayjs(dateTimeString);
  } catch (error) {
    console.error('日期解析错误:', error);
    return null;
  }
};

// ===== 时间范围处理 =====
export const formatTimeRange = (startTime, endTime, options = {}) => {
  if (!startTime || !endTime) return '';
  
  const { structured = false } = options;
  
  try {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    
    if (!start.isValid() || !end.isValid()) {
      return structured ? { text: '', crossDay: false } : '';
    }
    
    const startFormatted = start.format('MM-DD HH:mm');
    const endFormatted = end.format('MM-DD HH:mm');
    const crossDay = !start.isSame(end, 'day');
    
    if (structured) {
      return {
        text: crossDay 
          ? `${startFormatted} - ${endFormatted}` 
          : `${start.format('MM-DD')} ${start.format('HH:mm')}-${end.format('HH:mm')}`,
        startFormatted,
        endFormatted,
        crossDay
      };
    }
    
    return crossDay 
      ? `${startFormatted} - ${endFormatted}` 
      : `${start.format('MM-DD')} ${start.format('HH:mm')}-${end.format('HH:mm')}`;
  } catch (error) {
    console.error('时间范围格式化错误:', error);
    return structured ? { text: '', crossDay: false } : '';
  }
};

export const validateTimeRange = (startTime, endTime) => {
  const now = dayjs();
  
  if (!startTime || !endTime) {
    return { valid: false, message: '请选择开始和结束时间' };
  }
  
  if (startTime.isBefore(now)) {
    return { valid: false, message: '申请开始时间不能早于当前时间' };
  }
  
  if (endTime.isBefore(startTime)) {
    return { valid: false, message: '结束时间不能早于开始时间' };
  }
  
  if (endTime.isSame(startTime)) {
    return { valid: false, message: '结束时间不能等于开始时间' };
  }
  
  return { valid: true, message: '' };
};

// ===== 相对时间和工具函数 =====
export const formatRelativeTime = (dateTimeString) => {
  if (!dateTimeString) return '';
  
  try {
    const date = dayjs(dateTimeString);
    if (!date.isValid()) return dateTimeString;
    
    const now = dayjs();
    const diffMinutes = now.diff(date, 'minute');
    
    if (diffMinutes < 1) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    
    const diffHours = now.diff(date, 'hour');
    if (diffHours < 24) return `${diffHours}小时前`;
    
    const diffDays = now.diff(date, 'day');
    if (diffDays < 30) return `${diffDays}天前`;
    
    const diffMonths = now.diff(date, 'month');
    if (diffMonths < 12) return `${diffMonths}个月前`;
    
    const diffYears = now.diff(date, 'year');
    return `${diffYears}年前`;
  } catch (error) {
    console.error('相对时间格式化错误:', error);
    return dateTimeString;
  }
};

// 获取常用日期
export const getTodayStart = () => dayjs().startOf('day');
export const getTodayEnd = () => dayjs().endOf('day');
export const getWeekStart = () => dayjs().startOf('week');
export const getWeekEnd = () => dayjs().endOf('week');
export const getMonthStart = () => dayjs().startOf('month');
export const getMonthEnd = () => dayjs().endOf('month');
