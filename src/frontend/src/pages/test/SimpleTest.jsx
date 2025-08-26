import React from 'react';
import { Card, Button, Typography, Space } from 'antd';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const { Title, Text } = Typography;

export default function SimpleTest() {
  const { isAuthenticated, loading } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <div style={{ 
      padding: '24px',
      minHeight: '100vh',
      background: 'var(--background-color)',
      color: 'var(--text-color)',
    }}>
      <Card style={{ 
        maxWidth: '600px', 
        margin: '0 auto',
        background: 'var(--component-bg)',
        border: '1px solid var(--border-color)',
      }}>
        <Title level={2} style={{ color: 'var(--primary-color)' }}>
          简单测试页面
        </Title>
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>认证状态: </Text>
            <Text>{loading ? '加载中...' : (isAuthenticated() ? '已登录' : '未登录')}</Text>
          </div>
          
          <div>
            <Text strong>主题模式: </Text>
            <Text>{isDarkMode ? '深色模式' : '浅色模式'}</Text>
          </div>
          
          <Button 
            type="primary" 
            onClick={toggleTheme}
            style={{ background: 'var(--primary-color)' }}
          >
            切换主题
          </Button>
          
          <Button onClick={() => window.location.href = '/login'}>
            前往登录页面
          </Button>
          
          <Button onClick={() => window.location.href = '/theme-test'}>
            前往主题测试页面
          </Button>
        </Space>
      </Card>
    </div>
  );
} 