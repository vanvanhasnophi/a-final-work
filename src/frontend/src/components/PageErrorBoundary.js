import React from 'react';
import { Result, Button, Card } from 'antd';

class PageErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 记录错误信息
    console.error('PageErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    const { maxRetries = 3 } = this.props;
    
    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // 超过最大重试次数，显示最终错误
      this.setState({
        hasError: true,
        error: new Error('组件加载失败，请刷新页面重试'),
        retryCount: 0
      });
    }
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    });
  };

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
          backgroundColor: 'rgba(255, 255, 255, 0)',
          backdropFilter: 'blur(3px)',
          zIndex: 1000,
          borderRadius: 'inherit'
        }}>
          <Card 
            style={{
              maxWidth: '400px',
              width: '90%',
              boxShadow: 'var(--shadow)',
              borderRadius: 'var(--border-radius-lg)'
            }}
            bodyStyle={{
              padding: '24px'
            }}
            extra={
              <Button 
                type="text" 
                onClick={this.handleGoBack}
                style={{ fontSize: '12px', color: 'var(--text-color-secondary)' }}
              >
                返回上一级
              </Button>
            }
          >
            <Result
              status="error"
              title="加载失败"
              extra={[
                <Button type="primary" key="retry" onClick={this.handleRetry}>
                  重试
                </Button>,
                <Button key="refresh" onClick={() => window.location.reload()}>
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

export default PageErrorBoundary; 