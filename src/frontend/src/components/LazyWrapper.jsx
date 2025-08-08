import React, { Suspense, useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Result, Button, Spin } from 'antd';

/**
 * 懒加载包装器
 * @param {Function} importFunc - 动态import函数
 * @param {string} fallbackTip - 加载提示文字
 * @returns {React.Component} 懒加载组件
 */
// 内联重试 + 懒加载封装（合并 lazyRetry / LazyLoading 功能）
function buildLazy(importFunc, options) {
  const {
    retries = 2,
    retryDelay = 1000,
    timeout = 15000,
    fallbackTip = '页面加载中...',
    fullScreen = false,
    minSpinnerTime = 400, // 防抖，避免闪烁
  } = options || {};

  // 包装 import，支持重试
  const lazyFactory = () => {
    let attempt = 0;
    const load = () => importFunc().catch(err => {
      attempt += 1;
      const retriable = /Loading chunk|ChunkLoadError|Network|Failed to fetch|timeout/i.test(err?.message || '');
      if (retriable && attempt <= retries) {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            load().then(resolve).catch(reject);
          }, typeof retryDelay === 'function' ? retryDelay(attempt) : retryDelay * attempt);
        });
      }
      throw err;
    });
    return load();
  };

  const LazyComponent = React.lazy(lazyFactory);

  return (props) => {
    const [timedOut, setTimedOut] = useState(false);
    const [startTs] = useState(() => Date.now());
    const [retryKey, setRetryKey] = useState(0);

    // 超时监控
    useEffect(() => {
      if (!timeout) return;
      const id = setTimeout(() => setTimedOut(true), timeout);
      return () => clearTimeout(id);
    }, [timeout, retryKey]);

    const doRetry = () => {
      setTimedOut(false);
      setRetryKey(k => k + 1);
    };

    const containerStyle = fullScreen ? {
      position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-color-container, #fff)'
    } : {
      width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center'
    };

    const spinner = (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center' }}>
          <Spin size="large" tip={fallbackTip} />
        </div>
      </div>
    );

    const timeoutFallback = (
      <div style={containerStyle}>
        <Result
          status="warning"
          title="加载超时"
          subTitle="资源加载耗时较长，可重试或稍后再试"
          extra={[
            <Button key="retry" type="primary" onClick={doRetry}>重试</Button>,
            <Button key="refresh" onClick={() => window.location.reload()}>刷新页面</Button>
          ]}
        />
      </div>
    );

    // 防抖显示：保障最少显示时间，避免一闪而过（可扩展）
    const [showSpinner, setShowSpinner] = useState(true);
    useEffect(() => {
      const left = minSpinnerTime - (Date.now() - startTs);
      if (left > 0) {
        const id = setTimeout(() => setShowSpinner(false), left);
        return () => clearTimeout(id);
      } else {
        setShowSpinner(false);
      }
    }, [startTs, retryKey, minSpinnerTime]);

    const fallback = timedOut ? timeoutFallback : spinner;

    return (
      <ErrorBoundary onRetry={doRetry}>
        <Suspense fallback={fallback}>
          {/* 利用 key 强制重载 */}
          <LazyComponent key={retryKey} {...props} />
        </Suspense>
      </ErrorBoundary>
    );
  };
}

const withLazyLoading = (importFunc, fallbackTip = '页面加载中...', opts) =>
  buildLazy(importFunc, { ...(opts || {}), fallbackTip });

/**
 * 预定义的懒加载组件工厂
 */
export const createLazyComponent = {
  page: (importFunc, pageName) => withLazyLoading(importFunc, `${pageName}加载中...`, { retries: 2, retryDelay: 1200, timeout: 20000 }),
  component: (importFunc, componentName = '组件') => withLazyLoading(importFunc, `${componentName}加载中...`, { retries: 1, retryDelay: 1000, timeout: 12000 }),
  module: (importFunc, moduleName) => withLazyLoading(importFunc, `${moduleName}模块加载中...`, { retries: 3, retryDelay: 1500, timeout: 25000 }),
};

export default withLazyLoading;
