import React, { Suspense, lazy } from 'react';
import LazyLoading from './LazyLoading';
import ErrorBoundary from './ErrorBoundary';

/**
 * 懒加载包装器
 * @param {Function} importFunc - 动态import函数
 * @param {string} fallbackTip - 加载提示文字
 * @returns {React.Component} 懒加载组件
 */
const withLazyLoading = (importFunc, fallbackTip = '页面加载中...') => {
  // 创建懒加载组件
  const LazyComponent = lazy(importFunc);
  
  // 返回带有Suspense和ErrorBoundary的包装组件
  return (props) => (
    <ErrorBoundary>
      <Suspense fallback={<LazyLoading tip={fallbackTip} />}>
        <LazyComponent {...props} />
      </Suspense>
    </ErrorBoundary>
  );
};

/**
 * 预定义的懒加载组件工厂
 */
export const createLazyComponent = {
  // 页面组件
  page: (importFunc, pageName) => withLazyLoading(importFunc, `${pageName}加载中...`),
  
  // 普通组件
  component: (importFunc, componentName = '组件') => withLazyLoading(importFunc, `${componentName}加载中...`),
  
  // 功能模块
  module: (importFunc, moduleName) => withLazyLoading(importFunc, `${moduleName}模块加载中...`),
};

export default withLazyLoading;
