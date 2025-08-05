import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggleButton from '../components/ThemeToggleButton';

const { Title, Text } = Typography;

export default function Login() {
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [kickoutMessage, setKickoutMessage] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();
  const { isDarkMode } = useTheme();

  const from = '/dashboard';

  // 检查URL参数中是否有错误信息
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const kickout = urlParams.get('kickout');
    const expired = urlParams.get('expired');
    const unauthorized = urlParams.get('unauthorized');
    
    if (kickout === 'true') {
      setKickoutMessage('您的账号在其他地方登录，当前会话已失效');
    } else if (expired === 'true') {
      setKickoutMessage('登录已过期，请重新登录');
    } else if (unauthorized === 'true') {
      setKickoutMessage('登录状态异常，请重新登录');
    }
    
    // 如果有任何错误参数，清除URL参数
    if (kickout === 'true' || expired === 'true' || unauthorized === 'true') {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [location]);

  // 处理输入框变化，清除挤下线提示
  const handleInputChange = () => {
    if (kickoutMessage) {
      setKickoutMessage('');
      // 同时清除URL参数
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  };

  const onLoginFinish = async (values) => {
    setLoading(true);
    // 清除挤下线提示和URL参数
    setKickoutMessage('');
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    
    console.log('开始登录:', values);
    try {
      const result = await login(values.username, values.password);
      console.log('登录结果:', result);
      if (result.success) {
        // 检查token是否正确设置
        const storedToken = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        console.log('存储的token:', storedToken);
        console.log('存储的user:', storedUser);
        
        messageApi.open({
          type: 'success',
          content: '登录成功！正在跳转...',
          duration: 1.5,
        });
        
        // 延迟导航，确保状态更新完成
        setTimeout(() => {
          console.log('准备跳转到:', from);
          console.log('最终localStorage检查:', {
            token: localStorage.getItem('token'),
            user: localStorage.getItem('user')
          });
          console.log('isAuthenticated检查:', isAuthenticated());
          navigate(from, { replace: true });
        }, 1500);
      } else {
        messageApi.open({
          type: 'error',
          content: result.error || '用户名或密码错误，请重试',
          duration: 1.5,
        });
      }
    } catch (error) {
      console.error('登录错误:', error);
      messageApi.open({
        type: 'error',
        content: '网络连接失败，请检查网络后重试',
        duration: 1.5,
      });
    } finally {
      setLoading(false);
    }
  };

  const onRegisterFinish = async (values) => {
    setLoading(true);
    // 清除挤下线提示和URL参数
    setKickoutMessage('');
    const newUrl = window.location.pathname;
    window.history.replaceState({}, '', newUrl);
    
    console.log('开始注册:', values);
    try {
      const result = await register(values);
      console.log('注册结果:', result);
      if (result.success) {
        messageApi.open({
          type: 'success',
          content: '注册成功！请使用新账号登录',
          duration: 1.5,
        });
        // 延迟切换到登录模式，让用户看到成功消息
        setTimeout(() => {
          setIsLoginMode(true);
        }, 2000);
      } else {
        messageApi.open({
          type: 'error',
          content: result.error || '注册失败，请检查输入信息',
          duration: 1.5,
        });
      }
    } catch (error) {
      console.error('注册错误:', error);
      messageApi.open({
        type: 'error',
        content: '网络连接失败，请检查网络后重试',
        duration: 1.5,
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    background: 'var(--component-bg)',
    color: 'var(--text-color)',
    fontSize: '14px',
  };

  const iconStyle = {
    color: isDarkMode ? '#990CAE' : '#660874',
  };

  // 添加CSS样式来优化深色模式下的输入框效果
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .ant-input, .ant-input-password {
        color: var(--text-color) !important;
      }
      
      .ant-input::placeholder, .ant-input-password::placeholder {
        color: var(--text-color-secondary) !important;
      }
      
      .ant-input:hover, .ant-input-password:hover {
        border-color: var(--primary-color) !important;
      }
      
      .ant-input-affix-wrapper {
        background: var(--component-bg) !important;
        border-color: var(--border-color) !important;
      }
      
      .ant-input-affix-wrapper:hover {
        border-color: var(--primary-color) !important;
      }
      
      ${isDarkMode ? `
        .ant-input:focus, .ant-input-password:focus {
          border-color: #ffffff !important;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2) !important;
        }
        
        .ant-input-status-error, .ant-input-password-status-error {
          border-color: #FFD700 !important;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2) !important;
        }
        
        .ant-input-status-error:focus, .ant-input-password-status-error:focus {
          border-color: #FFD700 !important;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.3) !important;
        }
        
        .ant-input-affix-wrapper-focused {
          border-color: #ffffff !important;
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2) !important;
        }
        
        .ant-input-affix-wrapper-status-error {
          border-color: #FFD700 !important;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.2) !important;
        }
        
        .ant-input-affix-wrapper-status-error.ant-input-affix-wrapper-focused {
          border-color: #FFD700 !important;
          box-shadow: 0 0 0 2px rgba(255, 215, 0, 0.3) !important;
        }
        
        .ant-form-item-has-error .ant-form-item-explain {
          color: #FFD700 !important;
        }
        
        .ant-form-item-has-error .ant-form-item-explain-error {
          color: #FFD700 !important;
        }
      ` : `
        .ant-input:focus, .ant-input-password:focus {
          border-color: var(--primary-color) !important;
          box-shadow: 0 0 0 2px rgba(102, 8, 116, 0.2) !important;
        }
        
        .ant-input-status-error, .ant-input-password-status-error {
          border-color: #ff4d4f !important;
          box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) !important;
        }
        
        .ant-input-status-error:focus, .ant-input-password-status-error:focus {
          border-color: #ff4d4f !important;
          box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.3) !important;
        }
        
        .ant-input-affix-wrapper-focused {
          border-color: var(--primary-color) !important;
          box-shadow: 0 0 0 2px rgba(102, 8, 116, 0.2) !important;
        }
        
        .ant-input-affix-wrapper-status-error {
          border-color: #ff4d4f !important;
          box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) !important;
        }
        
        .ant-input-affix-wrapper-status-error.ant-input-affix-wrapper-focused {
          border-color: #ff4d4f !important;
          box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.3) !important;
        }
      `}
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, [isDarkMode]);

  // 如果已经登录，直接跳转到目标页面
  if (isAuthenticated()) {
    console.log('Login组件: 检测到已登录，跳转到:', from);
    navigate(from, { replace: true });
    return null;
  }

  return (
    <>
      {contextHolder}
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'var(--background-color)',
        position: 'relative'
      }}>
      {/* 主题切换按钮（与Dashboard一致） */}
      <ThemeToggleButton style={{ position: 'absolute', top: 24, right: 24, zIndex: 10 }} />
      <Card
        style={{
          width: 400,
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
          borderRadius: '16px',
          background: 'var(--component-bg)',
          position: 'relative',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ 
            margin: 0, 
            color: 'var(--primary-color)',
            fontSize: '28px',
            fontWeight: 'bold',
          }}>
            RoomX
          </Title>
          <Text type="secondary" style={{ 
            color: 'var(--text-color-secondary)',
            fontSize: '14px',
          }}>
            更现代的教室预约管理
          </Text>
        </div>

        {kickoutMessage && (
          <Alert
            message={kickoutMessage}
            type="error"
            showIcon
            style={{ marginBottom: '16px', borderRadius: '8px' }}
          />
        )}

        {isLoginMode ? (
          <Form
            name="login"
            onFinish={onLoginFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名!' },
                { min: 3, message: '用户名至少3个字符!' }
              ]}
            >
              <Input
                prefix={<UserOutlined style={iconStyle} />}
                placeholder="用户名"
                size="large"
                style={inputStyle}
                onChange={handleInputChange}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码!' },
                { min: 6, message: '密码至少6个字符!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={iconStyle} />}
                placeholder="密码"
                size="large"
                style={inputStyle}
                onChange={handleInputChange}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={{ 
                  width: '100%',
                  height: '48px',
                  borderRadius: '8px',
                  background: 'var(--primary-color)',
                  border: 'none',
                  fontWeight: 'bold',
                }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form
            name="register"
            onFinish={onRegisterFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: '请输入用户名!' },
                { min: 3, message: '用户名至少3个字符!' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线!' }
              ]}
            >
              <Input
                prefix={<UserOutlined style={iconStyle} />}
                placeholder="用户名"
                size="large"
                style={inputStyle}
                onChange={handleInputChange}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: '请输入邮箱!' },
                { type: 'email', message: '请输入有效的邮箱地址!' }
              ]}
            >
              <Input
                prefix={<MailOutlined style={iconStyle} />}
                placeholder="邮箱"
                size="large"
                style={inputStyle}
                onChange={handleInputChange}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: '请输入手机号!' },
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号!' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={iconStyle} />}
                placeholder="手机号"
                size="large"
                style={inputStyle}
                onChange={handleInputChange}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: '请输入密码!' },
                { min: 6, message: '密码至少6个字符!' }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={iconStyle} />}
                placeholder="密码"
                size="large"
                style={inputStyle}
                onChange={handleInputChange}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: '请确认密码!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={iconStyle} />}
                placeholder="确认密码"
                size="large"
                style={inputStyle}
                onChange={handleInputChange}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                style={{ 
                  width: '100%',
                  height: '48px',
                  borderRadius: '8px',
                  background: 'var(--primary-color)',
                  border: 'none',
                  fontWeight: 'bold',
                }}
              >
                注册
              </Button>
            </Form.Item>
          </Form>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary" style={{ color: 'var(--text-color-secondary)' }}>
            {isLoginMode ? '还没有账号？' : '已有账号？'}
            <Button
              type="link"
              className="login-toggle-link"
              onClick={() => setIsLoginMode(!isLoginMode)}
              style={{
                padding: 0,
                marginLeft: '4px',
                color: 'var(--primary-color)',
                fontWeight: 'bold',
                fontSize: '14px',
                textDecoration: 'none',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {isLoginMode ? '立即注册' : '立即登录'}
            </Button>
          </Text>
          

        </div>
      </Card>
    </div>
    </>
  );
} 