/**
 * 获取用户显示名称，优先显示nickname，如果nickname不存在则显示username
 * @param {Object} user - 用户对象
 * @returns {string} 用户显示名称
 */
export function getUserDisplayName(user) {
  if (!user) return '';
  
  // 优先显示nickname，如果nickname不存在或为空，则显示username
  return user.nickname || user.username || '';
}

/**
 * 获取用户头像显示字符，优先使用nickname的首字符，如果nickname不存在则使用username的首字符
 * @param {Object} user - 用户对象
 * @returns {string} 头像显示字符
 */
export function getUserAvatarChar(user) {
  if (!user) return '';
  
  const displayName = getUserDisplayName(user);
  return displayName.charAt(0).toUpperCase();
} 