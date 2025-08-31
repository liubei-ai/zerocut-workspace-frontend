## 登录认证方案（2025-06-16）

### 1. 背景与目标

- 项目采用服务端 httpOnly Cookie 存储登录态，前端无法直接访问 token。
- 需兼容刷新、跨标签页、提升安全性，前端登录态判断依赖服务端接口。
- 登录表单字段为 username + password，接口遵循统一泛型响应结构。

### 2. 技术实现方案

#### 2.1 API 设计

- 所有接口响应结构统一为泛型 ApiResponse<T>：
  ```ts
  export interface ApiResponse<T = any> {
    code: number;
    message: string;
    data: T;
    timestamp: string;
  }
  ```
- 登录接口：POST /user/login，参数 { username, password }，成功后服务端写入 httpOnly Cookie。
- 新增 /user/me（或 /user/status）接口，前端用于校验当前登录态。

#### 2.2 Pinia Store

- loginWithUsernameAndPassword 调用 login API，登录成功后跳转 dashboard 并调用 fetchCurrentUser 拉取用户信息。
- fetchCurrentUser 调用 /user/me，成功则设置 isLoggedIn/user，失败则清空状态。
- 登出时调用服务端 logout，前端清空 Pinia 状态。

#### 2.3 路由守卫

- 全局前置守卫：
  - 访问需要登录的页面时，优先判断 Pinia 的 isLoggedIn/user。
  - 若未登录，则调用 fetchCurrentUser 校验。
  - 校验失败则跳转登录页。
- 登录成功后自动跳转 dashboard。

#### 2.4 登录页面（SigninPage.vue）

- 表单字段为 username + password，校验规则为必填、长度限制。
- 调用 store 的 loginWithUsernameAndPassword，处理 loading、错误提示。
- 支持国际化、移动端适配。

#### 2.5 代码结构建议

- src/api/authApi.ts：API 封装，类型安全。
- src/stores/authStore.ts：Pinia store，统一管理登录态。
- src/views/auth/SigninPage.vue：登录表单，UI 交互。
- src/types/api.ts：ApiResponse 泛型定义。
- 路由守卫逻辑在 src/router/index.ts。

### 3. 方案优势

- 安全性高，token 不暴露在前端。
- 刷新/多标签页自动同步登录态。
- 统一接口响应结构，便于维护和扩展。
- 兼容 SSR/多端。

### 4. 后续建议

- 可扩展二步验证、验证码等安全措施。
- 可根据业务需求扩展用户信息结构。
