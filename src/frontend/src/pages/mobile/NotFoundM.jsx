import React from 'react';
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Result
        status="404"
        title={t('notFound.title')}
        subTitle={t('notFound.subtitle')}
        extra={[
          <Button type="primary" key="dashboard" onClick={() => navigate('/dashboard')}>
            {t('notFound.backToHome')}
          </Button>,
          <Button key="back" onClick={() => navigate(-1)}>
            {t('notFound.goBack')}
          </Button>,
        ]}
      />
    </div>
  );
} 