// 统一的映射工具类 - 合并所有*Mapping.js文件
import { tGlobal } from '../contexts/I18nContext';

// ===== 申请状态相关 =====
export const getApplicationStatusDisplayName = (status) => {
  const key = `applicationManagement.statusOptions.${status}`;
  return tGlobal(key, status || '未知状态');
};

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

export const isApplicationExpired = (record) => {
  if (!record) return false;
  const expired = record.expired;
  return expired === true || expired === 1 || expired === "1";
};

// ===== 教室状态相关 =====
export const getRoomStatusDisplayName = (status) => {
  const key = `room.status.${status}`;
  return tGlobal(key, status || '未知状态');
};

export const getRoomStatusColor = (status) => {
  const colorMapping = {
    'AVAILABLE': 'success',
    'RESERVED': 'processing',
    'USING': 'warning',
    'MAINTENANCE': 'error',
    'CLEANING': 'default',
    'PENDING_CLEANING': 'orange',
    'PENDING_MAINTENANCE': 'volcano',
    'UNAVAILABLE': 'default'
  };
  return colorMapping[status] || 'default';
};

export const roomStatusOptions = [
  { value: 'AVAILABLE', label: '可用' },
  { value: 'RESERVED', label: '已预约' },
  { value: 'USING', label: '使用中' },
  { value: 'MAINTENANCE', label: '维护中' },
  { value: 'CLEANING', label: '清洁中' },
  { value: 'UNAVAILABLE', label: '不可用' }
];

// ===== 用户角色相关 =====
export const getRoleDisplayName = (role) => {
  if (!role) return tGlobal('user.role.DEFAULT', '普通用户');
  const key = `user.role.${role}`;
  const fallback = (
    role === 'APPLIER' ? '申请人' :
    role === 'APPROVER' ? '审批人' :
    role === 'ADMIN' ? '管理员' :
    role === 'SERVICE' ? '服务人员' :
    role === 'MAINTAINER' ? '维护人员' : '普通用户'
  );
  return tGlobal(key, fallback);
};

// ===== 权限相关 =====
export const getPermissionDisplayName = (permission) => {
  if (!permission) return tGlobal('user.permission.UNSET', '未设置');
  const key = `user.permission.${permission}`;
  const fallback = (
    permission === 'READ_ONLY' ? '只读' :
    permission === 'RESTRICTED' ? '受限' :
    permission === 'NORMAL' ? '正常' :
    permission === 'EXTENDED' ? '扩展' : '未设置'
  );
  return tGlobal(key, fallback);
};

// ===== 房间相关 =====
export const getRoomDisplayName = (room) => {
  if (!room) return '未知教室';
  return room.name || room.roomName || `教室${room.id}`;
};

export const getRoomCapacityColor = (capacity) => {
  if (capacity >= 100) return 'red';
  if (capacity >= 50) return 'orange';
  if (capacity >= 20) return 'blue';
  return 'green';
};
