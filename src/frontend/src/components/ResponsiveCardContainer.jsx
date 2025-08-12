import React, { useState, useEffect } from 'react';
import { Row, Col } from 'antd';

const ResponsiveCardContainer = ({ children, gutter = 16, ...props }) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // 固定容忍宽度值：280px
  const CARD_TOLERANCE_WIDTH = 280;
  
  useEffect(() => {
    let resizeTimer;
    let lastResizeTime = 0;
    const THROTTLE_DELAY = 50;
    const DEBOUNCE_DELAY = 100;
    
    const handleResize = () => {
      const now = Date.now();
      
      if (now - lastResizeTime < THROTTLE_DELAY) {
        return;
      }
      
      lastResizeTime = now;
      
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      
      resizeTimer = setTimeout(() => {
        requestAnimationFrame(() => {
          const newWidth = window.innerWidth;
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
  }, [windowWidth]);
  
  // 计算响应式span
  const getResponsiveSpan = (childrenCount) => {
    const containerWidth = windowWidth - 200; // 减去侧边栏宽度
    
    // 基础卡片最小宽度
    const baseCardWidth = 300;
    
    // 计算每行最多能放几个卡片
    let maxCardsPerRow = Math.floor(containerWidth / baseCardWidth);
    
    if (maxCardsPerRow <= 1) {
      return 24; // 一行一个
    }
    
    // 检查当前行数安排下每个卡片的实际宽度
    while (maxCardsPerRow > 1) {
      const spanPerCard = Math.floor(24 / maxCardsPerRow);
      const actualCardWidth = (containerWidth * (spanPerCard / 24)) - gutter;
      
      // 如果所有卡片宽度都小于固定容忍宽度，则显示一半数量的卡片
      if (actualCardWidth < CARD_TOLERANCE_WIDTH) {
        maxCardsPerRow = Math.max(1, Math.floor(maxCardsPerRow / 2));
      } else {
        break;
      }
    }
    
    return Math.floor(24 / maxCardsPerRow);
  };
  
  const span = getResponsiveSpan(React.Children.count(children));
  
  return (
    <Row gutter={gutter} {...props}>
      {React.Children.map(children, (child, index) => (
        <Col 
          key={index}
          span={span}
          xs={24}  // 超小屏幕一行一个
          sm={span > 12 ? 24 : span}  // 小屏幕
          md={span}    // 中屏幕
          lg={span}    // 大屏幕
          xl={span}    // 超大屏幕
          style={{
            marginBottom: gutter,
            transition: 'all 0.3s ease',
            transform: 'translateZ(0)', // 硬件加速
          }}
        >
          {child}
        </Col>
      ))}
    </Row>
  );
};

export default ResponsiveCardContainer;
