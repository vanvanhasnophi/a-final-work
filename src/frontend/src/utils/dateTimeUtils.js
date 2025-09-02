// 统一的日期时间处理工具
// 合并 dateFormat.js 和 dateUtils.js 的功能，避免重复

import dayjs from 'dayjs';

// ===== 基础格式化函数 =====

// 格式化日期时间显示 (YYYY-MM-DD HH:mm)
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

// 格式化日期显示 (YYYY-MM-DD)
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

// 格式化时间显示 (HH:mm)
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

// 将前端日期时间转换为后端格式 (YYYY-MM-DD HH:mm:ss)
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

// ===== 时间范围处理函数 =====

// 格式化时间范围显示
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

// 验证时间范围
export const validateTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return false;
  
  try {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    
    return start.isValid() && end.isValid() && start.isBefore(end);
  } catch (error) {
    console.error('时间范围验证错误:', error);
    return false;
  }
};

// ===== 相对时间函数 =====

// 格式化相对时间（如：3小时前、2天前等）
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

// ===== 常用日期获取函数 =====

// 获取今天的开始时间
export const getTodayStart = () => dayjs().startOf('day');

// 获取今天的结束时间
export const getTodayEnd = () => dayjs().endOf('day');

// 获取本周的开始时间
export const getWeekStart = () => dayjs().startOf('week');

// 获取本周的结束时间
export const getWeekEnd = () => dayjs().endOf('week');

// 获取本月的开始时间
export const getMonthStart = () => dayjs().startOf('month');

// 获取本月的结束时间
export const getMonthEnd = () => dayjs().endOf('month');
