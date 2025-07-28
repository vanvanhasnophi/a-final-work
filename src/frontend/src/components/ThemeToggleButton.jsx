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
          background: isDarkMode ? '#232428' : '#fff',
          color: isDarkMode ? '#FFD700' : '#8C3CBF',
          border: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          ...style,
        }}
      />
    </Tooltip>
  );
} 