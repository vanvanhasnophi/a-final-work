// 用户角色映射（i18n）
import { tGlobal } from '../contexts/I18nContext';

export const getRoleDisplayName = (role) => {
  if (!role) return tGlobal('user.role.DEFAULT', '普通用户');
  const key = `user.role.${role}`;
  // 回退到原始中文或英文
  const fallback = (
    role === 'APPLIER' ? '申请人' :
    role === 'APPROVER' ? '审批人' :
    role === 'ADMIN' ? '管理员' :
    role === 'SERVICE' ? '服务人员' :
    role === 'MAINTAINER' ? '维护人员' : '普通用户'
  );
  return tGlobal(key, fallback);
};