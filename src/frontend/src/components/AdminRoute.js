import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { getRoleDisplayName } from '../utils/roleMapping';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  console.log('AdminRoute检查:', { 
    loading, 
    isAuthenticated: isAuthenticated(), 
    userRole: user?.role,
    pathname: location.pathname 
  });

  if (loading) {
    console.log('AdminRoute: 正在加载中...');
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
    console.log('AdminRoute: 未认证，重定向到登录页');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 检查是否为管理员
  if (user?.role !== 'ADMIN') {
    console.log('AdminRoute: 非管理员用户，显示权限不足页面');
    return (
      <Result
        status="403"
        title="403"
        subTitle={t('applicationManagement.auth.result403Subtitle', '抱歉，您没有权限访问此页面。')}
        extra={
          <div>
            <p>{t('applicationManagement.auth.result403RolePrefix', '当前用户角色: ')}{getRoleDisplayName(user?.role)}</p>
            <p>{t('applicationManagement.auth.result403NeedRole', '需要管理员或审批人权限才能访问申请管理功能。')}</p>
            <Button type="primary" onClick={() => window.history.back()}>
              {t('applicationManagement.actions.back', '返回上一页')}
            </Button>
          </div>
        }
      />
    );
  }

  console.log('AdminRoute: 管理员用户，显示受保护的内容');
  return children;
};

export default AdminRoute; 