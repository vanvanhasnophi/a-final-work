import { createLazyComponent } from '../components/LazyWrapper';

/**
 * 懒加载页面组件定义
 * 使用动态import()来实现代码分割
 */

// 主要页面组件
export const LazyLogin = createLazyComponent.page(
  () => import('../pages/Login'),
  '登录页面'
);

export const LazyDashboard = createLazyComponent.page(
  () => import('../pages/Dashboard'),
  '仪表盘'
);

export const LazyRoomList = createLazyComponent.page(
  () => import('../pages/RoomList'),
  '教室列表'
);

export const LazyApplicationManagement = createLazyComponent.page(
  () => import('../pages/ApplicationManagement'),
  '申请管理'
);

export const LazyMyApplications = createLazyComponent.page(
  () => import('../pages/MyApplications'),
  '我的申请'
);

export const LazyUserList = createLazyComponent.page(
  () => import('../pages/UserList'),
  '用户管理'
);

export const LazyUserProfile = createLazyComponent.page(
  () => import('../pages/UserProfile'),
  '个人中心'
);

export const LazyDutySchedule = createLazyComponent.page(
  () => import('../pages/DutySchedule'),
  '值班表管理'
);

export const LazySettings = createLazyComponent.page(
  () => import('../pages/Settings'),
  '设置'
);

export const LazyNotFound = createLazyComponent.page(
  () => import('../pages/NotFound'),
  '404页面'
);

// 移动端

export const LazyLoginMobile = createLazyComponent.page(
  () => import('../pages/mobile/LoginM'),
  '移动端登录页面'
);

export const LazyDashboardMobile = createLazyComponent.page(
  () => import('../pages/mobile/DashboardM'),
  '移动端仪表盘'
);

export const LazyRoomListMobile = createLazyComponent.page(
  () => import('../pages/mobile/RoomListM'),
  '移动端教室列表'
);

export const LazyApplicationManagementMobile = createLazyComponent.page(
  () => import('../pages/mobile/ApplicationManagementM'),
  '移动端申请管理'
);

export const LazyMyApplicationsMobile = createLazyComponent.page(
  () => import('../pages/mobile/MyApplicationsM'),
  '移动端我的申请'
);

export const LazyUserListMobile = createLazyComponent.page(
  () => import('../pages/mobile/UserListM'),
  '移动端用户管理'
);

export const LazyUserProfileMobile  = createLazyComponent.page(
  () => import('../pages/mobile/UserProfileM'),
  '移动端个人中心'
);

export const LazyDutyScheduleMobile = createLazyComponent.page(
  () => import('../pages/mobile/DutyScheduleM'),
  '移动端值班表管理'
);

export const LazySettingsMobile = createLazyComponent.page(
  () => import('../pages/mobile/SettingsM'),
  '移动端设置'
);

export const LazyNotFoundMobile = createLazyComponent.page(
  () => import('../pages/mobile/NotFoundM'),
  '移动端404页面'
);

// 布局组件懒加载
export const LazyLayoutComponents = {
  AppLayout: createLazyComponent.component(
    () => import('../components/layout/Layout'),
    '应用布局'
  ),
  AppLayoutMobile: createLazyComponent.component(
    () => import('../components/layout/LayoutM'),
    '移动端应用布局'
  ),
};

const lazyComponentsExport = {
  LazyLogin,
  LazyDashboard,
  LazyRoomList,
  LazyApplicationManagement,
  LazyMyApplications,
  LazyUserList,
  LazyUserProfile,
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
  LazySettingsMobile,
  LazyNotFoundMobile,
};

export default lazyComponentsExport;
