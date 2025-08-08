import React from 'react';
import { Progress, Tooltip } from 'antd';

/**
 * 评分规则：长度>=8 + 大写 + 小写 + 数字 + 特殊字符 共5项
 * 至少满足3项（含长度）才算通过（与后端校验一致）。
 */
function calcStrength(pwd) {
  if (!pwd) return { score: 0, passed: false, parts: [] };
  const parts = [];
  if (pwd.length >= 8) parts.push('长度≥8');
  if (/[A-Z]/.test(pwd)) parts.push('大写');
  if (/[a-z]/.test(pwd)) parts.push('小写');
  if (/[0-9]/.test(pwd)) parts.push('数字');
  if (/[!@#$%^&*()_+\-={}[\]|:;"'<>.,?/]/.test(pwd)) parts.push('特殊');
  const score = parts.length; // 0-5
  return { score, passed: score >= 3 && pwd.length >= 8, parts };
}

const levelMap = [
  { max: 1, color: '#ff4d4f', text: '弱' },
  { max: 3, color: '#faad14', text: '中' },
  { max: 5, color: '#52c41a', text: '强' }
];

function getLevel(score) {
  return levelMap.find(l => score <= l.max) || levelMap[levelMap.length - 1];
}

export default function PasswordStrengthMeter({ password, style, compact }) {
  const { score, passed, parts } = calcStrength(password);
  const level = getLevel(score);
  const percent = (score / 5) * 100;
  const unmetHints = ['长度≥8', '大写', '小写', '数字', '特殊']
    .filter(req => !parts.includes(req));

  const tip = (
    <div style={{ fontSize: 12 }}>
      <div>已满足: {parts.length ? parts.join(' / ') : '无'}</div>
      {unmetHints.length > 0 && <div>缺少: {unmetHints.join(' / ')}</div>}
      <div style={{ marginTop: 4, color: passed ? '#52c41a' : '#ff4d4f' }}>
        {passed ? '已达到基础安全要求' : '需至少满足3类并长度≥8'}
      </div>
    </div>
  );

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
        <span style={{ fontSize: 12, color: 'var(--text-color-secondary)' }}>密码强度</span>
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
