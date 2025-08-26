import React, { useState } from 'react';
import { Button, Card, Typography, message } from 'antd';
import authAPI from '../../api/auth';

const { Title, Text } = Typography;

export default function TokenTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testLogin = async () => {
    setLoading(true);
    try {
      console.log('开始测试登录...');
      const response = await authAPI.login('testuser3', 'test123');
      console.log('登录响应:', response);
      console.log('响应数据:', response.data);
      
      setResult({
        success: true,
        data: response.data,
        token: response.data.token,
        user: response.data
      });
      
      message.success('登录成功！');
    } catch (error) {
      console.error('登录失败:', error);
      setResult({
        success: false,
        error: error.response?.data || error.message
      });
      message.error('登录失败！');
    } finally {
      setLoading(false);
    }
  };

  const checkLocalStorage = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('localStorage检查:', { token, user });
    setResult({
      success: true,
      localStorage: { token, user }
    });
  };

  const clearLocalStorage = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setResult(null);
    message.success('已清除localStorage');
  };

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>Token测试页面</Title>
      
      <div style={{ marginBottom: '20px' }}>
        <Button onClick={testLogin} loading={loading} style={{ marginRight: '10px' }}>
          测试登录
        </Button>
        <Button onClick={checkLocalStorage} style={{ marginRight: '10px' }}>
          检查localStorage
        </Button>
        <Button onClick={clearLocalStorage}>
          清除localStorage
        </Button>
      </div>

      {result && (
        <Card title="测试结果" style={{ marginTop: '20px' }}>
          <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
} 