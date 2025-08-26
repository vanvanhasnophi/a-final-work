/**
 * 路由预加载工具
 * 用于在用户可能访问某个页面之前预先加载组件
 */

// 预加载映射表
const preloadMap = new Map();

/**
 * 预加载指定的懒加载组件
 * @param {Function} importFunc - 动态import函数
 * @param {string} key - 预加载的唯一标识
 * @returns {Promise} - 预加载Promise
 */
export const preloadComponent = async (importFunc, key) => {
  // 避免重复预加载
  if (preloadMap.has(key)) {
    return preloadMap.get(key);
  }

  try {
    console.log(`[Preload] 开始预加载组件: ${key}`);
    const startTime = Date.now();
    
    const loadPromise = importFunc();
    preloadMap.set(key, loadPromise);
    
    await loadPromise;
    
    const loadTime = Date.now() - startTime;
    console.log(`[Preload] 组件预加载完成: ${key}, 耗时: ${loadTime}ms`);
    
    return loadPromise;
  } catch (error) {
    console.error(`[Preload] 组件预加载失败: ${key}`, error);
    preloadMap.delete(key); // 清除失败的缓存
    throw error;
  }
};

/**
 * 预加载多个组件
 * @param {Array} components - 组件配置数组 [{importFunc, key}]
 * @returns {Promise} - 所有预加载Promise
 */
export const preloadComponents = async (components) => {
  const promises = components.map(({ importFunc, key }) => 
    preloadComponent(importFunc, key)
  );
  
  try {
    await Promise.all(promises);
    console.log(`[Preload] 批量预加载完成，共 ${components.length} 个组件`);
  } catch (error) {
    console.error('[Preload] 批量预加载失败', error);
  }
};

/**
 * 智能预加载策略
 * 根据用户行为和权限预加载相关页面
 */
export const preloadStrategies = {
  // 用户登录后预加载核心页面
  afterLogin: (userRole) => {
    const coreComponents = [
      { importFunc: () => import('../pages/Dashboard'), key: 'Dashboard' },
      { importFunc: () => import('../pages/MyApplications'), key: 'MyApplications' },
      { importFunc: () => import('../pages/UserProfile'), key: 'UserProfile' },
    ];

    // 根据角色预加载不同页面
    if (userRole === 'ADMIN' || userRole === 'APPROVER') {
      coreComponents.push(
        { importFunc: () => import('../pages/ApplicationManagement'), key: 'ApplicationManagement' },
        { importFunc: () => import('../pages/RoomList'), key: 'RoomList' }
      );
    }

    if (userRole === 'ADMIN') {
      coreComponents.push(
        { importFunc: () => import('../pages/UserList'), key: 'UserList' }
      );
    }

    // 延迟2秒后开始预加载，避免影响登录体验
    setTimeout(() => {
      preloadComponents(coreComponents);
    }, 2000);
  },

  // 鼠标悬停导航菜单时预加载
  onNavigationHover: (pageName) => {
    const hoverPreloadMap = {
      'rooms': () => import('../pages/RoomList'),
      'application-management': () => import('../pages/ApplicationManagement'),
      'my-applications': () => import('../pages/MyApplications'),
      'profile': () => import('../pages/UserProfile'),
      'user-management': () => import('../pages/UserList'),
    };

    const importFunc = hoverPreloadMap[pageName];
    if (importFunc) {
      // 延迟300ms，避免误触
      setTimeout(() => {
        preloadComponent(importFunc, pageName);
      }, 300);
    }
  },

  // 空闲时间预加载
  onIdle: () => {
    // 使用requestIdleCallback在浏览器空闲时预加载
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        preloadComponents([
          { importFunc: () => import('../pages/NotFound'), key: 'NotFound' },
          { importFunc: () => import('../components/layout/Layout'), key: 'Layout' },
        ]);
      });
    }
  },
};

/**
 * 预加载状态管理
 */
export const preloadStatus = {
  // 获取预加载状态
  getStatus: (key) => {
    return preloadMap.has(key) ? 'loaded' : 'pending';
  },

  // 获取所有已预加载的组件
  getAllLoaded: () => {
    return Array.from(preloadMap.keys());
  },

  // 清除预加载缓存
  clear: () => {
    preloadMap.clear();
    console.log('[Preload] 预加载缓存已清除');
  },

  // 获取预加载统计
  getStats: () => {
    return {
      totalPreloaded: preloadMap.size,
      preloadedKeys: Array.from(preloadMap.keys()),
    };
  },
};


