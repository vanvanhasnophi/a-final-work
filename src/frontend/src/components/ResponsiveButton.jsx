import React, { createContext, useContext, useState, useEffect } from 'react';
import { Button } from 'antd';

// 创建侧栏折叠状态的上下文
const SidebarContext = createContext({ collapsed: false });

// 提供侧栏状态的Provider
export const SidebarProvider = ({ children, collapsed }) => (
  <SidebarContext.Provider value={{ collapsed }}>
    {children}
  </SidebarContext.Provider>
);

// 响应式按钮组件
const ResponsiveButton = ({ 
  icon, 
  children, 
  hideTextOnCollapse = true,
  useIndependentThreshold = true, // 新增：是否使用独立的阈值判断
  ...props 
}) => {
  const { collapsed: sidebarCollapsed } = useContext(SidebarContext);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // 响应式按钮的独立阈值（比侧栏阈值更小，优先隐藏文字）
  const BUTTON_COLLAPSE_THRESHOLD = 800; // 小于此宽度隐藏按钮文字
  
  useEffect(() => {
    if (!useIndependentThreshold) return;
    
    let resizeTimer;
    let lastResizeTime = 0;
    const THROTTLE_DELAY = 50; // 按钮响应可以更快，50ms节流
    const DEBOUNCE_DELAY = 100;  // 100ms防抖

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
          // 只有当宽度真正发生变化时才更新状态
          if (newWidth !== windowWidth) {
            setWindowWidth(newWidth);
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
  }, [useIndependentThreshold, windowWidth]);
  
  // 决定是否隐藏文字
  const shouldHideText = hideTextOnCollapse && (
    useIndependentThreshold 
      ? windowWidth < BUTTON_COLLAPSE_THRESHOLD  // 使用独立阈值
      : sidebarCollapsed                         // 使用侧栏状态
  );
  
  return (
    <Button
      icon={icon}
      {...props}
    >
      {!shouldHideText && children}
    </Button>
  );
};

export default ResponsiveButton;
