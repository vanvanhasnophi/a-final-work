import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

  // 登出
  const logout = useCallback(async () => {
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
    }
  }, [user?.username]);

  // 检查token是否有效
  const checkAuth = useCallback(async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const response = await authAPI.getCurrentUser();
        setUser(response.data);
        setToken(storedToken);
      } catch (error) {
        console.error('Token验证失败:', error);
        // 直接清理状态，不调用logout避免循环
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }, []); // 移除logout依赖

  // 登录
  const login = async (username, password) => {
    try {
      console.log('AuthContext: 开始登录请求');
      const response = await authAPI.login(username, password);
      console.log('AuthContext: 登录响应:', response);
      console.log('AuthContext: 响应数据:', response.data);
      
      // 检查响应数据结构
      if (!response.data || !response.data.token) {
        console.error('AuthContext: 响应数据格式错误:', response.data);
        return { success: false, error: '服务器响应格式错误' };
      }
      
      // 后端返回的是UserTokenDTO格式，包含token和用户信息
      const { token: newToken, id, username: userName, nickname, role } = response.data;
      console.log('AuthContext: 解析的token:', newToken);
      console.log('AuthContext: 解析的用户信息:', { id, userName, nickname, role });
      
      // 构造用户对象
      const userData = {
        id,
        username: userName,
        nickname,
        role
      };
      
      // 保存到localStorage
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // 更新状态
      setToken(newToken);
      setUser(userData);
      
      console.log('AuthContext: 登录完成，token已设置');
      console.log('AuthContext: localStorage检查:', {
        token: localStorage.getItem('token'),
        user: localStorage.getItem('user')
      });
      console.log('AuthContext: 状态更新完成:', {
        token: newToken,
        user: userData
      });
      
      return { success: true };
    } catch (error) {
      console.error('AuthContext: 登录失败:', error);
      const errorMessage = error.response?.data || '登录失败，请检查用户名和密码';
      return { success: false, error: errorMessage };
    }
  };

  // 注册
  const register = async (userData) => {
    try {
      // 移除确认密码字段，因为后端不需要
      const { confirmPassword, ...registerData } = userData;
      
      await authAPI.register(registerData);
      return { success: true };
    } catch (error) {
      console.error('注册失败:', error);
      const errorMessage = error.response?.data || '注册失败，请检查输入信息';
      return { success: false, error: errorMessage };
    }
  };

  // 检查是否已登录
  const isAuthenticated = () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const hasToken = !!storedToken;
    const hasUser = !!storedUser;
    
    // 同时检查localStorage和state中的值
    const stateHasToken = !!token;
    const stateHasUser = !!user;
    
    console.log('isAuthenticated检查:', { 
      hasToken, 
      hasUser, 
      storedToken: storedToken ? '存在' : '不存在',
      storedUser: storedUser ? '存在' : '不存在',
      stateToken: token ? '存在' : '不存在',
      stateUser: user ? '存在' : '不存在',
      stateHasToken,
      stateHasUser
    });
    
    // 只要localStorage中有token和user就认为已认证
    return hasToken && hasUser;
  };

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

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