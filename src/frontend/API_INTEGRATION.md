# RoomX 前后端连接指南

## 🚀 快速开始

### 1. 启动后端服务
```bash
cd /path/to/project
mvn spring-boot:run
```
后端服务将在 `http://localhost:8080` 启动

### 2. 启动前端服务
```bash
cd src/frontend
npm start
```
前端服务将在 `http://localhost:3000` 启动

## 🔧 配置说明

### 开发环境配置
- 前端使用代理配置 (`src/setupProxy.js`)
- API 请求通过 `/api` 路径代理到后端
- 自动处理 CORS 问题

### 生产环境配置
- 设置 `REACT_APP_API_URL` 环境变量
- 直接访问后端 API 地址

## 📡 API 接口

### 认证相关 (`/api`)
- `POST /login` - 用户登录
- `POST /register` - 用户注册
- `POST /logout` - 用户登出
- `POST /updatePassword` - 更新密码

### 用户相关 (`/api/user`)
- `GET /me` - 获取当前用户信息
- `GET /{id}` - 获取用户详情
- `PUT /{id}` - 更新用户信息

### 房间相关 (`/api/room`)
- `GET /page` - 分页获取房间列表
- `GET /{id}` - 获取房间详情
- `POST /create` - 创建房间
- `PUT /{id}` - 更新房间
- `DELETE /{id}` - 删除房间

### 申请相关 (`/api/application`)
- `GET /page` - 分页获取申请列表
- `GET /list` - 获取所有申请
- `GET /{id}` - 获取申请详情
- `POST /post` - 创建申请

## 🔐 认证机制

### Token 管理
- 登录成功后获取 token
- token 存储在 localStorage
- 请求时自动添加 Authorization 头
- token 过期自动跳转登录页

### 错误处理
- 401: 登录过期，自动跳转登录
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器错误

## 📁 文件结构

```
src/frontend/src/
├── api/
│   ├── index.js          # API 基础配置
│   ├── auth.js           # 认证相关 API
│   ├── user.js           # 用户相关 API
│   ├── room.js           # 房间相关 API
│   └── application.js    # 申请相关 API
├── utils/
│   ├── request.js        # 请求工具
│   └── testConnection.js # 连接测试
└── setupProxy.js         # 代理配置
```

## 🧪 测试连接

### 在浏览器控制台测试
```javascript
// 导入测试函数
import { testConnection, testLogin, testRoomList } from './utils/testConnection';

// 测试基础连接
await testConnection();

// 测试登录
await testLogin('username', 'password');

// 测试房间列表
await testRoomList();
```

## 🔍 调试技巧

### 1. 检查网络请求
- 打开浏览器开发者工具
- 查看 Network 标签页
- 检查请求和响应

### 2. 检查代理配置
- 确认 `setupProxy.js` 配置正确
- 检查后端服务是否运行
- 验证端口配置

### 3. 检查 CORS 配置
- 确认后端 CORS 配置正确
- 检查请求头设置
- 验证跨域策略

## 🚨 常见问题

### 1. 代理连接失败
**问题**: 前端无法连接到后端
**解决**: 
- 确认后端服务运行在 8080 端口
- 检查代理配置
- 重启前端服务

### 2. CORS 错误
**问题**: 浏览器报 CORS 错误
**解决**:
- 确认后端 CORS 配置
- 检查请求头设置
- 使用代理配置

### 3. Token 认证失败
**问题**: API 请求返回 401
**解决**:
- 检查 token 是否正确存储
- 确认 token 格式正确
- 重新登录获取 token

### 4. 数据格式不匹配
**问题**: 前后端数据格式不一致
**解决**:
- 检查 API 响应格式
- 确认前端数据处理逻辑
- 查看后端 DTO 定义

## 📊 监控和日志

### 前端日志
- 控制台输出 API 请求日志
- 错误信息自动显示
- 网络请求状态监控

### 后端日志
- Spring Boot 应用日志
- 数据库查询日志
- 异常堆栈信息

## 🔄 部署配置

### 开发环境
```bash
# 启动后端
mvn spring-boot:run

# 启动前端
npm start
```

### 生产环境
```bash
# 构建前端
npm run build

# 部署到服务器
# 配置 nginx 或其他 web 服务器
```

## 📝 注意事项

1. **环境变量**: 生产环境需要设置正确的 API URL
2. **HTTPS**: 生产环境建议使用 HTTPS
3. **缓存**: 注意浏览器缓存问题
4. **安全**: 注意 token 安全存储
5. **性能**: 合理使用 API 缓存

## 🎯 下一步

- [ ] 添加更多 API 接口
- [ ] 实现实时数据更新
- [ ] 添加文件上传功能
- [ ] 实现 WebSocket 连接
- [ ] 添加 API 文档 