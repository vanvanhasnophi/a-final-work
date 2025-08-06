import React from 'react';
import FixedTop from './FixedTop';

const FixedTopTest = () => {
  return (
    <div style={{ height: '200vh', padding: '20px' }}>
      <div style={{ height: '100px', backgroundColor: '#f0f0f0', marginBottom: '20px' }}>
        顶部内容
      </div>
      
      <FixedTop>
        <div style={{ 
          backgroundColor: '#1890ff', 
          color: 'white', 
          padding: '10px', 
          textAlign: 'center',
          border: '2px solid #1890ff'
        }}>
          这是吸顶组件 - 滚动时会固定在顶部
        </div>
      </FixedTop>
      
      <div style={{ height: '150vh', backgroundColor: '#e6f7ff', padding: '20px' }}>
        <h2>滚动内容</h2>
        <p>向下滚动页面，观察吸顶组件的行为。</p>
        <p>当滚动超过吸顶组件的位置时，它会固定在页面顶部。</p>
        <p>继续滚动...</p>
        {Array.from({ length: 20 }, (_, i) => (
          <p key={i}>这是第 {i + 1} 段内容，用于测试滚动效果。</p>
        ))}
      </div>
    </div>
  );
};

export default FixedTopTest; 