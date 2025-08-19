import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Space, 
  Typography,
  Tooltip
} from 'antd';
import { 
  MessageOutlined, 
  SendOutlined
} from '@ant-design/icons';
import { dutyAPI } from '../api/duty';
import { useI18n } from '../contexts/I18nContext';
import { useTheme } from '../contexts/ThemeContext';

const { TextArea } = Input;
const { Option } = Select;
const { Text } = Typography;

export default function FeedbackButton() {
  const { t } = useI18n();
  const { isDarkMode } = useTheme();
  const [todayDuty, setTodayDuty] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  // 获取今日值班人信息
  useEffect(() => {
    const fetchTodayDuty = async () => {
      try {
        const response = await dutyAPI.getTodayDuty();
        setTodayDuty(response.data);
      } catch (error) {
        console.log('获取今日值班人信息失败:', error);
        setTodayDuty(null);
      }
    };

    fetchTodayDuty();
  }, []);

  const handleOpenModal = () => {
    setModalVisible(true);
    form.resetFields();
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    form.resetFields();
  };

  const handleSubmitFeedback = async (values) => {
    setLoading(true);
    try {
      // 这里可以添加反馈提交的API调用
      // await feedbackAPI.submitFeedback(values);
      
      // 暂时模拟提交成功
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      messageApi.success(t('feedback.submitSuccess', '反馈提交成功，感谢您的建议！'));
      handleCloseModal();
    } catch (error) {
      console.error('提交反馈失败:', error);
      messageApi.error(t('feedback.submitFail', '提交失败，请稍后重试'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      
      {/* 悬浮反馈按钮 */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
        }}
      >
        <Tooltip title={t('feedback.buttonText', '意见反馈')} placement="left">
          <Button
            type="primary"
            size="middle"
            shape="circle"
            icon={<MessageOutlined />}
            onClick={handleOpenModal}
            style={{
              width: '44px',
              height: '44px',
              opacity: 0.85,
              boxShadow: '0 2px 8px rgba(24, 144, 255, 0.3)',
              border: 'none',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '1';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '0.85';
              e.target.style.transform = 'translateY(0)';
            }}
          />
        </Tooltip>
      </div>

      {/* 反馈模态框 */}
      <Modal
        title={
          <Space>
            <MessageOutlined />
            {t('feedback.modalTitle', '意见反馈')}
          </Space>
        }
        open={modalVisible}
        onCancel={handleCloseModal}
        footer={null}
        width={600}
      >
        {/* 今日值班人信息 */}
        {todayDuty ? (
          <div style={{ 
            marginBottom: '16px', 
            padding: '10px', 
            backgroundColor: isDarkMode ? '#162312' : '#f6ffed', 
            border: `1px solid ${isDarkMode ? '#274916' : '#b7eb8f'}`,
            borderRadius: '4px' 
          }}>
            <div style={{ marginBottom: '6px', lineHeight: '1.2' }}>
              <Text strong style={{ 
                color: isDarkMode ? '#73d13d' : '#389e0d', 
                fontSize: '12px' 
              }}>
                {t('feedback.todayDutyTitle', '可直接联系今日值班')}：
              </Text>
              <Text style={{ 
                color: isDarkMode ? '#95de64' : '#52c41a', 
                fontSize: '12px',
                marginLeft: '2px'
              }}>
                {todayDuty.dutyUserNickname || todayDuty.dutyUserName}
                {todayDuty.dutyUserNickname && todayDuty.dutyUserName && (
                  <span style={{ 
                    color: isDarkMode ? '#73d13d' : '#73d13d',
                    fontSize: '11px'
                  }}>
                    ({todayDuty.dutyUserName})
                  </span>
                )}
              </Text>
            </div>
            
            {todayDuty.dutyUserPhone && (
              <div style={{ marginBottom: '4px', lineHeight: '1.1' }}>
                <Text style={{ 
                  color: isDarkMode ? '#73d13d' : '#389e0d', 
                  fontSize: '11px' 
                }}>
                  电话：{todayDuty.dutyUserPhone}
                </Text>
              </div>
            )}
            
            {todayDuty.dutyUserEmail && (
              <div style={{ marginBottom: '4px', lineHeight: '1.1' }}>
                <Text style={{ 
                  color: isDarkMode ? '#73d13d' : '#389e0d', 
                  fontSize: '11px' 
                }}>
                  邮箱：{todayDuty.dutyUserEmail}
                </Text>
              </div>
            )}
            
            {todayDuty.remark && (
              <div style={{ 
                fontSize: '10px',
                marginTop: '6px',
                padding: '4px 6px',
                backgroundColor: isDarkMode ? '#111b0f' : '#f0f9e8',
                border: `1px solid ${isDarkMode ? '#1f3a14' : '#d9f7be'}`,
                borderRadius: '3px',
                color: isDarkMode ? '#73d13d' : '#389e0d',
                lineHeight: '1.2'
              }}>
                {todayDuty.remark}
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            marginBottom: '16px', 
            padding: '10px', 
            backgroundColor: isDarkMode ? '#1f1f1f' : '#fafafa', 
            border: `1px solid ${isDarkMode ? '#434343' : '#e8e8e8'}`,
            borderRadius: '4px', 
            textAlign: 'center' 
          }}>
            <Text style={{ 
              color: isDarkMode ? '#8c8c8c' : '#999', 
              fontSize: '11px' 
            }}>
              {t('feedback.noDutyToday', '今日无值班安排')}
            </Text>
          </div>
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitFeedback}
        >
          <Form.Item
            name="type"
            label={t('feedback.form.type', '反馈类型')}
            rules={[{ required: true, message: t('feedback.form.selectType', '请选择反馈类型') }]}
          >
            <Select placeholder={t('feedback.form.selectType', '请选择反馈类型')}>
              <Option value="bug">{t('feedback.types.bug', '问题反馈')}</Option>
              <Option value="suggestion">{t('feedback.types.suggestion', '功能建议')}</Option>
              <Option value="complaint">{t('feedback.types.complaint', '服务投诉')}</Option>
              <Option value="other">{t('feedback.types.other', '其他')}</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="title"
            label={t('feedback.form.title', '反馈标题')}
            rules={[
              { required: true, message: t('feedback.form.enterTitle', '请输入反馈标题') },
              { max: 50, message: t('feedback.form.titleTooLong', '标题不能超过50个字符') }
            ]}
          >
            <Input 
              placeholder={t('feedback.form.enterTitle', '请输入反馈标题')}
              maxLength={50}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="content"
            label={t('feedback.form.content', '反馈内容')}
            rules={[
              { required: true, message: t('feedback.form.enterContent', '请输入反馈内容') },
              { min: 10, message: t('feedback.form.contentTooShort', '反馈内容至少10个字符') },
              { max: 500, message: t('feedback.form.contentTooLong', '反馈内容不能超过500个字符') }
            ]}
          >
            <TextArea
              rows={6}
              placeholder={t('feedback.form.enterContent', '请详细描述您的问题或建议...')}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="contact"
            label={t('feedback.form.contact', '联系方式（选填）')}
          >
            <Input 
              placeholder={t('feedback.form.enterContact', '请输入邮箱或手机号')}
            />
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleCloseModal}>
                {t('common.cancel', '取消')}
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                icon={<SendOutlined />}
              >
                {t('feedback.submit', '提交反馈')}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </>
  );
}
