import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// 使用懒加载组件替代直接导入
import {
  LazyLogin,
  LazyDashboard,
  LazyRoomList,
  LazyApplicationManagement,
  LazyMyApplications,
  LazyUserList,
  LazyUserProfile,
  LazyDutySchedule,
  LazySettings,
  LazyNotFound,
  LazyLayoutComponents
} from './lazyComponents';
// 开发环境路由
import DevRoutes from './DevRoutes';
// 保留必要的即时加载组件（轻量级组件）
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import RoleBasedRoute from '../components/RoleBasedRoute';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';

// 解构懒加载的布局组件
const { AppLayout } = LazyLayoutComponents;

function AppRoutes() {
  const { loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--background-color)',
        color: 'var(--text-color)',
      }}>
  <div>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<LazyLogin />} />
      
      {/* 需要认证的路由 - 使用基于角色的布局 */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout><LazyDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><LazyDashboard /></AppLayout>
        </ProtectedRoute>
      } />

      <Route path="/rooms" element={
        <RoleBasedRoute pageName="rooms">
          <AppLayout><LazyRoomList /></AppLayout>
        </RoleBasedRoute>
      } />
      <Route path="/application-management" element={
        <RoleBasedRoute pageName="application-management">
          <AppLayout>
            <LazyApplicationManagement />
          </AppLayout>
        </RoleBasedRoute>
      } />
      <Route path="/my-applications" element={
        <ProtectedRoute>
          <AppLayout><LazyMyApplications /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile/*" element={
        <ProtectedRoute>
          <AppLayout><LazyUserProfile /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayout><LazyUserProfile /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayout><LazySettings /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/user-management" element={
        <AdminRoute>
          <AppLayout><LazyUserList /></AppLayout>
        </AdminRoute>
      } />
      

      <Route path="/users" element={
        <AdminRoute>
          <AppLayout><LazyUserList /></AppLayout>
        </AdminRoute>
      } />
      
      {/* 值班表管理 - 仅 ADMIN 和 APPROVER 可见 */}
      <Route path="/duty-schedule" element={
        <RoleBasedRoute pageName="duty-schedule">
          <AppLayout><LazyDutySchedule /></AppLayout>
        </RoleBasedRoute>
      } />
      
      {/* 开发环境路由 */}
      <Route path="/dev/*" element={<DevRoutes />} />
      
      {/* 404页面 */}
      <Route path="/404" element={<LazyNotFound />} />
      
      {/* 默认重定向 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
      {/* well-known change-password 路由重定向到个人中心的密码修改页面 */}
      <Route path="/.well-known/change-password" element={<Navigate to="/profile/change-password" replace />} />
    </Routes>
  );
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
} 