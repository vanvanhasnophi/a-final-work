import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Tooltip, Button } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';

export default function ThemeToggleButton({ style }) {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <Tooltip title={isDarkMode ? '切换为浅色模式' : '切换为深色模式'}>
      <Button
        shape="circle"
        size="large"
        icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
        onClick={toggleTheme}
        style={{
          background: 'var(--component-bg)',
          color: 'var(--primary-color)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow)',
          ...style,
        }}
      />
    </Tooltip>
  );
} 