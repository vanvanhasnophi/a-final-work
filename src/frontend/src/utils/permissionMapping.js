// 审批权限映射（i18n）
import { tGlobal } from '../contexts/I18nContext';

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