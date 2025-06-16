# ToolbarUser 组件更新文档

## 更新概述

已将 `ToolbarUser` 组件从显示固定用户信息更新为显示实际登录用户的信息。

## 主要改进

### 1. 动态用户信息显示
- ✅ 显示实际登录用户的用户名
- ✅ 根据用户名生成邮箱地址（临时方案）
- ✅ 支持用户头像或首字母头像
- ✅ 区分登录和未登录状态

### 2. 头像系统
- **有头像**: 显示用户实际头像
- **无头像**: 显示用户名首字母的彩色头像
- **未登录**: 显示 "G" (Guest) 灰色头像
- **已登录但无用户名**: 显示 "U" (User) 头像

### 3. 用户信息逻辑

#### 用户名显示
```typescript
const userName = computed(() => {
  if (!isAuthenticated.value) return "Guest";
  return authStore.userName || "Unknown User";
});
```

#### 邮箱显示
```typescript
const userEmail = computed(() => {
  if (!isAuthenticated.value) return "Please login";
  return currentUser.value?.username
    ? `${currentUser.value.username}@example.com`
    : "No email";
});
```

#### 头像首字母
```typescript
const userInitials = computed(() => {
  const name = userName.value;
  if (name && name !== "Guest" && name !== "Unknown User") {
    return name.charAt(0).toUpperCase();
  }
  return isAuthenticated.value ? "U" : "G";
});
```

## 显示效果

### 登录状态
- **用户名**: 显示实际用户名（如：admin）
- **邮箱**: 显示生成的邮箱（如：admin@example.com）
- **头像**: 显示用户名首字母（如：A）或实际头像

### 未登录状态
- **用户名**: Guest
- **邮箱**: Please login
- **头像**: G (Guest)

## 国际化支持

- ✅ 登出按钮使用 `$t('menu.logout')` 翻译
- ✅ 支持中英日三语言切换

## 响应式设计

- ✅ 自动响应用户登录状态变化
- ✅ 实时更新用户信息显示
- ✅ 支持用户信息变更后的自动刷新

## 使用方法

组件会自动从 `authStore` 获取用户信息：

```vue
<template>
  <ToolbarUser />
</template>
```

无需传递任何 props，组件会自动：
1. 检测用户登录状态
2. 获取用户信息
3. 显示相应的用户界面
4. 处理登出操作

## 后续优化建议

1. **完善用户类型**
   - 添加 email 字段到 User 接口
   - 添加 avatar 字段支持真实头像
   - 添加 name 字段支持显示名称

2. **增强功能**
   - 添加用户状态指示器
   - 支持用户资料快速编辑
   - 添加最近活动显示

3. **性能优化**
   - 添加用户信息缓存
   - 优化头像加载逻辑
   - 减少不必要的重新渲染

## 测试建议

1. **登录测试**
   - 使用 admin/123456 登录
   - 检查用户名是否正确显示
   - 验证头像首字母是否为 "A"

2. **登出测试**
   - 点击登出按钮
   - 检查是否显示 Guest 状态
   - 验证头像是否变为 "G"

3. **多语言测试**
   - 切换语言
   - 检查登出按钮翻译是否正确 