import React from 'react';
import { Result, Button, Card } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleGoBack = async () => {
    const { onGoBack } = this.props;
    
    // 如果有回调函数，先执行数据刷新
    if (onGoBack && typeof onGoBack === 'function') {
      try {
        await onGoBack();
      } catch (error) {
        console.error('Error during data refresh:', error);
      }
    }
    
    // 然后返回上一级
    window.history.back();
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(2px)',
          zIndex: 1000,
          borderRadius: 'inherit'
        }}>
          <Card 
            style={{
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              borderRadius: 'var(--border-radius-lg)',
              backgroundColor: 'var(--component-bg)',
              border: '1px solid var(--border-color)'
            }}
            bodyStyle={{
              padding: '24px'
            }}
          >
            <Result
              status="error"
              title="加载失败"
              subTitle="组件加载时发生错误，请尝试以下操作"
              extra={[
                <Button 
                  key="goBack" 
                  onClick={this.handleGoBack}
                  style={{ marginRight: '8px' }}
                >
                  返回上一级
                </Button>,
                <Button 
                  key="refresh" 
                  type="primary" 
                  onClick={this.handleRefresh}
                >
                  刷新页面
                </Button>
              ]}
            />
          </Card>
        </div>
      );
    }

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {this.props.children}
      </div>
    );
  }
}

export default ErrorBoundary; 