import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Tooltip, Button } from 'antd';
import { BulbOutlined, BulbFilled } from '@ant-design/icons';
import { useI18n } from '../contexts/I18nContext';

export default function ThemeToggleButton({ style }) {
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useI18n();
  return (
    <Tooltip title={isDarkMode ? t('layout.switchToLight') : t('layout.switchToDark')}>
      <Button
        shape="circle"
        size="large"
        icon={isDarkMode ? <BulbFilled /> : <BulbOutlined />}
        onClick={toggleTheme}
        style={{
          background: 'var(--component-bg)',
          color: 'var(--primary-color)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow)',
          ...style,
        }}
      />
    </Tooltip>
  );
} 