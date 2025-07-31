import React, { useState } from 'react';
import { Card, Button, InputNumber, message, Space, Typography, Divider } from 'antd';
import { applicationAPI } from '../api/application';

const { Title, Text } = Typography;

export default function TestConcurrency() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const testConcurrentApply = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/concurrency/test-apply?threadCount=10&roomId=1&userId=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setResults(result);
        message.success(`并发申请测试完成: ${result.toString()}`);
      } else {
        const errorText = await response.text();
        message.error(`测试失败: ${errorText}`);
      }
    } catch (error) {
      console.error('并发测试失败:', error);
      message.error('并发测试失败');
    } finally {
      setLoading(false);
    }
  };

  const testConcurrentApprove = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test/concurrency/test-approve?threadCount=5&applicationId=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        setResults(result);
        message.success(`并发审批测试完成: ${result.toString()}`);
      } else {
        const errorText = await response.text();
        message.error(`测试失败: ${errorText}`);
      }
    } catch (error) {
      console.error('并发测试失败:', error);
      message.error('并发测试失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>并发测试</Title>
      
      <Card title="并发申请测试" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>测试10个线程同时申请同一个房间</Text>
          <Button 
            type="primary" 
            onClick={testConcurrentApply} 
            loading={loading}
          >
            开始并发申请测试
          </Button>
        </Space>
      </Card>

      <Card title="并发审批测试" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>测试5个线程同时审批同一个申请</Text>
          <Button 
            type="primary" 
            onClick={testConcurrentApprove} 
            loading={loading}
          >
            开始并发审批测试
          </Button>
        </Space>
      </Card>

      {results && (
        <Card title="测试结果">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text><strong>总请求数:</strong> {results.totalCount}</Text>
            <Text><strong>成功数:</strong> {results.successCount}</Text>
            <Text><strong>失败数:</strong> {results.failureCount}</Text>
            <Text><strong>成功率:</strong> {(results.successRate * 100).toFixed(2)}%</Text>
            {results.lastException && (
              <Text type="danger">
                <strong>最后异常:</strong> {results.lastException.message}
              </Text>
            )}
          </Space>
        </Card>
      )}

      <Divider />

      <Card title="并发控制说明">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            <strong>房间级锁:</strong> 同一房间的申请和审批操作使用房间级别的锁进行同步
          </Text>
          <Text>
            <strong>事务控制:</strong> 所有关键操作都在事务中执行，确保数据一致性
          </Text>
          <Text>
            <strong>状态检查:</strong> 审批前检查申请状态，防止重复审批
          </Text>
          <Text>
            <strong>时间冲突检查:</strong> 申请时检查时间冲突，确保不会出现重复预约
          </Text>
          <Text>
            <strong>自动驳回:</strong> 批准申请时自动驳回时间冲突的待审批申请
          </Text>
        </Space>
      </Card>
    </div>
  );
} 