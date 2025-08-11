import React, { Suspense, useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { Result, Button, Spin } from 'antd';
import { useI18n } from '../contexts/I18nContext';

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
  fallbackTip,
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
    const { t } = useI18n();
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
      <Spin size="large" tip={fallbackTip || t('common.loading')} />
        </div>
      </div>
    );

    const timeoutFallback = (
      <div style={containerStyle}>
        <Result
          status="warning"
          title={t('lazy.timeoutTitle', t('applicationManagement.error.dataFetchTitle'))}
          subTitle={t('lazy.timeoutSubTitle', '加载耗时较长，可重试或稍后再试')}
          extra={[
            <Button key="retry" type="primary" onClick={doRetry}>{t('lazy.retry', t('common.refresh'))}</Button>,
            <Button key="refresh" onClick={() => window.location.reload()}>{t('lazy.refreshPage', '刷新页面')}</Button>
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

const withLazyLoading = (importFunc, fallbackTip, opts) =>
  buildLazy(importFunc, { ...(opts || {}), fallbackTip });

/**
 * 预定义的懒加载组件工厂
 */
export const createLazyComponent = {
  page: (importFunc, pageName) => withLazyLoading(importFunc, undefined, { retries: 2, retryDelay: 1200, timeout: 20000 }),
  component: (importFunc) => withLazyLoading(importFunc, undefined, { retries: 1, retryDelay: 1000, timeout: 12000 }),
  module: (importFunc) => withLazyLoading(importFunc, undefined, { retries: 3, retryDelay: 1500, timeout: 25000 }),
};

export default withLazyLoading;
