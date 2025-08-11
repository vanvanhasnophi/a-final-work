// 申请状态多语言映射
import { tGlobal } from '../contexts/I18nContext';

export const getApplicationStatusDisplayName = (status) => {
  const key = `applicationManagement.statusOptions.${status}`;
  return tGlobal(key, status || '未知状态');
};

// 申请状态颜色映射工具函数
export const getApplicationStatusColor = (status) => {
  const colorMapping = {
    'PENDING': 'processing',       // 蓝色 - 处理中
    'APPROVED': 'success',         // 绿色 - 成功
    'REJECTED': 'error',           // 红色 - 错误
    'COMPLETED': 'success',        // 绿色 - 成功
    'CANCELLED': 'warning',        // 橙色 - 警告
    'EXPIRED': 'default',          // 灰色 - 已过期
    'PENDING_CHECKIN': 'processing', // 蓝色 - 待签到
    'IN_USE': 'processing'         // 蓝色 - 使用中
  };
  return colorMapping[status] || 'default';
}; 