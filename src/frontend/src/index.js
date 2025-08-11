import React from 'react';
import ReactDOM from 'react-dom/client';
import 'antd/dist/reset.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { I18nProvider } from './contexts/I18nContext';

// 确保所有页面始终加载 Inter 字体声明（即便当前偏好是 system）
(() => {
  try {
    if (!document.querySelector('link[data-inter-font="true"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
          const base = process.env.PUBLIC_URL || '';
          link.href = base + '/fonts/inter.css';
      link.setAttribute('data-inter-font', 'true');
      document.head.appendChild(link);
    }
  } catch (_) {}
})();

// 字体渲染偏好：'inter' | 'system'
const FONT_PREF_KEY = 'fontPreference';
function applyFontPreference() {
  try {
    const html = document.documentElement;
    const ua = navigator.userAgent || '';
    const platform = navigator.platform || '';
    const isApple = /Mac|iPhone|iPad|iPod/.test(platform) || /Mac OS X/.test(ua);
    if (isApple) {
      html.classList.add('apple-os');
    }

    // 读取用户选择
    let pref = localStorage.getItem(FONT_PREF_KEY);
    if (!pref) {
      // 默认：苹果系统 => system；其他 => inter
      pref = isApple ? 'system' : 'inter';
      localStorage.setItem(FONT_PREF_KEY, pref);
    }

    // 清理旧类
    html.classList.remove('font-system', 'font-inter');
    // 默认基础 body 已是系统字体；加类仅用于语义
    if (pref === 'system') {
      html.classList.add('font-system');
  html.style.setProperty('--app-font-stack', getComputedStyle(html).getPropertyValue('--app-font-stack-system').trim());
  // 强制触发一次 reflow 以确保系统字体立即应用
  void document.body.offsetWidth;
      // 可选：不移除 preload，避免来回切换重新下载；若要节省带宽可以移除
    } else if (pref === 'inter') {
      html.classList.add('font-inter');
  html.style.setProperty('--app-font-stack', getComputedStyle(html).getPropertyValue('--app-font-stack-inter').trim());
      // 确保样式表已加载
      if (!document.querySelector('link[href*="/fonts/inter.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
  const base = process.env.PUBLIC_URL || '';
  link.href = base + '/fonts/inter.css';
        document.head.appendChild(link);
      }
      // 若未预加载可动态添加
      if (!document.querySelector('link[rel="preload"][href*="InterVariable"]')) {
        const preload = document.createElement('link');
        preload.rel = 'preload';
        preload.as = 'font';
        preload.type = 'font/woff2';
        preload.crossOrigin = 'anonymous';
  const base = process.env.PUBLIC_URL || '';
  preload.href = base + '/fonts/InterVariable.woff2';
      // 立即切换全局变量，避免只看到示例变化
      html.style.setProperty('--app-font-stack', getComputedStyle(html).getPropertyValue('--app-font-stack-inter').trim());
        document.head.appendChild(preload);
      }
      // 强制触发一次 reflow 以确保类应用
      void document.body.offsetWidth;
    }
  } catch (_) {}
}
applyFontPreference();

// 简单字体加载监控：3s 后若用户选择 Inter 但实际未应用则降级追加 font-fallback
try {
  const FONT_CHECK_TIMEOUT = 3000;
  setTimeout(() => {
    const html = document.documentElement;
    if (!html.classList.contains('font-inter')) return; // 仅在用户选择 Inter 时检测
    const bodyStyle = window.getComputedStyle(document.body);
    const ff = bodyStyle.fontFamily || '';
    if (/intervariable|interlocal|\binter\b/i.test(ff)) {
      html.classList.add('font-loaded');
      html.classList.remove('font-inter-noop');
    } else {
      html.classList.add('font-fallback');
      html.classList.add('font-inter-noop');
      // 尝试再次注入样式表（可能首次未完成）
      if (!document.querySelector('link[href*="/fonts/inter.css"]')) {
        const link2 = document.createElement('link');
        link2.rel = 'stylesheet';
        link2.href = '/fonts/inter.css';
        document.head.appendChild(link2);
      }
      // 强制一次重绘后再次检测
      setTimeout(() => {
        const ff2 = window.getComputedStyle(document.body).fontFamily || '';
        if (/intervariable|interlocal|\binter\b/i.test(ff2)) {
          html.classList.add('font-loaded');
          html.classList.remove('font-inter-noop');
          // 二次确认后再设置变量，确保首屏切换成功
          html.style.setProperty('--app-font-stack', getComputedStyle(html).getPropertyValue('--app-font-stack-inter').trim());
        }
      }, 800);
    }
  }, FONT_CHECK_TIMEOUT);
} catch (_) {}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
