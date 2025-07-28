import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import authAPI from '../api/auth';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // 检查token是否有效
  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
        setToken(storedToken);
      } catch (error) {
        console.error('Token验证失败:', error);
        logout();
      }
    }
    setLoading(false);
  };

  // 登录
  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      const { token: newToken, user: userData } = response.data;
      
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setToken(newToken);
      setUser(userData);
      
      message.success('登录成功！');
      return { success: true };
    } catch (error) {
      console.error('登录失败:', error);
      const errorMessage = error.response?.data || '登录失败，请检查用户名和密码';
      message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 注册
  const register = async (userData) => {
    try {
      // 移除确认密码字段，因为后端不需要
      const { confirmPassword, ...registerData } = userData;
      
      const response = await authAPI.register(registerData);
      message.success('注册成功！请登录');
      return { success: true };
    } catch (error) {
      console.error('注册失败:', error);
      const errorMessage = error.response?.data || '注册失败，请检查输入信息';
      message.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // 登出
  const logout = async () => {
    try {
      if (user?.username) {
        await authAPI.logout(user.username);
      }
    } catch (error) {
      console.error('登出API调用失败:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      message.success('已退出登录');
    }
  };

  // 检查是否已登录
  const isAuthenticated = () => {
    return !!token && !!user;
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 