# ZeroCut WorkSpace Frontend

<p align="center">
  <a href="https://vuejs.org/">
    <img src="https://img.shields.io/badge/vue-v3.4.36-brightgreen.svg" alt="vue">
  </a>
  <a href="https://vuetifyjs.com/">
    <img src="https://img.shields.io/badge/vuetify-v3.6.14-blue.svg" alt="vuetify">
  </a>
  <a href="https://vitejs.dev/">
    <img src="https://img.shields.io/badge/vite-v7.1.12-blueviolet.svg" alt="vite">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/typescript-latest-blue.svg" alt="typescript">
  </a>
  <a href="https://github.com/liubei-ai/zerocut-workspace-frontend/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/mashape/apistatus.svg" alt="license">
  </a>
</p>

## 📖 简介

ZeroCut WorkSpace 是一个现代化的工作空间管理平台前端应用，基于 Vue 3 和 Vuetify 3 构建。项目采用最新的前端技术栈，提供优雅的用户界面和强大的功能支持。

## 📚 技术栈

- ⚡️ [Vue 3.4](https://github.com/vuejs/core) - 渐进式 JavaScript 框架
- 🚀 [Vite 7.x](https://github.com/vitejs/vite) - 下一代前端构建工具
- 🎨 [Vuetify 3](https://vuetifyjs.com/) - Material Design 组件框架
- 📘 [TypeScript](https://www.typescriptlang.org/) - 类型安全的 JavaScript 超集
- 📦 组件自动导入 - 提升开发效率
- 🍍 [Pinia](https://pinia.vuejs.org/) - 新一代状态管理
- 🎯 使用新的 `<script setup>` 语法
- 🎭 [Iconify](https://icon-sets.iconify.design/) - 丰富的图标库支持
- 🔐 [Auth0](https://auth0.com/) / [Authing](https://www.authing.cn/) - 身份认证支持
- 📊 数据可视化：Echarts、ApexChart
- 🌍 [vue-i18n](https://vue-i18n.intlify.dev/) - 国际化支持
- 📝 富文本编辑器：Tiptap、Quill、MD Editor
- 📱 响应式设计 - 多平台自适应
- 🐳 Docker 支持 - 容器化部署

## 🔧 主要依赖

### UI 框架
- [Vuetify 3](https://vuetifyjs.com/) - Material Design 组件库

### 工具库
- [@vueuse/core](https://vueuse.org/) - Vue Composition API 实用工具集
- [Axios](https://axios-http.com/) - HTTP 客户端
- [Lodash](https://lodash.com/) - JavaScript 实用工具库
- [Moment.js](https://momentjs.com/) - 日期时间处理

### 开发工具
- [ESLint](https://eslint.org/) - 代码检查
- [Prettier](https://prettier.io/) - 代码格式化
- [Husky](https://typicode.github.io/husky/) - Git hooks
- [Commitlint](https://commitlint.js.org/) - 提交信息规范
- [Vitest](https://vitest.dev/) - 单元测试框架

## 🚀 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 10

### 安装依赖

```bash
git clone https://github.com/liubei-ai/zerocut-workspace-frontend.git

cd zerocut-workspace-frontend

pnpm install
```

### 开发环境运行

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

### 代码规范

```bash
# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 仅检查格式（不修改）
pnpm format:check
```

### 测试

```bash
# 运行测试
pnpm test

# 测试 UI 界面
pnpm test:ui

# 生成测试覆盖率
pnpm coverage
```

## 🐳 Docker 部署

本项目支持 Docker 部署，包含开发和生产两种环境配置。

### 开发环境

构建并启动开发环境：

```bash
docker-compose build dev
docker-compose up dev
```

### 生产环境

构建并启动生产环境：

```bash
docker-compose build app
docker-compose up app
```

## 📁 项目结构

```
zerocut-workspace-frontend/
├── public/              # 静态资源
├── src/
│   ├── api/            # API 接口
│   ├── assets/         # 资源文件
│   ├── components/     # 通用组件
│   ├── configs/        # 配置文件
│   ├── layouts/        # 布局组件
│   ├── locales/        # 国际化语言文件
│   ├── plugins/        # 插件
│   ├── router/         # 路由配置
│   ├── stores/         # Pinia 状态管理
│   ├── styles/         # 样式文件
│   ├── types/          # TypeScript 类型定义
│   ├── utils/          # 工具函数
│   ├── views/          # 页面组件
│   │   ├── admin/      # 管理页面
│   │   ├── auth/       # 认证相关页面
│   │   ├── errors/     # 错误页面
│   │   └── zerocut/    # ZeroCut 功能页面
│   ├── App.vue         # 根组件
│   └── main.ts         # 入口文件
├── .env.template       # 环境变量模板
├── docker-compose.yml  # Docker Compose 配置
├── Dockerfile          # 生产环境 Dockerfile
├── Dockerfile.dev      # 开发环境 Dockerfile
├── vite.config.ts      # Vite 配置
├── tsconfig.json       # TypeScript 配置
└── package.json        # 项目依赖
```

## 📝 License

[MIT License](./LICENSE)

## 🙏 致谢

本项目基于以下优秀开源项目：

- [Vue.js](https://vuejs.org/)
- [Vuetify](https://vuetifyjs.com/)
- [Vite](https://vitejs.dev/)
