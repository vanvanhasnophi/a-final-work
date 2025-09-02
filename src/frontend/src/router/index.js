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
  LazyLayoutComponents,
  LazyLoginMobile,
  LazyDashboardMobile,
  LazyRoomListMobile,
  LazyApplicationManagementMobile,
  LazyMyApplicationsMobile,
  LazyUserListMobile,
  LazyUserProfileMobile,
  LazyDutyScheduleMobile,
  LazySettingsMobile,
  LazyNotFoundMobile,
  LazyLayoutComponentsMobile,
} from './lazyComponents';
// 保留必要的即时加载组件（轻量级组件）
import ProtectedRoute from '../components/ProtectedRoute';
import AdminRoute from '../components/AdminRoute';
import RoleBasedRoute from '../components/RoleBasedRoute';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import isMobileFn from '../utils/isMobile';
import { useLocation } from 'react-router-dom';

// 解构懒加载的布局组件
const { AppLayout } = LazyLayoutComponents;
const { AppLayoutMobile } = LazyLayoutComponents;


function AppRoutes() {
  const { loading } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  // 每次路由切换都重新判断 UA
  const isMobile = React.useMemo(() => isMobileFn(), [location.pathname]);

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

  return isMobile ? (// 移动端
    <Routes>
      {/* 公开路由 */}
      <Route path="/login" element={<LazyLoginMobile />} />
      
      {/* 需要认证的路由 - 使用基于角色的布局 */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayoutMobile><LazyDashboardMobile /></AppLayoutMobile>
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AppLayoutMobile><LazyDashboardMobile /></AppLayoutMobile>
        </ProtectedRoute>
      } />

      <Route path="/rooms" element={
        <RoleBasedRoute pageName="rooms">
          <AppLayoutMobile><LazyRoomListMobile /></AppLayoutMobile>
        </RoleBasedRoute>
      } />
      <Route path="/application-management" element={
        <RoleBasedRoute pageName="application-management">
          <AppLayoutMobile>
            <LazyApplicationManagementMobile />
          </AppLayoutMobile>
        </RoleBasedRoute>
      } />
      <Route path="/my-applications" element={
        <RoleBasedRoute pageName="my-applications">
          <AppLayoutMobile><LazyMyApplicationsMobile /></AppLayoutMobile>
        </RoleBasedRoute>
      } />
      <Route path="/profile/*" element={
        <ProtectedRoute>
          <AppLayoutMobile><LazyUserProfileMobile /></AppLayoutMobile>
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <AppLayoutMobile><LazyUserProfileMobile /></AppLayoutMobile>
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <AppLayoutMobile><LazySettingsMobile /></AppLayoutMobile>
        </ProtectedRoute>
      } />
      <Route path="/user-management" element={
        <AdminRoute>
          <AppLayoutMobile><LazyUserListMobile /></AppLayoutMobile>
        </AdminRoute>
      } />
      

      <Route path="/users" element={
        <AdminRoute>
          <AppLayoutMobile><LazyUserListMobile /></AppLayoutMobile>
        </AdminRoute>
      } />
      
      {/* 值班表管理 - 仅 ADMIN 和 APPROVER 可见 */}
      <Route path="/duty-schedule" element={
        <RoleBasedRoute pageName="duty-schedule">
          <AppLayoutMobile><LazyDutyScheduleMobile /></AppLayoutMobile>
        </RoleBasedRoute>
      } />
      
      
      {/* 404页面 */}
      <Route path="/404" element={<LazyNotFound />} />
      
      {/* 默认重定向 */}
      <Route path="*" element={<Navigate to="/404" replace />} />
      {/* well-known change-password 路由重定向到个人中心的密码修改页面 */}
      <Route path="/.well-known/change-password" element={<Navigate to="/profile/change-password" replace />} />
    </Routes>
  )
  :(
    // 桌面/平板端
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
        <RoleBasedRoute pageName="my-applications">
          <AppLayout><LazyMyApplications /></AppLayout>
        </RoleBasedRoute>
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