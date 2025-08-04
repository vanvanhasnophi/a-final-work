import React from 'react';
import { Card, Button, Space, Typography, Divider, Row, Col, Tag, Statistic } from 'antd';
import { 
  BulbOutlined, 
  BulbFilled, 
  HomeOutlined, 
  FileTextOutlined,
  DashboardOutlined 
} from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';

const { Title, Text, Paragraph } = Typography;

export default function ThemeTest() {
  const { isDarkMode, toggleTheme, setTheme } = useTheme();

  const colorPalette = [
    { name: '主色调 (浅色)', color: '#660874', mode: 'light' },
    { name: '主色调 (深色)', color: '#990CAE', mode: 'dark' },
    { name: '背景色 (浅色)', color: '#F2F2F2', mode: 'light' },
    { name: '背景色 (深色)', color: '#1E1F22', mode: 'dark' },
    { name: '组件背景 (浅色)', color: '#FFFFFF', mode: 'light' },
    { name: '组件背景 (深色)', color: '#2B2D31', mode: 'dark' },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2} style={{ color: 'var(--primary-color)' }}>
        主题配色方案测试
      </Title>
      
      <Card title="主题控制" style={{ marginBottom: '24px' }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>当前主题: </Text>
            <Tag color={isDarkMode ? 'purple' : 'blue'}>
              {isDarkMode ? '深色模式' : '浅色模式'}
            </Tag>
          </div>
          
          <Space>
            <Button 
              type="primary" 
              icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
              onClick={toggleTheme}
            >
              切换主题
            </Button>
            
            <Button onClick={() => setTheme(false)}>
              强制浅色模式
            </Button>
            
            <Button onClick={() => setTheme(true)}>
              强制深色模式
            </Button>
          </Space>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="总教室数"
              value={112}
              prefix={<HomeOutlined />}
              valueStyle={{ color: 'var(--primary-color)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="可用教室"
              value={89}
              prefix={<DashboardOutlined />}
              valueStyle={{ color: 'var(--primary-color)' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card>
            <Statistic
              title="待处理申请"
              value={23}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: 'var(--primary-color)' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="配色方案展示" style={{ marginBottom: '24px' }}>
        <Row gutter={[16, 16]}>
          {colorPalette.map((item, index) => (
            <Col xs={24} sm={12} md={8} key={index}>
              <Card 
                size="small" 
                style={{ 
                  border: `2px solid ${item.color}`,
                  background: item.color,
                  color: item.mode === 'dark' ? '#fff' : '#000',
                }}
              >
                <Text strong style={{ color: item.mode === 'dark' ? '#fff' : '#000' }}>
                  {item.name}
                </Text>
                <br />
                <Text style={{ color: item.mode === 'dark' ? '#fff' : '#000' }}>
                  {item.color}
                </Text>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      <Card title="组件样式测试">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>按钮样式:</Text>
            <Space style={{ marginLeft: '16px' }}>
              <Button type="primary">主要按钮</Button>
              <Button>默认按钮</Button>
              <Button type="dashed">虚线按钮</Button>
              <Button type="text">文本按钮</Button>
            </Space>
          </div>
          
          <Divider />
          
          <div>
            <Text strong>标签样式:</Text>
            <Space style={{ marginLeft: '16px' }}>
              <Tag color="purple">紫色标签</Tag>
              <Tag color="blue">蓝色标签</Tag>
              <Tag color="green">绿色标签</Tag>
              <Tag color="red">红色标签</Tag>
            </Space>
          </div>
          
          <Divider />
          
          <div>
            <Text strong>文本样式:</Text>
            <div style={{ marginLeft: '16px', marginTop: '8px' }}>
              <Paragraph>
                这是普通文本，颜色为 <Text code>var(--text-color)</Text>
              </Paragraph>
              <Paragraph type="secondary">
                这是次要文本，颜色为 <Text code>var(--text-color-secondary)</Text>
              </Paragraph>
              <Paragraph style={{ color: 'var(--primary-color)' }}>
                这是强调文本，颜色为 <Text code>var(--primary-color)</Text>
              </Paragraph>
            </div>
          </div>
          
          <Divider />
          
          <div>
            <Text strong>背景色测试:</Text>
            <div style={{ 
              marginLeft: '16px', 
              marginTop: '8px',
              padding: '16px',
              background: 'var(--component-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
            }}>
              <Text>这是组件背景色: <Text code>var(--component-bg)</Text></Text>
              <br />
              <Text>这是边框颜色: <Text code>var(--border-color)</Text></Text>
            </div>
          </div>
        </Space>
      </Card>

      <Card title="CSS变量信息" style={{ marginTop: '24px' }}>
        <pre style={{ 
          background: 'var(--component-bg)', 
          padding: '16px', 
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          color: 'var(--text-color)',
          fontSize: '12px',
          overflow: 'auto',
        }}>
          {JSON.stringify({
            '--primary-color': getComputedStyle(document.documentElement).getPropertyValue('--primary-color'),
            '--background-color': getComputedStyle(document.documentElement).getPropertyValue('--background-color'),
            '--component-bg': getComputedStyle(document.documentElement).getPropertyValue('--component-bg'),
            '--text-color': getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
            '--text-color-secondary': getComputedStyle(document.documentElement).getPropertyValue('--text-color-secondary'),
            '--border-color': getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
            '--shadow': getComputedStyle(document.documentElement).getPropertyValue('--shadow'),
            'current-theme': isDarkMode ? 'dark' : 'light',
          }, null, 2)}
        </pre>
      </Card>
    </div>
  );
} 