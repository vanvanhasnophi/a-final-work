import React, { useEffect, useState } from 'react';
import { Card, Radio, Space, Typography, Divider, Alert } from 'antd';
import { useI18n } from '../contexts/I18nContext';

const { Title, Paragraph, Text } = Typography;
const FONT_PREF_KEY = 'fontPreference';

export default function Settings() {
  const { t, lang, setLang } = useI18n();
  const [fontPref, setFontPref] = useState('inter');
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    try {
      const ua = navigator.userAgent || '';
      const platform = navigator.platform || '';
      const apple = /Mac|iPhone|iPad|iPod/.test(platform) || /Mac OS X/.test(ua);
      setIsApple(apple);
      const saved = localStorage.getItem(FONT_PREF_KEY);
      if (saved) {
        setFontPref(saved);
      } else {
        setFontPref(apple ? 'system' : 'inter');
      }
    } catch (_) {}
  }, []);

  const applyPref = (pref) => {
    const html = document.documentElement;
    try {
      if (pref === 'browser') {
        // 浏览器设置：放置一个绝不会命中的占位字体名称在最前，后续依然跟随系统 / 常见无衬线回退
        // 这样既不清空变量（避免某些解析差异），又让浏览器按自己的顺序选择真实可用字体
        const placeholder = '"__BrowserPreferred__"';
        const fallback = "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
        html.style.setProperty('--app-font-stack', `${placeholder}, ${fallback}`);
      } else {
        const targetVar = pref === 'system' ? '--app-font-stack-system' : '--app-font-stack-inter';
        const val = getComputedStyle(html).getPropertyValue(targetVar).trim();
        if (val) {
          html.style.setProperty('--app-font-stack', val);
        }
      }
      html.dataset.fontPref = pref; // 提供调试/样式钩子
      // 仅保留语义类，避免重复切换时 class 堆积
      html.classList.remove('font-system', 'font-inter');
      if (pref === 'system') html.classList.add('font-system');
      if (pref === 'inter') html.classList.add('font-inter');
      void document.body.offsetWidth;
    } catch(_) {}
  };

  const onChange = (e) => {
    const value = e.target.value;
    setFontPref(value);
    localStorage.setItem(FONT_PREF_KEY, value);
    applyPref(value);
  };

  useEffect(() => {
    applyPref(fontPref);
  }, [fontPref]);

  return (
    <div style={{ padding: 24 }}>
      <Title level={3}>{t('settings.title')}</Title>
      {/* 语言设置置于最上方 */}
      <Card title={t('settings.language')} bordered style={{ maxWidth: 600, marginBottom: 16 }}>
        <Radio.Group onChange={(e)=>setLang(e.target.value)} value={lang}>
          <Space direction="vertical">
            <Radio value="zh-CN">{t('settings.zhCN')}</Radio>
            <Radio value="en-US">{t('settings.enUS')}</Radio>
          </Space>
        </Radio.Group>
      </Card>
      {/* 字体渲染设置 */}
      <Card title={t('settings.font')} bordered style={{ maxWidth: 600, marginBottom: 16 }}>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {isApple && (
            <Alert
              type="info"
              showIcon
              message={t('settings.appleTitle')}
              description={<span>{t('settings.appleDesc')}</span>}
            />
          )}
          <Paragraph>{t('settings.fontIntro')}</Paragraph>
          <Radio.Group onChange={onChange} value={fontPref}>
            <Space direction="vertical">
              <Radio value="inter">{t('common.default')}</Radio>
              <Radio value="system">{t('common.system')}</Radio>
              <Radio value="browser">{t('common.browser')}</Radio>
            </Space>
          </Radio.Group>
          <Divider style={{ margin: '12px 0' }} />
          <Paragraph type="secondary" style={{ fontSize: 12 }}>{t('settings.tipLocal')}</Paragraph>
          <Paragraph style={{ marginBottom: 4 }}>
            <Text strong>{t('settings.previewCurrent')}</Text>{' '}
            <span style={{ fontFamily: 'var(--app-font-stack)', transition: 'font 0.2s' }}>
              The quick brown fox jumps over the lazy dog 观自在菩萨 行深般若波罗蜜多时 1234567890
            </span>
          </Paragraph>
          <Paragraph style={{ marginBottom: 0, fontSize: 13 }}>
            <Text strong>{t('settings.previewNumber')}</Text>{' '}
            <span className="num-mono" style={{ fontFamily: 'var(--app-font-stack)', transition: 'font 0.2s' }}>0 1 2 3 4 5 6 7 8 9  00 11 22 33 44 55 66 77 88 99  2025-08-08  12:34:56</span>
          </Paragraph>
        </Space>
      </Card>
    </div>
  );
}
