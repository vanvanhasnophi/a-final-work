import React from 'react';
import { Card, Button, Space, Typography, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  BugOutlined, 
  LoadingOutlined, 
  TagsOutlined, 
  KeyOutlined, 
  ApiOutlined,
  DatabaseOutlined,
  SettingOutlined,
  ExperimentOutlined
} from '@ant-design/icons';

const { Title, Paragraph } = Typography;

export default function DevPage() {
  const navigate = useNavigate();

  // 测试页面配置
  const testPages = [
    {
      title: '连接测试',
      description: '测试前后端连接状态',
      path: '/test',
      icon: <ApiOutlined />,
      color: 'blue',
      category: '连接'
    },
    {
      title: '认证测试',
      description: '测试用户认证和授权功能',
      path: '/auth-test',
      icon: <KeyOutlined />,
      color: 'green',
      category: '认证'
    },
    {
      title: '主题测试',
      description: '测试深色/浅色主题切换',
      path: '/theme-test',
      icon: <SettingOutlined />,
      color: 'purple',
      category: '主题'
    },
    {
      title: '简单测试',
      description: '基础功能测试页面',
      path: '/simple-test',
      icon: <ExperimentOutlined />,
      color: 'orange',
      category: '基础'
    },
    {
      title: 'Token测试',
      description: '测试JWT Token相关功能',
      path: '/token-test',
      icon: <KeyOutlined />,
      color: 'cyan',
      category: '认证'
    },
    {
      title: '重试测试',
      description: '测试错误重试和错误边界',
      path: '/retry-test',
      icon: <BugOutlined />,
      color: 'red',
      category: '错误处理'
    },
    {
      title: '加载测试',
      description: '测试Loading状态和Spinner组件',
      path: '/loading-test',
      icon: <LoadingOutlined />,
      color: 'geekblue',
      category: 'UI组件'
    },
    {
      title: '标签测试',
      description: '测试Tag组件的配色效果',
      path: '/tags-test',
      icon: <TagsOutlined />,
      color: 'magenta',
      category: 'UI组件'
    }
  ];

  // 按类别分组
  const groupedPages = testPages.reduce((acc, page) => {
    if (!acc[page.category]) {
      acc[page.category] = [];
    }
    acc[page.category].push(page);
    return acc;
  }, {});

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title="开发测试页面" style={{ marginBottom: '24px' }}>
        <Paragraph>
          这是一个开发测试页面，提供各种功能测试的入口。每个按钮都有不同的颜色来区分功能类型。
        </Paragraph>
      </Card>

      {Object.entries(groupedPages).map(([category, pages]) => (
        <Card 
          key={category} 
          title={`${category}测试`} 
          style={{ marginBottom: '16px' }}
          size="small"
        >
          <Row gutter={[16, 16]}>
            {pages.map((page) => (
              <Col key={page.path} xs={24} sm={12} md={8} lg={6}>
                <Button
                  type="primary"
                  icon={page.icon}
                  style={{ 
                    width: '100%', 
                    height: '80px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    backgroundColor: `var(--ant-color-${page.color}-6)`,
                    borderColor: `var(--ant-color-${page.color}-6)`,
                    color: 'white'
                  }}
                  onClick={() => handleNavigate(page.path)}
                >
                  <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {page.title}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    {page.description}
                  </div>
                </Button>
              </Col>
            ))}
          </Row>
        </Card>
      ))}

      <Card title="快速导航" style={{ marginTop: '24px' }}>
        <Space wrap>
          <Button 
            type="default" 
            onClick={() => navigate('/dashboard')}
            style={{ borderColor: 'var(--ant-color-blue-6)', color: 'var(--ant-color-blue-6)' }}
          >
            返回仪表板
          </Button>
          <Button 
            type="default" 
            onClick={() => navigate('/rooms')}
            style={{ borderColor: 'var(--ant-color-green-6)', color: 'var(--ant-color-green-6)' }}
          >
            房间管理
          </Button>
          <Button 
            type="default" 
            onClick={() => navigate('/applications')}
            style={{ borderColor: 'var(--ant-color-orange-6)', color: 'var(--ant-color-orange-6)' }}
          >
            申请管理
          </Button>
          <Button 
            type="default" 
            onClick={() => navigate('/profile')}
            style={{ borderColor: 'var(--ant-color-purple-6)', color: 'var(--ant-color-purple-6)' }}
          >
            用户资料
          </Button>
        </Space>
      </Card>
    </div>
  );
} 