import React from 'react';
import { ConfigProvider, message } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppRouter from './router';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// 配置全局message
message.config({
  top: 80,
  duration: 2.5,
  maxCount: 3,
  zIndex: 99999,
  rtl: false,
  prefixCls: 'ant-message',
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ConfigProvider 
            locale={zhCN}
          >
            <div className="App">
              <AppRouter />
            </div>
          </ConfigProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
