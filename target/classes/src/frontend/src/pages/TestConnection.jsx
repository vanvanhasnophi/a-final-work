import React, { useState } from 'react';
import { Card, Button, Space, Alert, Divider, Typography, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { testConnection, testLogin, testRoomList, testApplicationList } from '../utils/testConnection';

const { Title, Text } = Typography;

export default function TestConnection() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const runTest = async (testName, testFunction) => {
    setLoading(true);
    try {
      const result = await testFunction();
      setResults(prev => ({
        ...prev,
        [testName]: { success: true, data: result }
      }));
      messageApi.success(`${testName}测试成功`);
    } catch (error) {
      setResults(prev => ({
        ...prev,
        [testName]: { success: false, error: error.message }
      }));
      messageApi.error(`${testName}测试失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setResults({});
    
    messageApi.info('开始运行所有测试...');
    
    await runTest('connection', testConnection);
    await runTest('login', () => testLogin('testuser', 'testpass'));
    await runTest('rooms', testRoomList);
    await runTest('applications', testApplicationList);
    
    messageApi.success('所有测试完成');
    setLoading(false);
  };

  const getStatusIcon = (testName) => {
    const result = results[testName];
    if (!result) return <LoadingOutlined />;
    return result.success ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
  };

  const getStatusText = (testName) => {
    const result = results[testName];
    if (!result) return '未测试';
    return result.success ? '成功' : '失败';
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: '24px' }}>
        <Title level={2}>前后端连接测试</Title>
      
      <Alert
        message="连接测试说明"
        description="此页面用于测试前后端API连接是否正常工作。请确保后端服务已启动在 http://localhost:8080"
        type="info"
        showIcon
        style={{ marginBottom: '24px' }}
      />

      <Card title="测试控制">
        <Space>
          <Button type="primary" onClick={runAllTests} loading={loading}>
            运行所有测试
          </Button>
          <Button onClick={() => setResults({})}>
            清除结果
          </Button>
        </Space>
      </Card>

      <Divider />

      <Card title="测试结果">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              {getStatusIcon('connection')}
              <Text strong>基础连接测试</Text>
            </Space>
            <Text>{getStatusText('connection')}</Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              {getStatusIcon('login')}
              <Text strong>登录功能测试</Text>
            </Space>
            <Text>{getStatusText('login')}</Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              {getStatusIcon('rooms')}
              <Text strong>教室列表测试</Text>
            </Space>
            <Text>{getStatusText('rooms')}</Text>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Space>
              {getStatusIcon('applications')}
              <Text strong>申请列表测试</Text>
            </Space>
            <Text>{getStatusText('applications')}</Text>
          </div>
        </Space>

        {Object.keys(results).length > 0 && (
          <Divider />
        )}

        {Object.entries(results).map(([testName, result]) => (
          <div key={testName} style={{ marginBottom: '16px' }}>
            <Text strong>{testName}:</Text>
            {result.success ? (
              <Alert
                message="测试成功"
                description={JSON.stringify(result.data, null, 2)}
                type="success"
                showIcon={false}
                style={{ marginTop: '8px' }}
              />
            ) : (
              <Alert
                message="测试失败"
                description={result.error}
                type="error"
                showIcon={false}
                style={{ marginTop: '8px' }}
              />
            )}
          </div>
        ))}
      </Card>

      <Divider />

      <Card title="调试信息">
        <Text>当前环境: {process.env.NODE_ENV}</Text>
        <br />
        <Text>API 基础URL: {process.env.NODE_ENV === 'production' ? process.env.REACT_APP_API_URL || 'http://localhost:8080/api' : '/api'}</Text>
        <br />
        <Text>Token: {localStorage.getItem('token') ? '已设置' : '未设置'}</Text>
      </Card>
    </div>
    </>
  );
} 