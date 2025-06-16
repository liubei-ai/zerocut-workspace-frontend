# 登录功能实现文档

## 概述

本项目已实现基于 httpOnly Cookie 的安全登录认证系统，符合现代 Web 应用的安全最佳实践。

## 技术架构

### 1. API 层
- **位置**: `src/api/`
- **文件**:
  - `client.ts` - 统一的 HTTP 客户端配置
  - `authApi.ts` - 认证相关 API 接口
  - `types/api.ts` - API 类型定义

### 2. 状态管理
- **位置**: `src/stores/authStore.ts`
- **功能**:
  - 用户登录状态管理
  - 用户信息存储
  - 错误处理
  - 持久化存储

### 3. 路由守卫
- **位置**: `src/router/index.ts`
- **功能**:
  - 自动验证用户登录状态
  - 保护需要认证的路由
  - 处理登录重定向

### 4. 用户界面
- **位置**: `src/views/auth/SigninPage.vue`
- **功能**:
  - 用户名/密码登录表单
  - 表单验证
  - 错误提示
  - 国际化支持

## 主要特性

### 安全性
- ✅ httpOnly Cookie 存储认证信息
- ✅ 前端无法直接访问 token
- ✅ 自动处理跨站请求伪造(CSRF)保护
- ✅ 统一的错误处理机制

### 用户体验
- ✅ 自动登录状态检查
- ✅ 页面刷新后保持登录状态
- ✅ 多标签页同步登录状态
- ✅ 友好的错误提示
- ✅ 支持登录重定向

### 开发体验
- ✅ TypeScript 类型安全
- ✅ 统一的 API 响应结构
- ✅ 清晰的代码组织
- ✅ 完整的错误处理

## API 接口

### 登录接口
```typescript
POST /user/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

### 用户状态检查
```typescript
GET /user/me
// 或
GET /user/status
```

### 登出接口
```typescript
POST /user/logout
```

## 使用方法

### 1. 登录
```typescript
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()

// 登录
const success = await authStore.loginWithUsernameAndPassword('admin', '123456')
if (success) {
  // 登录成功，自动跳转到 dashboard
} else {
  // 登录失败，错误信息在 authStore.error 中
}
```

### 2. 检查登录状态
```typescript
// 检查本地状态
if (authStore.isAuthenticated) {
  // 用户已登录
}

// 从服务器验证状态
const isValid = await authStore.fetchCurrentUser()
```

### 3. 登出
```typescript
await authStore.logout()
// 自动清除状态并跳转到登录页
```

## 配置说明

### 环境变量
```bash
# API 基础地址
VITE_API_BASE_URL=http://localhost:3000/api
```

### 路由配置
需要认证的路由需要添加 `requiresAuth: true` 元数据：

```typescript
{
  path: '/dashboard',
  meta: {
    requiresAuth: true
  },
  component: () => import('@/views/Dashboard.vue')
}
```

## 国际化

支持中文、英文、日文三种语言：

```typescript
// 英文
login: {
  username: "Username",
  password: "Password",
  button: "Sign In"
}

// 中文
login: {
  username: "用户名",
  password: "密码", 
  button: "登录"
}

// 日文
login: {
  username: "ユーザー名",
  password: "パスワード",
  button: "サインイン"
}
```

## 错误处理

系统提供统一的错误处理机制：

- **401**: 用户名或密码错误
- **403**: 访问被拒绝
- **0**: 网络错误
- **其他**: 通用错误信息

## 开发注意事项

1. **服务端要求**:
   - 必须支持 httpOnly Cookie
   - 必须返回统一的 ApiResponse 格式
   - 必须正确处理 CORS 和 credentials

2. **前端开发**:
   - 使用 `authStore.isAuthenticated` 检查登录状态
   - 在组件中使用 `authStore.loading` 显示加载状态
   - 使用 `authStore.error` 显示错误信息

3. **测试**:
   - 默认测试账号: admin / 123456
   - 可以通过修改 SigninPage.vue 中的默认值进行测试

## 后续扩展

- [ ] 密码重置功能
- [ ] 双因素认证
- [ ] OAuth 第三方登录
- [ ] 记住我功能
- [ ] 登录历史记录 