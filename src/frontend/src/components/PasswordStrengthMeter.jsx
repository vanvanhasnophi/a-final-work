import React from 'react';
import { Progress, Tooltip } from 'antd';
import { useI18n } from '../contexts/I18nContext';

/**
 * 评分规则：长度>=8 + 大写 + 小写 + 数字 + 特殊字符 共5项
 * 至少满足3项（含长度）才算通过（与后端校验一致）。
 */
function calcStrength(pwd, t) {
  if (!pwd) return { score: 0, passed: false, parts: [] };
  const parts = [];
  if (pwd.length >= 8) parts.push(t('passwordStrength.length'));
  if (/[A-Z]/.test(pwd)) parts.push(t('passwordStrength.uppercase'));
  if (/[a-z]/.test(pwd)) parts.push(t('passwordStrength.lowercase'));
  if (/[0-9]/.test(pwd)) parts.push(t('passwordStrength.number'));
  if (/[!@#$%^&*()_+\-={}[\]|:;"'<>.,?/]/.test(pwd)) parts.push(t('passwordStrength.special'));
  const score = parts.length; // 0-5
  return { score, passed: score >= 3 && pwd.length >= 8, parts };
}

const levelMap = (t) => [
  { max: 1, color: '#ff4d4f', text: t('passwordStrength.weak') },
  { max: 3, color: '#faad14', text: t('passwordStrength.medium') },
  { max: 5, color: '#52c41a', text: t('passwordStrength.strong') }
];

function getLevel(score, t) {
  const levels = levelMap(t);
  return levels.find(l => score <= l.max) || levels[levels.length - 1];
}

export default function PasswordStrengthMeter({ password, style, compact }) {
  const { t } = useI18n();
  const { score, passed, parts } = calcStrength(password, t);
  const level = getLevel(score, t);
  const percent = (score / 5) * 100;
  const unmetHints = [
    t('passwordStrength.length'),
    t('passwordStrength.uppercase'),
    t('passwordStrength.lowercase'), 
    t('passwordStrength.number'),
    t('passwordStrength.special')
  ].filter(req => !parts.includes(req));

  const tip = (
    <div style={{ fontSize: 12 }}>
      <div>{t('passwordStrength.satisfied')}: {parts.length ? parts.join(' / ') : t('passwordStrength.none')}</div>
      {unmetHints.length > 0 && <div>{t('passwordStrength.missing')}: {unmetHints.join(' / ')}</div>}
      <div style={{ marginTop: 4, color: passed ? '#52c41a' : '#ff4d4f' }}>
        {passed ? t('passwordStrength.sufficient') : t('passwordStrength.requirements')}
      </div>
    </div>
  );
  if (!password) return null;
  return (
    <div style={{ 
      marginTop: compact ? 4 : 8,
      padding: compact ? '2px 4px' : '4px 6px',
      borderRadius: 6,
      background: 'rgba(0,0,0,0.04)',
      backdropFilter: 'blur(2px)',
      ...(style||{})
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-color-secondary)' }}>{t('passwordStrength.title')}</span>
        <span style={{ fontSize: 12, color: level.color }}>{level.text}</span>
      </div>
      <Tooltip placement="top" title={tip}>
        <Progress
          percent={percent}
          showInfo={false}
          size="small"
          strokeColor={level.color}
          strokeWidth={compact ? 6 : 8}
          style={{ marginBottom: 4, opacity: 0.85 }}
        />
      </Tooltip>
    </div>
  );
}
