// 主题配置
export const theme = {
  // 强调色 - 紫色
  primary: {
    light: '#7D0A8E', // 浅色模式
    dark: '#990CAE',  // 深色模式
  },
  
  // 背景色
  background: {
    light: '#F2F2F2', // 浅色模式
    dark: '#1E1F22',  // 深色模式
  },
  
  // 组件背景色
  componentBg: {
    light: '#FFFFFF',
    dark: '#2B2D31',
  },
  
  // 文字颜色
  text: {
    light: '#000000',
    dark: '#FFFFFF',
  },
  
  // 边框颜色
  border: {
    light: '#E5E5E5',
    dark: '#3C3F45',
  },
  
  // 阴影
  shadow: {
    light: '0 2px 8px rgba(0, 0, 0, 0.1)',
    dark: '0 2px 8px rgba(0, 0, 0, 0.3)',
  },
};

// Ant Design 主题配置
export const antdTheme = {
  token: {
    // 主色调
    colorPrimary: theme.primary.light,
    colorPrimaryHover: '#7A0A8A',
    colorPrimaryActive: '#5A0668',
    
    // 背景色
    colorBgContainer: theme.componentBg.light,
    colorBgLayout: theme.background.light,
    
    // 文字颜色
    colorText: theme.text.light,
    colorTextSecondary: '#666666',
    
    // 边框颜色
    colorBorder: theme.border.light,
    
    // 圆角
    borderRadius: 8,
    
    // 阴影
    boxShadow: theme.shadow.light,
  },
};

// 深色模式主题
export const antdDarkTheme = {
  token: {
    // 主色调
    colorPrimary: theme.primary.dark,
    colorPrimaryHover: '#B30FCC',
    colorPrimaryActive: '#7A0A8A',
    
    // 背景色
    colorBgContainer: theme.componentBg.dark,
    colorBgLayout: theme.background.dark,
    
    // 文字颜色
    colorText: theme.text.dark,
    colorTextSecondary: '#CCCCCC',
    
    // 边框颜色
    colorBorder: theme.border.dark,
    
    // 圆角
    borderRadius: 8,
    
    // 阴影
    boxShadow: theme.shadow.dark,
  },
  algorithm: theme.darkAlgorithm,
};

// CSS 变量
export const cssVariables = {
  light: {
    '--primary-color': theme.primary.light,
    '--primary-hover': '#7A0A8A',
    '--primary-active': '#5A0668',
    '--background-color': theme.background.light,
    '--component-bg': theme.componentBg.light,
    '--component-bg-elevated': '#FFFFFF',
    '--text-color': theme.text.light,
    '--text-color-secondary': '#666666',
    '--text-color-tertiary': '#999999',
    '--text-color-quaternary': '#CCCCCC',
    '--border-color': theme.border.light,
    '--border-color-secondary': '#F0F0F0',
    '--fill-color': '#F5F5F5',
    '--fill-color-secondary': '#FAFAFA',
    '--fill-color-tertiary': '#FFFFFF',
    '--fill-color-quaternary': '#F0F0F0',
    '--shadow': theme.shadow.light,
    '--shadow-secondary': '0 1px 2px rgba(0, 0, 0, 0.06)',
    '--border-radius': '8px',
    '--border-radius-lg': '12px',
    '--border-radius-sm': '4px',
  },
  dark: {
    '--primary-color': theme.primary.dark,
    '--primary-hover': '#c23fd6',
    '--primary-active': '#7A0A8A',
    '--background-color': theme.background.dark,
    '--component-bg': theme.componentBg.dark,
    '--component-bg-elevated': '#2B2D31',
    '--text-color': theme.text.dark,
    '--text-color-secondary': '#CCCCCC',
    '--text-color-tertiary': '#999999',
    '--text-color-quaternary': '#666666',
    '--border-color': theme.border.dark,
    '--border-color-secondary': '#3C3F45',
    '--fill-color': '#3C3F45',
    '--fill-color-secondary': '#2B2D31',
    '--fill-color-tertiary': '#1E1F22',
    '--fill-color-quaternary': '#3C3F45',
    '--shadow': theme.shadow.dark,
    '--shadow-secondary': '0 1px 2px rgba(0, 0, 0, 0.3)',
    '--border-radius': '8px',
    '--border-radius-lg': '12px',
    '--border-radius-sm': '4px',
  },
}; 