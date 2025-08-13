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

// 测试和开发页面（按需懒加载）
export const LazyActivityManagement = createLazyComponent.page(
  () => import('../pages/ActivityManagement'),
  '活动管理'
);

export const LazyApplicationList = createLazyComponent.page(
  () => import('../pages/ApplicationList'),
  '申请列表'
);

export const LazyDevPage = createLazyComponent.page(
  () => import('../pages/DevPage'),
  '开发页面'
);

// 测试组件（开发环境专用）
export const LazyTestComponents = {
  TestConcurrency: createLazyComponent.page(
    () => import('../pages/TestConcurrency'),
    '并发测试'
  ),
  TestConnection: createLazyComponent.page(
    () => import('../pages/TestConnection'),
    '连接测试'
  ),
  TestRetry: createLazyComponent.page(
    () => import('../pages/TestRetry'),
    '重试测试'
  ),
  AuthTest: createLazyComponent.page(
    () => import('../pages/AuthTest'),
    '认证测试'
  ),
  ThemeTest: createLazyComponent.page(
    () => import('../pages/ThemeTest'),
    '主题测试'
  ),
};

// 布局组件懒加载
export const LazyLayoutComponents = {
  AppLayout: createLazyComponent.component(
    () => import('../components/Layout'),
    '应用布局'
  ),
  RoleBasedLayout: createLazyComponent.component(
    () => import('../components/RoleBasedLayout'),
    '角色布局'
  ),
};

export default {
  LazyLogin,
  LazyDashboard,
  LazyRoomList,
  LazyApplicationManagement,
  LazyMyApplications,
  LazyUserList,
  LazyUserProfile,
  LazySettings,
  LazyNotFound,
  LazyActivityManagement,
  LazyApplicationList,
  LazyDevPage,
  LazyTestComponents,
  LazyLayoutComponents,
};
