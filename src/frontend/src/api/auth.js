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
export const updatePassword = (oldPassword, newPassword) => {
  return request.post('/updatePassword', { oldPassword, newPassword });
};


const authAPI = {
  login,
  register,
  logout,
  getCurrentUser,
  refreshToken,
  updatePassword
};

export default authAPI; 