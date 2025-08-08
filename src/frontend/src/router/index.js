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

// 解构懒加载的布局组件
const { RoleBasedLayout } = LazyLayoutComponents;

function AppRoutes() {
  const { loading } = useAuth();

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
        <div>加载中...</div>
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
          <RoleBasedLayout><LazyDashboard /></RoleBasedLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <RoleBasedLayout><LazyDashboard /></RoleBasedLayout>
        </ProtectedRoute>
      } />

      <Route path="/rooms" element={
        <RoleBasedRoute pageName="rooms">
          <RoleBasedLayout><LazyRoomList /></RoleBasedLayout>
        </RoleBasedRoute>
      } />
      <Route path="/application-management" element={
        <RoleBasedRoute pageName="application-management">
          <RoleBasedLayout>
            <LazyApplicationManagement />
          </RoleBasedLayout>
        </RoleBasedRoute>
      } />
      <Route path="/my-applications" element={
        <ProtectedRoute>
          <RoleBasedLayout><LazyMyApplications /></RoleBasedLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <RoleBasedLayout><LazyUserProfile /></RoleBasedLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <RoleBasedLayout><LazySettings /></RoleBasedLayout>
        </ProtectedRoute>
      } />
      <Route path="/user-management" element={
        <AdminRoute>
          <RoleBasedLayout><LazyUserList /></RoleBasedLayout>
        </AdminRoute>
      } />
      

      <Route path="/users" element={
        <AdminRoute>
          <RoleBasedLayout><LazyUserList /></RoleBasedLayout>
        </AdminRoute>
      } />
      
      {/* 开发环境路由 */}
      <Route path="/dev/*" element={<DevRoutes />} />
      
      {/* 404页面 */}
      <Route path="/404" element={<LazyNotFound />} />
      
      {/* 默认重定向 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
      {/* well-known change-password 路由重定向到个人中心 */}
      <Route path="/.well-known/change-password" element={<Navigate to="/profile" replace />} />
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