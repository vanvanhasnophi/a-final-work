import React, { useState, useEffect } from 'react';

const ResponsiveFilterContainer = ({ 
  children, 
  threshold = 900, // 小于此宽度时收纳到下拉框
  heightThreshold = 600, // 小于此高度时也收纳到下拉框
  style = {},
  onCollapseStateChange, // 折叠状态变化时的回调
  ...props 
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  
  useEffect(() => {
    let resizeTimer;
    let lastResizeTime = 0;
    const THROTTLE_DELAY = 120; // 过滤器响应延迟稍长，120ms节流
    const DEBOUNCE_DELAY = 250;  // 250ms防抖
    
    const handleResize = () => {
      const now = Date.now();
      
      // 节流：如果距离上次执行时间小于延迟，跳过
      if (now - lastResizeTime < THROTTLE_DELAY) {
        return;
      }
      
      lastResizeTime = now;
      
      // 清除之前的防抖计时器
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      
      // 防抖：延迟执行状态更新
      resizeTimer = setTimeout(() => {
        // 使用 requestAnimationFrame 确保在下一个重绘周期执行
        requestAnimationFrame(() => {
          const newWidth = window.innerWidth;
          const newHeight = window.innerHeight;
          // 只有当尺寸真正发生变化时才更新状态
          if (newWidth !== windowWidth || newHeight !== windowHeight) {
            setWindowWidth(newWidth);
            setWindowHeight(newHeight);
          }
        });
      }, DEBOUNCE_DELAY);
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
    };
  }, [windowWidth, windowHeight]);
  
  // 判断是否需要收纳到下拉框（宽度或高度过小都会折叠）
  const shouldCollapse = windowWidth < threshold || windowHeight < heightThreshold;
  
  // 通知父组件折叠状态变化
  useEffect(() => {
    if (onCollapseStateChange) {
      onCollapseStateChange(shouldCollapse);
    }
  }, [shouldCollapse, onCollapseStateChange]);
  
  if (shouldCollapse) {
    // 宽度或高度较小时，返回null（由父组件在右上角显示筛选图标）
    return null;
  }
  
  // 宽度充足时，直接显示过滤条件
  return (
    <div
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};

export default ResponsiveFilterContainer;
