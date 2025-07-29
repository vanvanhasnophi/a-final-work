import React from 'react';
import { Spin, Typography } from 'antd';

const { Text } = Typography;

const LoadingSpinner = ({ 
  loading = true, 
  text = '加载中...', 
  size = 'large',
  tip = null,
  children,
  style = {}
}) => {
  if (!loading) {
    return children;
  }

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '200px',
      ...style
    }}>
      <Spin size={size} tip={tip || text} />
      {!tip && (
        <Text type="secondary" style={{ marginTop: '16px' }}>
          {text}
        </Text>
      )}
    </div>
  );
};

export default LoadingSpinner; 