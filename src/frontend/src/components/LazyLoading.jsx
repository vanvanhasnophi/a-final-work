import React from 'react';
import { Spin } from 'antd';
import './LazyLoading.css';

/**
 * 懒加载时的Loading组件
 */
/**
 * props:
 *  tip: 提示文字
 *  fillParent: 是否填满父容器 (默认 true)
 *  fullScreen: 是否全屏 (覆盖 fillParent)
 */
const LazyLoading = ({ tip = '页面加载中...', fillParent = true, fullScreen = false }) => {
  const classNames = [
    'lazy-loading-container',
    fillParent && !fullScreen ? 'lazy-loading--fill' : '',
    fullScreen ? 'lazy-loading--fullscreen' : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames}>
      <div className="lazy-loading-content">
        <Spin size="large" tip={tip} />
      </div>
    </div>
  );
};

export default LazyLoading;
