import React from 'react';
import { Spin, Typography, Card, Button } from 'antd';

const { Text } = Typography;

const LoadingSpinner = ({ 
  loading = true, 
  text = '加载中...', 
  size = 'large',
  tip = null,
  children,
  style = {},
  fullScreen = false,
  onCancel = null,
  showCancelButton = false
}) => {
  if (!loading) {
    return children;
  }

  if (fullScreen) {
    // 全屏模式（保持原有行为）
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: 'var(--background-color)',
        ...style
      }}>
        <Spin size={size} tip={tip || text} />
        {!tip && (
          <Text type="secondary" style={{ marginTop: '16px' }}>
            {text}
          </Text>
        )}
        {showCancelButton && onCancel && (
          <Button 
            type="text" 
            onClick={onCancel}
            style={{ marginTop: '16px', color: 'var(--text-color-secondary)' }}
          >
            取消
          </Button>
        )}
      </div>
    );
  }

  // 非全屏模式 - 覆盖父容器
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      ...style
    }}>
      {children}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(1px)',
        zIndex: 100,
        borderRadius: 'inherit'
      }}>
        <Card 
          style={{
            maxWidth: '300px',
            width: '90%',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            borderRadius: 'var(--border-radius-lg)',
            textAlign: 'center',
            backgroundColor: 'var(--component-bg)',
            border: '1px solid var(--border-color)'
          }}
          bodyStyle={{
            padding: '20px'
          }}
          extra={
            showCancelButton && onCancel ? (
              <Button 
                type="text" 
                onClick={onCancel}
                style={{ fontSize: '12px', color: 'var(--text-color-secondary)' }}
              >
                取消
              </Button>
            ) : null
          }
        >
          <Spin size={size} tip={tip || text} />
          {!tip && (
            <Text type="secondary" style={{ marginTop: '12px', display: 'block' }}>
              {text}
            </Text>
          )}
        </Card>
      </div>
    </div>
  );
};

export default LoadingSpinner; 