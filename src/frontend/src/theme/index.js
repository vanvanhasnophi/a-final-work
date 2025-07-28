// 主题配置
export const theme = {
  // 强调色 - 紫色
  primary: {
    light: '#660874', // 浅色模式
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
  
  // 深色模式算法
  algorithm: 'darkAlgorithm',
};

// CSS 变量
export const cssVariables = {
  light: {
    '--primary-color': theme.primary.light,
    '--background-color': theme.background.light,
    '--component-bg': theme.componentBg.light,
    '--text-color': theme.text.light,
    '--text-color-secondary': '#666666',
    '--border-color': theme.border.light,
    '--shadow': theme.shadow.light,
  },
  dark: {
    '--primary-color': theme.primary.dark,
    '--background-color': theme.background.dark,
    '--component-bg': theme.componentBg.dark,
    '--text-color': theme.text.dark,
    '--text-color-secondary': '#CCCCCC',
    '--border-color': theme.border.dark,
    '--shadow': theme.shadow.dark,
  },
}; 