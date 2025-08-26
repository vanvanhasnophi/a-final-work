import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message, Alert, Dropdown } from 'antd';
import PasswordStrengthMeter from '../../components/PasswordStrengthMeter';
import { UserOutlined, LockOutlined, MailOutlined, PhoneOutlined, GlobalOutlined, DownOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggleButton from '../../components/ThemeToggleButton';
import { showTranslatedMessage } from '../../utils/messageTranslator';
import { useI18n } from '../../contexts/I18nContext';
import { notificationEvents, NOTIFICATION_EVENTS } from '../../utils/notificationEvents';

const { Title, Text } = Typography;

export default function Login() {
  const { t, lang, setLang } = useI18n();
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [kickoutMessage, setKickoutMessage] = useState('');
  // 密码强度展示用（需在任何条件 return 之前声明，避免 hooks 顺序问题）
  const [regPassword, setRegPassword] = useState('');
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
    const sessionExpired = urlParams.get('sessionExpired');
    
    if (kickout === 'true') {
      setKickoutMessage(t('login.errors.accountKickout'));
    } else if (expired === 'true') {
      setKickoutMessage(t('login.errors.loginExpired'));
    } else if (unauthorized === 'true') {
      setKickoutMessage(t('login.errors.loginUnauthorized'));
    } else if (sessionExpired === 'true') {
      setKickoutMessage(t('login.errors.accountDeleted'));
    }
    
    // 如果有任何错误参数，清除URL参数
    if (kickout === 'true' || expired === 'true' || unauthorized === 'true' || sessionExpired === 'true') {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // 登录前清空一次本地通知（避免前一账号遗留）
  try { localStorage.removeItem('localNotifications'); } catch(e) {}
    // 评估密码强度（不阻止登录；弱则登录后发送到通知中心）
    const pwd = values.password || '';
    const categories = [
      /[A-Z]/.test(pwd),
      /[a-z]/.test(pwd),
      /[0-9]/.test(pwd),
      /[!@#$%^&*()_+\-={}[\]|:;"'<>.,?/]/.test(pwd)
    ].filter(Boolean).length;
    const weak = pwd.length < 8 || categories < 3;
    
    console.log('开始登录:', values);
    try {
      const result = await login(values.username, values.password);
      console.log('登录结果:', result);
      if (result.success) {
        // 登录成功
        showTranslatedMessage(
          messageApi, 
          'success', 
          'Login successful', 
          t('login.messages.loginSuccess'),
          { duration: 1.5 }
        );
        
        // 如果密码过于简单，添加本地通知
        if (weak) {
          const weakPasswordNotification = {
            id: `weak-password-${Date.now()}`,
            title: 'passwordSecurity.weakPassword.title',
            content: 'passwordSecurity.weakPassword.content',
            type: 'security',
            priority: 'high',
            isRead: false,
            createTime: new Date().toISOString(),
            local: true
          };
          
          try {
            const existing = JSON.parse(localStorage.getItem('localNotifications') || '[]');
            existing.push(weakPasswordNotification);
            localStorage.setItem('localNotifications', JSON.stringify(existing));
            
            // 温柔地触发新通知事件，让横幅立即显示
            notificationEvents.emit(NOTIFICATION_EVENTS.NEW_NOTIFICATION, weakPasswordNotification);
            
            console.log('已创建弱密码本地通知并触发事件');
          } catch (e) {
            console.warn('保存本地通知失败:', e);
          }
        }
        
        // 跳转到目标页面
        navigate(from, { replace: true });
      } else if (result.code === 401) {
        showTranslatedMessage(
          messageApi, 
          'error', 
          result.message, 
          t('login.errors.loginFailed'),
          { duration: 1.5 }
        );
      } else {
        showTranslatedMessage(
          messageApi, 
          'error', 
          result.error || result.message, 
          t('login.errors.loginFailed'),
          { duration: 1.5 }
        );
      }
    } catch (error) {
      console.error('登录错误:', error);
      showTranslatedMessage(
        messageApi, 
        'error', 
        error.message || 'Network error', 
        t('login.errors.networkError'),
        { duration: 1.5 }
      );
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
        showTranslatedMessage(
          messageApi, 
          'success', 
          'Registration successful', 
          t('login.messages.registerSuccess'),
          { duration: 1.5 }
        );
        // 延迟切换到登录模式，让用户看到成功消息
        setTimeout(() => {
          setIsLoginMode(true);
        }, 1500);
      } else {
        showTranslatedMessage(
          messageApi, 
          'error', 
          result.error, 
          t('login.errors.registerFailed'),
          { duration: 1.5 }
        );
      }
    } catch (error) {
      console.error('注册错误:', error);
      showTranslatedMessage(
        messageApi, 
        'error', 
        error.message || 'Network error', 
        t('login.errors.networkError'),
        { duration: 1.5 }
      );
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
      {/* 右上角：语言下拉 + 主题切换 */}
      <div style={{ position: 'absolute', top: 24, right: 24, zIndex: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
        <Dropdown
          placement="bottomRight"
          trigger={["click"]}
          menu={{
            selectedKeys: [lang],
            onClick: ({ key }) => setLang(key),
            items: [
              { key: 'zh-CN', label: '中文' },
              { key: 'en-US', label: 'English' },
            ]
          }}
        >
          <Button size="small" icon={<GlobalOutlined />}>
            {lang === 'zh-CN' ? '中文' : 'EN'} <DownOutlined />
          </Button>
        </Dropdown>
        <ThemeToggleButton />
      </div>
      <Card 
        className="transparent-card"
        variant="borderless"
        style={{
          width: 400,
          boxShadow: '0 0px 0px rgba(0,0,0,0)',
          borderRadius: '16px',
          background: 'transparent',
          position: 'relative',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2} style={{ 
            margin: 0, 
            color: 'var(--primary-color)',
            fontSize: '32px',
            fontWeight: 600, /* 数值权重便于变量字体过渡 */
            fontVariationSettings: "'wght' 600"
          }}>
            {t(isLoginMode ? 'appName' : 'login.registerTitle')}
          </Title>
          <Text type="secondary" style={{ 
            color: 'var(--text-color-secondary)',
            fontSize: '16px',
          }}>
            {t(isLoginMode ? 'login.subtitle' : '')}
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
                { required: true, message: t('login.errors.usernameRequired') },
                { min: 3, message: t('login.errors.usernameMinLength') },
                { pattern: /^[a-zA-Z0-9_]+$/, message: t('login.errors.usernamePattern') }
              ]}
            >
              <Input
                prefix={<UserOutlined style={iconStyle} />}
                placeholder={t('login.username')}
                size="large"
                style={inputStyle}
                onChange={handleInputChange}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: t('login.errors.passwordRequired') }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={iconStyle} />}
                placeholder={t('login.password')}
                size="large"
                style={inputStyle}
                onChange={(e) => {
      handleInputChange();
                }}
              />
            </Form.Item>
    {/* 弱密码提示改为登录成功后写入通知中心，不在登录界面直接显示 */}

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
                  fontWeight: 600,
                  fontVariationSettings: "'wght' 600"
                }}
              >
                {t('login.title')}
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
                { required: true, message: t('login.errors.usernameRequired') },
                { min: 3, message: t('login.errors.usernameMinLength') },
                { pattern: /^[a-zA-Z0-9_]+$/, message: t('login.errors.usernamePattern') }
              ]}
            >
              <Input
                prefix={<UserOutlined style={iconStyle} />}
                placeholder={t('login.username')}
                size="large"
                style={inputStyle}
                onChange={handleInputChange}
              />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: t('login.errors.emailRequired') },
                { type: 'email', message: t('login.errors.emailInvalid') }
              ]}
            >
              <Input
                prefix={<MailOutlined style={iconStyle} />}
                placeholder={t('login.email')}
                size="large"
                style={inputStyle}
                onChange={handleInputChange}
              />
            </Form.Item>

            <Form.Item
              name="phone"
              rules={[
                { required: true, message: t('login.errors.phoneRequired') },
                { pattern: /^1[3-9]\d{9}$/, message: t('login.errors.phoneInvalid') }
              ]}
            >
              <Input
                prefix={<PhoneOutlined style={iconStyle} />}
                placeholder={t('login.phone')}
                size="large"
                style={inputStyle}
                onChange={handleInputChange}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: t('login.errors.passwordRequired') },
                { min: 8, message: t('login.errors.passwordMinLength') },
                { validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const parts = [
                      value.length >= 8,
                      /[A-Z]/.test(value),
                      /[a-z]/.test(value),
                      /[0-9]/.test(value),
                      /[!@#$%^&*()_+\-={}[\]|:;"'<>.,?/]/.test(value)
                    ].filter(Boolean).length;
                    if (parts >= 3 && value.length >= 8) return Promise.resolve();
                    return Promise.reject(new Error(t('login.errors.passwordComplexity')));
                  }
                }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={iconStyle} />}
                placeholder={t('login.password')}
                size="large"
                style={inputStyle}
                onChange={(e) => { setRegPassword(e.target.value); handleInputChange(); }}
              />
            </Form.Item>

            <PasswordStrengthMeter password={regPassword} />

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: t('login.errors.passwordConfirmRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('login.errors.passwordNotMatch')));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={iconStyle} />}
                placeholder={t('login.confirmPassword')}
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
                  fontWeight: 600,
                  fontVariationSettings: "'wght' 600"
                }}
              >
                {t('login.register')}
              </Button>
            </Form.Item>
          </Form>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Text type="secondary" style={{ color: 'var(--text-color-secondary)' }}>
            {isLoginMode ? t('login.prompts.noAccount') : t('login.prompts.hasAccount')}
            <Button
              type="link"
              className="login-toggle-link"
              onClick={() => setIsLoginMode(!isLoginMode)}
              style={{
                padding: '12px',
                margin: '4px',
                color: 'var(--primary-color)',
                fontWeight: 600,
                fontVariationSettings: "'wght' 600",
                fontSize: '16px',
                textDecoration: 'none',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              {isLoginMode ? t('login.switchToRegister') : t('login.switchToLogin')}
            </Button>
          </Text>
          

        </div>
      </Card>
    </div>
    </>
  );
}