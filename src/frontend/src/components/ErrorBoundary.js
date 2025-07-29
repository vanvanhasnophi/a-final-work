import React from 'react';
import { Result, Button } from 'antd';

class ErrorBoundary extends React.Component {
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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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

  render() {
    if (this.state.hasError) {
      const { retryCount } = this.state;
      const { maxRetries = 3 } = this.props;
      
      return (
        <Result
          status="error"
          title="组件加载失败"
          subTitle={
            retryCount < maxRetries 
              ? `这是第 ${retryCount + 1} 次重试，最多重试 ${maxRetries} 次`
              : "已达到最大重试次数"
          }
          extra={[
            retryCount < maxRetries ? (
              <Button type="primary" key="retry" onClick={this.handleRetry}>
                重试
              </Button>
            ) : (
              <Button type="primary" key="reset" onClick={this.handleReset}>
                重置
              </Button>
            ),
            <Button key="refresh" onClick={() => window.location.reload()}>
              刷新页面
            </Button>
          ]}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 