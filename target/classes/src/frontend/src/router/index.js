import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import RoomList from '../pages/RoomList';
import ApplicationManagement from '../pages/ApplicationManagement';
import MyApplications from '../pages/MyApplications';
import UserList from '../pages/UserList';
import UserProfile from '../pages/UserProfile';
import NotFound from '../pages/NotFound';
import AppLayout from '../components/Layout';
import RoleBasedLayout from '../components/RoleBasedLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import RoleBasedRoute from '../components/RoleBasedRoute';
import { useAuth } from '../contexts/AuthContext';

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
      <Route path="/login" element={<Login />} />
      
      {/* 需要认证的路由 - 使用基于角色的布局 */}
      <Route path="/" element={
        <ProtectedRoute>
          <RoleBasedLayout><Dashboard /></RoleBasedLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <RoleBasedLayout><Dashboard /></RoleBasedLayout>
        </ProtectedRoute>
      } />

      <Route path="/rooms" element={
        <RoleBasedRoute pageName="rooms">
          <RoleBasedLayout><RoomList /></RoleBasedLayout>
        </RoleBasedRoute>
      } />
      <Route path="/application-management" element={
        <RoleBasedRoute pageName="application-management">
          <RoleBasedLayout>
            <ApplicationManagement />
          </RoleBasedLayout>
        </RoleBasedRoute>
      } />
      <Route path="/my-applications" element={
        <ProtectedRoute>
          <RoleBasedLayout><MyApplications /></RoleBasedLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <RoleBasedLayout><UserProfile /></RoleBasedLayout>
        </ProtectedRoute>
      } />
      <Route path="/user-management" element={
        <AdminRoute>
          <RoleBasedLayout><UserList /></RoleBasedLayout>
        </AdminRoute>
      } />
      

      <Route path="/users" element={
        <AdminRoute>
          <RoleBasedLayout><UserList /></RoleBasedLayout>
        </AdminRoute>
      } />
      
      {/* 404页面 */}
      <Route path="/404" element={<NotFound />} />
      
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