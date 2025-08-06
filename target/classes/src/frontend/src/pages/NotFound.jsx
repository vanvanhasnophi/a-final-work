import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Result
        status="404"
        title="404"
        subTitle="哦豁，RoomX走丢了"
        extra={[
          <Button type="primary" key="dashboard" onClick={() => navigate('/dashboard')}>
            返回首页
          </Button>,
          <Button key="back" onClick={() => navigate(-1)}>
            返回上页
          </Button>,
        ]}
      />
    </div>
  );
} 