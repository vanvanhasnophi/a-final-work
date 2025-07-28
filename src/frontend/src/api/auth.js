import request from './index';

// 登录
export const login = (username, password) => {
  return request.post('/login', { username, password });
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

// 刷新token
export const refreshToken = () => {
  return request.post('/auth/refresh');
};

// 修改密码
export const changePassword = (oldPassword, newPassword) => {
  return request.post('/updatePassword', { oldPassword, newPassword });
};

// 忘记密码
export const forgotPassword = (email) => {
  return request.post('/auth/forgot-password', { email });
};

// 重置密码
export const resetPassword = (token, newPassword) => {
  return request.post('/auth/reset-password', { token, newPassword });
};

const authAPI = {
  login,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
};

export default authAPI; 