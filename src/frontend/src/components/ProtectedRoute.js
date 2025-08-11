import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  console.log('ProtectedRoute检查:', { 
    loading, 
    isAuthenticated: isAuthenticated(), 
    pathname: location.pathname 
  });

  if (loading) {
    console.log('ProtectedRoute: 正在加载中...');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
  <Spin size="large" tip={t('common.loading', '加载中…')} />
      </div>
    );
  }

  if (!isAuthenticated()) {
    console.log('ProtectedRoute: 未认证，重定向到登录页');
    // 保存用户想要访问的页面，登录后重定向回去
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute: 已认证，显示受保护的内容');
  return children;
};

export default ProtectedRoute; 