import React, { useState } from 'react';
import { Button, Card, Row, Col, Typography, message } from 'antd';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorBoundary from '../../components/ErrorBoundary';

const { Title, Text } = Typography;

// 模拟会出错的组件
const BuggyComponent = ({ shouldError = false }) => {
  if (shouldError) {
    throw new Error('这是一个模拟的错误');
  }
  
  return (
    <Card title="正常组件">
      <Text>这是一个正常的组件，不会出错。</Text>
    </Card>
  );
};

export default function TestRetry() {
  const [loading, setLoading] = useState(false);
  const [shouldError, setShouldError] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();

  const simulateLoading = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 3000);
  };

  const simulateError = () => {
    setShouldError(true);
  };

  const resetError = () => {
    setShouldError(false);
  };

  const handleCancelLoading = () => {
    setLoading(false);
    messageApi.success('已取消加载');
  };

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}
      <Title level={2}>重试组件测试页面</Title>
      
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={12}>
          <Card title="控制面板">
            <Button 
              type="primary" 
              onClick={simulateLoading}
              style={{ marginRight: '8px' }}
            >
              模拟加载
            </Button>
            <Button 
              onClick={simulateError}
              style={{ marginRight: '8px' }}
            >
              模拟错误
            </Button>
            <Button onClick={resetError}>
              重置错误
            </Button>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="说明">
            <Text>
              1. 点击"模拟加载"按钮测试LoadingSpinner组件<br/>
              2. 点击"模拟错误"按钮测试ErrorBoundary组件<br/>
              3. 重试界面应该只覆盖正在加载的区域，而不是全屏<br/>
              4. 新增了"返回上一级"和"取消"按钮功能
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="LoadingSpinner 测试（带取消按钮）">
            <LoadingSpinner 
              loading={loading} 
              text="正在加载数据..." 
              showCancelButton={true}
              onCancel={handleCancelLoading}
            >
              <div style={{ minHeight: '200px', padding: '16px' }}>
                <Text>这是需要加载的内容区域</Text>
                <br />
                <Text>当加载时，LoadingSpinner会覆盖这个区域</Text>
                <br />
                <Text>其他区域仍然可以点击</Text>
                <br />
                <Text>可以点击"取消"按钮停止加载</Text>
              </div>
            </LoadingSpinner>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="ErrorBoundary 测试（带返回按钮）">
            <ErrorBoundary maxRetries={2}>
              <div style={{ minHeight: '200px', padding: '16px' }}>
                <BuggyComponent shouldError={shouldError} />
              </div>
            </ErrorBoundary>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: '24px' }}>
        <Col span={24}>
          <Card title="其他可点击区域">
            <Text>
              这个区域应该始终可以点击，即使上面的组件在加载或出错时。
              这证明了重试组件只覆盖了特定的区域，而不是全屏。
            </Text>
            <br />
            <Button type="primary" style={{ marginTop: '8px', marginRight: '8px' }}>
              这个按钮应该始终可点击
            </Button>
            <Button 
              onClick={() => messageApi.info('这个按钮可以正常点击')}
              style={{ marginTop: '8px' }}
            >
              测试按钮
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
} 