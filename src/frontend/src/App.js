import React, { createContext } from 'react';
import { ConfigProvider, message, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppRouter from './router';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import ErrorBoundary from './components/ErrorBoundary';
import LazyLoadMonitor from './components/LazyLoadMonitor';
import useRoutePreload from './hooks/useRoutePreload';
import './App.css';

// 配置全局message
message.config({
  top: 50,
  duration: 2.5,
  maxCount: 3,
  zIndex: 99999,
  rtl: false,
  prefixCls: 'ant-message',
});

// 新增：创建全局MessageContext
export const MessageContext = createContext(null);

// 内部组件，用于应用主题
function AppContent() {
  const { isDarkMode } = useTheme();
  const [messageApi, contextHolder] = message.useMessage();
  
  // 启用路由预加载
  useRoutePreload();
  
  const themeConfig = {
    token: {
      colorPrimary: isDarkMode ? '#990CAE' : '#660874',
      colorBgContainer: isDarkMode ? '#2B2D31' : '#FFFFFF',
      colorBgLayout: isDarkMode ? '#1E1F22' : '#F2F2F2',
      colorText: isDarkMode ? '#FFFFFF' : '#000000',
      colorTextSecondary: isDarkMode ? '#CCCCCC' : '#666666',
      colorBorder: isDarkMode ? '#3C3F45' : '#E5E5E5',
      borderRadius: 8,
      // 使用Ant Design官方建议的Tag颜色
      colorSuccess: isDarkMode ? '#52C41A' : '#52C41A',
      colorError: isDarkMode ? '#FF4D4F' : '#FF4D4F',
      colorWarning: isDarkMode ? '#FAAD14' : '#FAAD14',
      colorInfo: isDarkMode ? '#1890FF' : '#1890FF',
      colorProcessing: isDarkMode ? '#722ED1' : '#722ED1',
    },
    algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
  };
  
  return (
    <ConfigProvider 
      locale={zhCN}
      theme={themeConfig}
    >
      <MessageContext.Provider value={messageApi}>
        {contextHolder}
        <div className="App">
          <AppRouter />
          {/* 懒加载性能监控 - 仅开发环境 */}
          <LazyLoadMonitor />
        </div>
      </MessageContext.Provider>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
