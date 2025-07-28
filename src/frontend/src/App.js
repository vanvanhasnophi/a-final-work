import React from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppRouter from './router';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AuthProvider>
        <div className="App">
          <AppRouter />
        </div>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
