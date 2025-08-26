import React, { useState, useCallback } from 'react';
import { Button, Card, Space, message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useApiWithRetry } from '../../hooks/useApiWithRetry';
import LoadingSpinner from '../../components/LoadingSpinner';

export default function TestLoading() {
  const [messageApi, contextHolder] = message.useMessage();
  const { loading, error, executeWithRetry } = useApiWithRetry();

  // 模拟API调用
  const simulateApiCall = useCallback(async () => {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 随机成功或失败
    if (Math.random() > 0.3) {
      return { success: true, data: '模拟数据' };
    } else {
      throw new Error('模拟网络错误');
    }
  }, []);

  const handleTestLoading = async () => {
    const result = await executeWithRetry(
      simulateApiCall,
      {
        errorMessage: '模拟API调用失败',
        successMessage: '模拟API调用成功',
        maxRetries: 1,
        retryDelay: 1000
      }
    );
    
    if (result) {
      messageApi.success('操作完成！');
    }
  };

  const handleTestSpinner = () => {
    handleTestLoading();
  };

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      <Card title="Loading状态测试">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <h3>测试说明</h3>
            <p>1. 点击"测试API调用"按钮会模拟一个API请求</p>
            <p>2. 请求过程中刷新按钮会显示loading状态</p>
            <p>3. 请求完成后loading状态会自动消失</p>
            <p>4. 当前loading状态: {loading ? '加载中' : '已完成'}</p>
          </div>

          <Space>
            <Button 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={handleTestLoading}
              loading={loading}
            >
              测试API调用
            </Button>
            <Button onClick={handleTestSpinner}>
              测试Spinner组件
            </Button>
          </Space>

          {error && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#fff2f0', 
              border: '1px solid #ffccc7',
              borderRadius: '6px'
            }}>
              <h4>错误信息:</h4>
              <p>{error.message}</p>
            </div>
          )}

          <LoadingSpinner 
            loading={loading}
            text="正在加载数据..."
            fullScreen={false}
            showCancelButton={true}
            onCancel={() => messageApi.info('用户取消了操作')}
          >
            <div style={{ 
              padding: '16px', 
              border: '1px solid #d9d9d9', 
              borderRadius: '6px',
              backgroundColor: '#fafafa',
              minHeight: '200px'
            }}>
              <h4>内容区域</h4>
              <p>这个区域在loading时会显示覆盖层</p>
              <p>loading完成后覆盖层会自动消失</p>
              <Button>测试按钮</Button>
            </div>
          </LoadingSpinner>
        </Space>
      </Card>
    </div>
  );
} 