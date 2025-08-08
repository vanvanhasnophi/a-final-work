import React from 'react';
import { Spin } from 'antd';
import './LazyLoading.css';

/**
 * 懒加载时的Loading组件
 */
const LazyLoading = ({ tip = '页面加载中...' }) => {
  return (
    <div className="lazy-loading-container">
      <div className="lazy-loading-content">
        <Spin size="large" tip={tip} /> 
      </div>
    </div>
  );
};

export default LazyLoading;
