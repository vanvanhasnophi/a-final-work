import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import RoomList from '../pages/RoomList';
import ApplicationList from '../pages/ApplicationList';
import UserProfile from '../pages/UserProfile';
import NotFound from '../pages/NotFound';
import TestConnection from '../pages/TestConnection';
import AuthTest from '../pages/AuthTest';
import ThemeTest from '../pages/ThemeTest';
import SimpleTest from '../pages/SimpleTest';
import AppLayout from '../components/Layout';
import ProtectedRoute from '../components/ProtectedRoute';
import { useAuth } from '../contexts/AuthContext';

function AppRoutes() {
  const { isAuthenticated, loading } = useAuth();

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
      <Route path="/login" element={
        isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />
      } />
      <Route path="/test" element={<TestConnection />} />
      <Route path="/auth-test" element={<AuthTest />} />
      <Route path="/theme-test" element={<ThemeTest />} />
      <Route path="/simple-test" element={<SimpleTest />} />
      
      {/* 需要认证的路由 */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayout><Dashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/rooms" element={
        <ProtectedRoute>
          <AppLayout><RoomList /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/applications" element={
        <ProtectedRoute>
          <AppLayout><ApplicationList /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayout><UserProfile /></AppLayout>
        </ProtectedRoute>
      } />
      
      {/* 404页面 */}
      <Route path="/404" element={<NotFound />} />
      
      {/* 默认重定向 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
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