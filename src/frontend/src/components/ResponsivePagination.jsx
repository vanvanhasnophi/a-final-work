import React, { useState, useEffect } from 'react';
import { Pagination } from 'antd';
import { useI18n } from '../contexts/I18nContext';

const ResponsivePagination = ({ 
  showTotalThreshold = 250, // 小于此宽度时不显示总数
  simpleThreshold = 300, // 小于此宽度时为simple模式
  totalCapThreshold = 600, // 小于此宽度时总数显示为简洁版
  lessThreshold = 800, // 小于此宽度时showLessItems
  pageSizeOptions = ['10', '20', '50', '100'], // 每页条数选项
  showSizeChanger = false,
  showQuickJumper = false,
  style = { background: 'transparent', display: 'flex', flexWrap: 'nowrap', flex: '1 1 auto'},
  onResize,
  ...props
}) => {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);
  const { t } = useI18n();

  useEffect(() => {
    let resizeTimer;
    let lastResizeTime = 0;
    const THROTTLE_DELAY = 80; // 过滤器响应延迟稍长，80ms节流
    const DEBOUNCE_DELAY = 150;  // 150ms防抖

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
  
  
  // 通知父组件折叠状态变化
  useEffect(() => {
    if (onResize) {
      onResize();
    }
  }, [onResize]);


  function totalText(width) {
    if(width < showTotalThreshold){
      return false;
    }
    else {
      return width < totalCapThreshold ? (total) => t('pagination.totalSimple', '{total} 条').replace('{total}', total) :  (total, range) => t('pagination.total', `第 ${range[0]}-${range[1]} 条/共 ${total} 条`).replace('{from}', range[0]).replace('{to}', range[1]).replace('{total}', total);
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
    <Pagination
              {...props}
              size='default'
              responsive
              simple={window.innerWidth < simpleThreshold}
              showLessItems={window.innerWidth < lessThreshold}
              style={style}
              showTotal={totalText(window.innerWidth)}
              pageSizeOptions={pageSizeOptions}
              showSizeChanger={showSizeChanger}
              showQuickJumper={showQuickJumper}
            />
            </div>
  );
};

export default ResponsivePagination;
