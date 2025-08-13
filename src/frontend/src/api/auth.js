import request from './index';
import { probeCsrf } from '../security/csrf';

// 登录
export const login = async (username, password) => {
  const resp = await request.post('/login', { username, password });
  // 登录成功后主动探测 CSRF（刷新 XSRF-TOKEN Cookie）
  try { probeCsrf(); } catch (_) {}
  return resp;
};

// 注册
export const register = (userData) => {
  return request.post('/register', userData);
};

// 登出
export const logout = (username) => {
  return request.post('/logout', { username });
};

// 获取当前用户信息
export const getCurrentUser = () => {
  return request.get('/user/me');
};

// 检查会话状态
export const checkSession = () => {
  return request.get('/auth/session/check');
};

// 刷新token
export const refreshToken = () => {
  return request.post('/auth/refresh');
};

// 修改密码
export const updatePassword = (oldPassword, newPassword) => {
  return request.post('/updatePassword', { oldPassword, newPassword });
};

// 删除用户（ADMIN权限）
export const deleteUser = (userId, verificationToken) => {
  return request.delete(`/auth/user/${userId}`, {
    data: { verificationToken }
  });
};

// 危险操作验证
export const dangerousOperationVerify = (password, operation) => {
  return request.post('/auth/dangerous-operation-verify', { password, operation });
};

// 验证密码（保持向后兼容）
export const verifyPassword = (password) => {
  return dangerousOperationVerify(password, 'PASSWORD_VERIFY');
};


const authAPI = {
  login,
  register,
  logout,
  getCurrentUser,
  checkSession,
  refreshToken,
  updatePassword,
  deleteUser,
  verifyPassword,
  dangerousOperationVerify
};

export default authAPI; 