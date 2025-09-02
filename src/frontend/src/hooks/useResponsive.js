// 响应式组件Hooks
// 用于动态判断设备类型和自适应渲染

import { useState, useEffect } from 'react';

// 检测设备类型
export const useDeviceType = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768;
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile,
    isDesktop: !isMobile,
    isTablet: window.innerWidth > 768 && window.innerWidth <= 1024
  };
};

// 响应式样式Hook
export const useResponsiveStyle = () => {
  const { isMobile, isDesktop } = useDeviceType();

  return {
    containerStyle: {
      padding: isMobile ? '8px' : '16px',
      maxWidth: isMobile ? '100%' : '1200px',
      margin: isMobile ? '0' : '0 auto'
    },
    cardStyle: {
      margin: isMobile ? '8px 0' : '16px 0',
      borderRadius: isMobile ? '8px' : '12px'
    },
    tableStyle: {
      scroll: isMobile ? { x: 800 } : undefined,
      size: isMobile ? 'small' : 'middle'
    },
    modalStyle: {
      width: isMobile ? '90%' : 600,
      top: isMobile ? 20 : 100
    }
  };
};

// 响应式渲染Hook
export const useResponsiveRender = () => {
  const { isMobile } = useDeviceType();

  return {
    renderCard: (content, title, extra) => {
      if (isMobile) {
        return (
          <div className="mobile-card">
            <div className="mobile-card-header">
              <h3>{title}</h3>
              {extra}
            </div>
            <div className="mobile-card-body">
              {content}
            </div>
          </div>
        );
      }

      return (
        <Card title={title} extra={extra}>
          {content}
        </Card>
      );
    },

    renderTable: (dataSource, columns, props = {}) => {
      const responsiveColumns = isMobile 
        ? columns.slice(0, 3) // 移动端只显示前3列
        : columns;

      const responsiveProps = {
        ...props,
        size: isMobile ? 'small' : 'middle',
        scroll: isMobile ? { x: 600 } : props.scroll
      };

      return (
        <Table 
          dataSource={dataSource} 
          columns={responsiveColumns}
          {...responsiveProps}
        />
      );
    },

    renderDrawer: (content, title, width, onClose, visible) => {
      return (
        <Drawer
          title={title}
          width={isMobile ? '90%' : width}
          placement="right"
          onClose={onClose}
          visible={visible}
        >
          {content}
        </Drawer>
      );
    }
  };
};
