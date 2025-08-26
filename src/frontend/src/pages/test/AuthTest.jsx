import React, { useState } from 'react';
import { Card, Button, Space, Alert, Typography, Divider } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

export default function AuthTest() {
  const { user, token, isAuthenticated, login, register, logout } = useAuth();
  const [testResults, setTestResults] = useState({});

  const runLoginTest = async () => {
    setTestResults(prev => ({ ...prev, login: '测试中...' }));
    try {
      const result = await login('testuser', 'testpass');
      setTestResults(prev => ({ 
        ...prev, 
        login: result.success ? '成功' : `失败: ${result.error}` 
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        login: `失败: ${error.message}` 
      }));
    }
  };

  const runRegisterTest = async () => {
    setTestResults(prev => ({ ...prev, register: '测试中...' }));
    try {
      const result = await register({
        username: 'testuser2',
        password: 'testpass123',
        email: 'test@example.com',
        phone: '13800138000',
        nickname: '测试用户'
      });
      setTestResults(prev => ({ 
        ...prev, 
        register: result.success ? '成功' : `失败: ${result.error}` 
      }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        register: `失败: ${error.message}` 
      }));
    }
  };

  const runLogoutTest = async () => {
    setTestResults(prev => ({ ...prev, logout: '测试中...' }));
    try {
      await logout();
      setTestResults(prev => ({ ...prev, logout: '成功' }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        logout: `失败: ${error.message}` 
      }));
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>认证功能测试</Title>
      
      <Alert
        message="认证状态"
        description={
          <div>
            <p>登录状态: {isAuthenticated() ? '已登录' : '未登录'}</p>
            <p>Token: {token ? '已设置' : '未设置'}</p>
            <p>用户信息: {user ? JSON.stringify(user, null, 2) : '无'}</p>
          </div>
        }
        type={isAuthenticated() ? 'success' : 'warning'}
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="认证功能测试">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>登录测试:</Text>
            <Button onClick={runLoginTest} style={{ marginLeft: '16px' }}>
              测试登录
            </Button>
            <Text style={{ marginLeft: '16px' }}>
              结果: {testResults.login || '未测试'}
            </Text>
          </div>

          <div>
            <Text strong>注册测试:</Text>
            <Button onClick={runRegisterTest} style={{ marginLeft: '16px' }}>
              测试注册
            </Button>
            <Text style={{ marginLeft: '16px' }}>
              结果: {testResults.register || '未测试'}
            </Text>
          </div>

          <div>
            <Text strong>登出测试:</Text>
            <Button onClick={runLogoutTest} style={{ marginLeft: '16px' }}>
              测试登出
            </Button>
            <Text style={{ marginLeft: '16px' }}>
              结果: {testResults.logout || '未测试'}
            </Text>
          </div>
        </Space>
      </Card>

      <Divider />

      <Card title="调试信息">
        <pre style={{ background: '#f5f5f5', padding: '16px', borderRadius: '4px' }}>
          {JSON.stringify({
            isAuthenticated: isAuthenticated(),
            hasToken: !!token,
            hasUser: !!user,
            userInfo: user,
            localStorage: {
              token: localStorage.getItem('token') ? '已设置' : '未设置',
              user: localStorage.getItem('user') ? '已设置' : '未设置'
            }
          }, null, 2)}
        </pre>
      </Card>
    </div>
  );
} 