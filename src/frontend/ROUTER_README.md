# RoomX 前端路由系统

## 概述

本项目使用 React Router v6 构建了完整的前端路由系统，包含多个功能页面和布局组件。

## 路由结构

### 公开路由
- `/login` - 登录页面

### 需要认证的路由（使用 AppLayout 布局）
- `/` - 首页（重定向到仪表板）
- `/dashboard` - 仪表板页面
- `/rooms` - 房间管理页面
- `/applications` - 申请管理页面
- `/profile` - 用户个人资料页面

### 错误页面
- `/404` - 404 错误页面

## 页面组件

### 1. Login.jsx
- 功能：用户登录
- 特性：表单验证、错误处理、登录成功后跳转

### 2. Dashboard.jsx
- 功能：系统仪表板
- 特性：统计卡片、快速操作、最近活动

### 3. RoomList.jsx
- 功能：房间列表管理
- 特性：表格展示、搜索筛选、分页

### 4. ApplicationList.jsx
- 功能：申请列表管理
- 特性：申请状态管理、新建申请模态框

### 5. UserProfile.jsx
- 功能：用户个人资料
- 特性：信息编辑、活动记录

### 6. NotFound.jsx
- 功能：404 错误页面
- 特性：导航按钮、友好提示

## 布局组件

### AppLayout.jsx
- 功能：应用主布局
- 特性：
  - 侧边栏导航菜单
  - 顶部用户信息
  - 响应式设计
  - 菜单折叠功能

## 路由配置

```javascript
// 路由配置示例
<Routes>
  {/* 公开路由 */}
  <Route path="/login" element={<Login />} />
  
  {/* 需要认证的路由 */}
  <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
  <Route path="/rooms" element={<AppLayout><RoomList /></AppLayout>} />
  
  {/* 404页面 */}
  <Route path="/404" element={<NotFound />} />
  
  {/* 默认重定向 */}
  <Route path="*" element={<Navigate to="/404" replace />} />
</Routes>
```

## 导航功能

### 编程式导航
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// 跳转到指定页面
navigate('/dashboard');

// 返回上一页
navigate(-1);
```

### 菜单导航
- 侧边栏菜单自动高亮当前页面
- 支持菜单折叠/展开
- 用户下拉菜单包含个人资料和退出登录

## 样式系统

### Ant Design 主题
- 使用 ConfigProvider 配置中文语言包
- 自定义 CSS 样式增强视觉效果
- 响应式设计支持移动端

### 全局样式
- 统一的颜色主题
- 圆角设计
- 阴影效果
- 平滑过渡动画

## 使用说明

1. **启动开发服务器**
   ```bash
   cd src/frontend
   npm start
   ```

2. **访问应用**
   - 打开浏览器访问 `http://localhost:3000`
   - 默认会跳转到登录页面
   - 登录成功后进入仪表板

3. **页面导航**
   - 使用侧边栏菜单导航
   - 点击用户头像查看下拉菜单
   - 支持浏览器前进/后退

## 扩展指南

### 添加新页面
1. 在 `src/pages/` 目录下创建新组件
2. 在 `src/router/index.js` 中添加路由配置
3. 在 `src/components/Layout.jsx` 中添加菜单项

### 添加新功能
1. 创建功能组件
2. 更新相关页面组件
3. 添加必要的路由配置

## 注意事项

- 所有需要认证的页面都使用 AppLayout 包装
- 登录页面独立于主布局
- 404 页面提供友好的错误提示
- 路由配置支持嵌套和重定向 