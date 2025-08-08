import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { LazyTestComponents } from './lazyComponents';
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';

/**
 * 开发环境专用路由
 * 包含各种测试页面的懒加载配置
 */
const DevRoutes = () => {
  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const {
    TestConcurrency,
    TestConnection,
    TestRetry,
    AuthTest,
    ThemeTest
  } = LazyTestComponents;

  return (
    <>
      {/* 并发测试 - 需要管理员权限 */}
      <Route path="test-concurrency" element={
        <AdminRoute>
          <TestConcurrency />
        </AdminRoute>
      } />
      
      {/* 连接测试 - 需要认证 */}
      <Route path="test-connection" element={
        <ProtectedRoute>
          <TestConnection />
        </ProtectedRoute>
      } />
      
      {/* 重试测试 - 需要认证 */}
      <Route path="test-retry" element={
        <ProtectedRoute>
          <TestRetry />
        </ProtectedRoute>
      } />
      
      {/* 认证测试 - 公开访问 */}
      <Route path="auth-test" element={<AuthTest />} />
      
      {/* 主题测试 - 需要认证 */}
      <Route path="theme-test" element={
        <ProtectedRoute>
          <ThemeTest />
        </ProtectedRoute>
      } />
    </>
  );
};

export default DevRoutes;
