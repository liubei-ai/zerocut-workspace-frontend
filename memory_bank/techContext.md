# 技术上下文

## 项目概览

**项目名称**: Zerocut 视频Agent管理台  
**项目类型**: 全栈AI视频创作平台  
**架构模式**: 前后端分离 + 微服务化AI集成  
**开发模式**: 敏捷开发，基于DDD领域驱动设计

## 前端技术栈

### 核心框架与构建

- **Vue 3.4+**: 组合式API，完整TypeScript支持，响应式系统优化
- **Vuetify 3.6+**: Material Design 3组件库，主题系统，响应式布局
- **TypeScript 5.x**: 严格类型检查，增强IDE支持，编译时错误检测
- **Vite 5.x**: ESM原生支持，HMR热更新，插件生态丰富
- **Node.js >=20.0.0**: 运行时环境要求
- **pnpm**: 包管理器，磁盘空间优化，依赖去重

### 状态管理与路由

- **Pinia**: 组合式API风格，TypeScript原生支持，DevTools集成
- **pinia-plugin-persistedstate**: 状态持久化，localStorage/sessionStorage支持
- **Vue Router 4**: 动态路由，路由守卫，懒加载支持
- **Vue-i18n 9.x**: 国际化，支持中英日多语言，动态语言切换

### UI组件与交互

- **Vuetify Components**: 完整的Material Design组件集
- **Tiptap**: 现代富文本编辑器，模块化架构，Vue 3集成
- **VueUse**: 组合式API工具集，响应式工具函数
- **@vueuse/core**: 核心组合式函数库

### 网络与工具库

- **Axios 1.x**: HTTP客户端，请求/响应拦截器，错误处理
- **Lodash**: 函数式编程工具，数据处理优化
- **Day.js**: 轻量级日期库，国际化支持
- **EventSource**: 服务器发送事件，实时数据流

## 后端技术栈

### 核心框架

- **Node.js 20 LTS**: 长期支持版本，性能优化，ES模块支持
- **Express.js 4.x**: Web框架，中间件生态，RESTful API
- **TypeScript 5.x**: 后端类型安全，编译时检查

### 数据库与ORM

- **PostgreSQL 17**: 关系型数据库，ACID事务，JSON支持
- **TypeORM 0.3.17+**: ORM框架，装饰器语法，迁移管理
- **Redis 7.x**: 缓存数据库，会话存储，消息队列

### 认证与安全

- **JWT**: 无状态认证，跨域支持
- **bcrypt**: 密码哈希，安全加密
- **express-session**: 会话管理
- **Joi**: 数据验证，请求参数校验

### 开发工具与监控

- **Swagger/OpenAPI**: API文档自动生成
- **Winston**: 日志管理，多级别日志
- **Prometheus**: 监控指标收集
- **Grafana**: 监控数据可视化
- **Jest**: 单元测试框架

### ✅ 代码质量和开发工具

- **ESLint v9**: 代码质量检查工具，支持 Vue 3 + TypeScript
- **Prettier**: 代码格式化工具
- **Husky**: Git hooks 管理工具
- **@commitlint/cli**: Git 提交信息规范检查
- **lint-staged**: 暂存文件代码检查工具
- **vue-eslint-parser**: Vue 文件解析器
- **@typescript-eslint/parser**: TypeScript 解析器
- **@eslint/js**: ESLint JavaScript 配置

### AI模型集成

#### 文本生成模型

- **Deepseek API**: 创意策划文本生成
- **豆包 API**: 多场景文本生成
- **Kimi API**: 长文本处理和生成

#### 图片生成模型

- **即梦 API**: 高质量图片生成
- **豆包图片 API**: 多样化图片生成
- **通义万相 API**: 阿里云图片生成服务

#### 视频生成模型

- **Vidu 2.0 API**: 高质量视频生成
- **Vidu Q1 API**: 快速视频生成

### 文件处理

- **axios**: HTTP客户端，用于API调用
- **lodash**: JavaScript工具函数库
- **moment**: 时间处理库
- **clipboard**: 剪贴板操作

### 开发工具

- **@vitejs/plugin-vue**: Vue插件
- **vite-plugin-vuetify**: Vuetify Vite插件
- **unplugin-auto-import**: 自动导入插件
- **autoprefixer**: CSS自动前缀

### 测试

- **Vitest**: 测试框架
- **@vitest/ui**: 测试UI界面
- **@vue/test-utils**: Vue测试工具
- **happy-dom**: DOM测试环境

## ✅ Pinia状态持久化配置

### 持久化插件配置 (main.ts)

```typescript
// 导入持久化插件
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

// 创建Pinia实例并应用插件
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
```

### Store持久化配置示例

```typescript
// 标准持久化配置（推荐）
export const useMyStore = defineStore('myStore', {
  state: () => ({
    /* 状态 */
  }),

  persist: {
    storage: localStorage, // 存储方式，可选 localStorage 或 sessionStorage
    pick: ['user', 'settings'], // 需要持久化的状态字段
  },

  // getters, actions...
});

// 旧的ID格式也兼容（但推荐使用字符串ID）
export const useAnotherStore = defineStore({
  id: 'anotherStore',
  state: () => ({
    /* ... */
  }),

  persist: {
    storage: localStorage,
    pick: ['selectedItems'],
  },
});
```

## ✅ 代码质量保障配置

### ESLint 配置 (eslint.config.js)

```typescript
// ESLint v9 配置，支持 Vue 3 + TypeScript
const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');
const vue = require('eslint-plugin-vue');
const vueParser = require('vue-eslint-parser');

module.exports = [
  js.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        /* 全局变量配置 */
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      vue,
    },
    rules: {
      // Vue 规则
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'warn',
      'vue/component-definition-name-casing': ['warn', 'PascalCase'],

      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',

      // 基础规则
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },
];
```

### Prettier 配置 (.prettierrc)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "vueIndentScriptAndStyle": false
}
```

### CommitLint 配置 (commitlint.config.js)

```javascript
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert', 'build', 'ci'],
    ],
    'type-case': [2, 'always', 'lower-case'],
    'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
    'header-max-length': [2, 'always', 72],
  },
};
```

### Husky 配置

```bash
# .husky/pre-commit
npx lint-staged

# .husky/commit-msg
npx --no-install commitlint --edit "$1"
```

### Lint-staged 配置 (package.json)

```json
{
  "lint-staged": {
    "*.{js,mjs,cjs,ts,vue}": ["eslint --fix --quiet", "prettier --write"],
    "*.{scss,css,md,json}": ["prettier --write"]
  }
}
```

### 开发脚本 (package.json)

```json
{
  "scripts": {
    "lint": "eslint \"src/**/*.{js,mjs,cjs,ts,vue}\" --fix",
    "lint:check": "eslint \"src/**/*.{js,mjs,cjs,ts,vue}\"",
    "format": "prettier --write \"src/**/*.{js,ts,vue,scss,css}\"",
    "format:check": "prettier --check \"src/**/*.{js,ts,vue,scss,css}\"",
    "prepare": "husky"
  }
}
```

## 开发环境配置

### 项目结构

```
src/
├── api/           # API接口
├── assets/        # 静态资源
├── components/    # 通用组件
├── modules/       # AI工具模块
│   ├── creative/  # 创意策划模块
│   ├── image/     # 图片生成模块
│   ├── video/     # 视频生成模块
│   └── assets/    # 资产管理模块
├── configs/       # 配置文件
├── hooks/         # 组合式函数
├── layouts/       # 布局组件
├── locales/       # 国际化文件
├── plugins/       # 插件配置
├── router/        # 路由配置
├── stores/        # 状态管理
├── styles/        # 样式文件
├── types/         # TypeScript类型
├── utils/         # 工具函数
├── views/         # 页面组件
├── App.vue        # 根组件
└── main.ts        # 入口文件
```

### AI模型配置

- **环境变量管理**: 所有AI模型的API密钥通过环境变量管理
- **配置抽象**: 统一的AI模型配置接口
- **错误处理**: 统一的AI模型调用错误处理

### 构建配置

- **别名配置**: `@` 指向 `src/`, `@modules` 指向 `src/modules/`
- **自动导入**: Vue, Vue Router, Pinia API自动导入
- **样式配置**: Sass变量文件 `src/styles/variables.scss`
- **代理配置**: 开发环境API代理配置

### 环境变量

#### AI模型API密钥

- `VITE_DEEPSEEK_API_KEY`: Deepseek API密钥
- `VITE_DOUBAO_API_KEY`: 豆包API密钥
- `VITE_KIMI_API_KEY`: Kimi API密钥
- `VITE_JIMENG_API_KEY`: 即梦API密钥
- `VITE_TONGYI_API_KEY`: 通义万相API密钥
- `VITE_VIDU_API_KEY`: Vidu API密钥

#### 服务配置

- `VITE_API_BASE_URL`: 后端API基础URL
- `VITE_UPLOAD_BASE_URL`: 文件上传服务URL
- `VITE_CDN_BASE_URL`: CDN资源基础URL

## AI模型技术规范

### 文本生成模型集成

#### Deepseek集成

```typescript
interface DeepseekConfig {
  apiKey: string;
  baseURL: 'https://api.deepseek.com';
  model: 'deepseek-chat';
  maxTokens: number;
  temperature: number;
}
```

#### 豆包集成

```typescript
interface DoubaoConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  parameters: {
    temperature: number;
    top_p: number;
    max_tokens: number;
  };
}
```

#### Kimi集成

```typescript
interface KimiConfig {
  apiKey: string;
  baseURL: string;
  model: 'moonshot-v1-8k' | 'moonshot-v1-32k' | 'moonshot-v1-128k';
  maxTokens: number;
}
```

### 图片生成模型集成

#### 即梦集成

```typescript
interface JimengConfig {
  apiKey: string;
  baseURL: string;
  parameters: {
    prompt: string;
    negative_prompt?: string;
    width: number;
    height: number;
    steps: number;
    cfg_scale: number;
  };
}
```

#### 通义万相集成

```typescript
interface TongyiConfig {
  apiKey: string;
  baseURL: string;
  model: 'wanx-v1';
  parameters: {
    prompt: string;
    size: '1024*1024' | '720*1280' | '1280*720';
    n: number;
  };
}
```

### 视频生成模型集成

#### Vidu集成

```typescript
interface ViduConfig {
  apiKey: string;
  baseURL: string;
  model: 'vidu-2.0' | 'vidu-q1';
  parameters: {
    prompt: string;
    duration: number;
    width: number;
    height: number;
    fps: number;
  };
}
```

## ✅ 开发工作流

### 日常开发流程

1. **代码编写**: 使用 TypeScript + Vue 3 Composition API
2. **代码检查**: `pnpm run lint:check` 检查代码风格
3. **自动修复**: `pnpm run lint` 自动修复可修复的问题
4. **代码格式化**: `pnpm run format` 格式化代码
5. **提交代码**: 使用 Conventional Commits 格式

### Git 提交规范

```bash
# 功能开发
git commit -m "feat: add user authentication module"
git commit -m "feat(auth): implement login functionality"

# Bug 修复
git commit -m "fix: resolve routing issue in navigation"
git commit -m "fix(api): handle timeout errors properly"

# 文档更新
git commit -m "docs: update API documentation"
git commit -m "docs(readme): add installation instructions"

# 代码重构
git commit -m "refactor: optimize component structure"
git commit -m "refactor(store): simplify state management"

# 性能优化
git commit -m "perf: improve image loading performance"

# 测试相关
git commit -m "test: add unit tests for auth service"

# 构建和配置
git commit -m "build: update dependencies"
git commit -m "chore: configure eslint rules"
```

### 代码质量检查流程

1. **Pre-commit Hook**: 自动运行 lint-staged
   - 检查暂存文件的代码风格
   - 自动修复可修复的问题
   - 格式化代码
2. **Commit-msg Hook**: 验证提交信息格式
   - 确保遵循 Conventional Commits 规范
   - 拒绝不符合规范的提交信息

### 开发最佳实践

1. **类型安全**: 所有组件和函数都要有完整的 TypeScript 类型定义
2. **组件设计**: 使用 `<script setup>` 语法和 Composition API
3. **代码风格**: 遵循 ESLint 和 Prettier 配置
4. **提交规范**: 使用 Conventional Commits 格式
5. **模块化**: AI 工具模块保持独立，便于扩展
6. **错误处理**: 统一的错误处理机制
7. **性能优化**: 考虑大文件处理和 AI 模型调用性能

## 技术约束

### 浏览器支持

- **现代浏览器**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **移动端**: iOS Safari 14+, Chrome Mobile 90+

### 性能要求

- **首屏加载**: < 3秒
- **AI模型响应**: < 30秒
- **文件上传**: 支持大文件分片上传
- **内存使用**: 合理的内存管理，避免内存泄漏

### 安全要求

- **API密钥**: 通过环境变量管理，不暴露在客户端
- **文件上传**: 文件类型和大小限制
- **用户数据**: 合规的数据处理和存储
- **XSS防护**: 输入验证和输出转义

### 开发约束

- **TypeScript**: 强制类型安全，不允许 `any` 类型滥用
- **代码质量**: 所有代码必须通过 ESLint 检查
- **提交规范**: 强制使用 Conventional Commits 格式
- **模块化**: AI 工具模块独立，避免功能耦合
- **文档**: 重要功能和 API 要有完整文档

## 部署配置

### 构建优化

- **代码分割**: 按路由和模块进行代码分割
- **资源压缩**: CSS、JS、图片资源压缩
- **缓存策略**: 合理的浏览器缓存配置
- **CDN**: 静态资源 CDN 分发

### 环境配置

- **开发环境**: 热重载、详细错误信息、开发工具
- **测试环境**: 接近生产的配置，用于功能测试
- **生产环境**: 性能优化、错误监控、日志收集

### 监控和日志

- **错误监控**: 前端错误收集和报告
- **性能监控**: 页面加载和交互性能监控
- **用户行为**: 用户操作和使用情况分析
- **AI模型调用**: API 调用成功率和响应时间监控

这个技术栈配置确保了AI视频服务平台的技术先进性、可扩展性和稳定性，同时为各种AI模型的集成提供了统一的技术基础。
