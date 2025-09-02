// 优化的 LazyWrapper 配置
// 针对大型组件进行更精细的代码分割

import React from 'react';
import SkeletonPage from '../components/SkeletonPage';

// 优化的懒加载配置
const OPTIMIZED_LAZY_CONFIG = {
  // 超大组件使用分片加载
  'RoomListM': {
    timeout: 15000,
    retryCount: 3,
    skeletonType: 'dashboard',
    preloadChunks: ['common-utils', 'antd-table']
  },
  'UserListM': {
    timeout: 15000,
    retryCount: 3,
    skeletonType: 'table',
    preloadChunks: ['common-utils', 'antd-table']
  },
  'DutyScheduleM': {
    timeout: 15000,
    retryCount: 3,
    skeletonType: 'dashboard',
    preloadChunks: ['common-utils', 'antd-calendar']
  },
  // 中型组件正常加载
  'ApplicationManagement': {
    timeout: 10000,
    retryCount: 2,
    skeletonType: 'table'
  },
  'MyApplications': {
    timeout: 10000,
    retryCount: 2,
    skeletonType: 'table'
  },
  // 小型组件快速加载
  'Dashboard': {
    timeout: 5000,
    retryCount: 1,
    skeletonType: 'dashboard'
  }
};

// 创建优化的懒加载组件
export const createOptimizedLazyComponent = (importFn, componentName = 'Unknown') => {
  const config = OPTIMIZED_LAZY_CONFIG[componentName] || {
    timeout: 8000,
    retryCount: 2,
    skeletonType: 'default'
  };

  const LazyComponent = React.lazy(() => {
    // 预加载相关chunk
    if (config.preloadChunks) {
      config.preloadChunks.forEach(chunkName => {
        // 这里可以实现chunk预加载逻辑
        console.debug(`Preloading chunk: ${chunkName} for ${componentName}`);
      });
    }

    return Promise.race([
      importFn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`组件 ${componentName} 加载超时`)), config.timeout)
      )
    ]);
  });

  const OptimizedWrapper = (props) => {
    return (
      <React.Suspense 
        fallback={<SkeletonPage type={config.skeletonType} />}
      >
        <LazyComponent {...props} />
      </React.Suspense>
    );
  };

  OptimizedWrapper.displayName = `OptimizedLazy(${componentName})`;
  return OptimizedWrapper;
};
