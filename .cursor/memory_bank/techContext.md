# 技术上下文 - Lux Admin Vuetify3

## 技术栈概览

### 前端框架
- **Vue 3.4+**: 核心前端框架，使用Composition API和`<script setup>`语法
- **Vuetify 3.6+**: Material Design组件库，提供丰富的UI组件
- **TypeScript**: 类型安全的JavaScript超集

### 构建工具
- **Vite 5.x**: 现代化构建工具，提供快速的开发体验
- **PostCSS**: CSS后处理器
- **Sass**: CSS预处理器

### 状态管理
- **Pinia**: Vue 3推荐的状态管理库
- **pinia-plugin-persist**: Pinia持久化插件

### 路由
- **Vue Router 4**: Vue 3官方路由库

### 国际化
- **Vue-i18n**: Vue国际化解决方案

### UI增强
- **@iconify/vue**: 图标系统
- **@mdi/font**: Material Design Icons
- **flag-icons**: 国旗图标

### 功能库
- **@vueuse/core**: Vue Composition API工具集
- **@vueuse/integrations**: VueUse集成库
- **VueDraggable**: 拖拽功能
- **Vue-Virtual-Scroller**: 虚拟滚动
- **Vue-Masonry-Wall**: 瀑布流布局
- **Vue3-Perfect-Scrollbar**: 滚动条优化

### 图表库
- **ApexCharts + vue3-apexcharts**: 图表组件
- **ECharts + vue-echarts**: 百度图表库

### 富文本编辑
- **@tiptap/vue-3**: 现代富文本编辑器
- **@vueup/vue-quill**: Quill编辑器Vue包装
- **md-editor-v3**: Markdown编辑器

### AI集成
- **openai**: OpenAI API客户端
- **microsoft-cognitiveservices-speech-sdk**: 微软语音服务

### 工具库
- **axios**: HTTP客户端
- **lodash**: JavaScript工具函数库
- **moment**: 时间处理库
- **clipboard**: 剪贴板操作

### 动画
- **vue3-lottie**: Lottie动画
- **@formkit/auto-animate**: 自动动画

### 开发工具
- **@vitejs/plugin-vue**: Vue插件
- **vite-plugin-vuetify**: Vuetify Vite插件
- **unplugin-auto-import**: 自动导入插件
- **autoprefixer**: CSS自动前缀
- **tailwindcss**: 原子化CSS框架

### 测试
- **Vitest**: 测试框架
- **@vitest/ui**: 测试UI界面
- **@vue/test-utils**: Vue测试工具
- **happy-dom**: DOM测试环境

## 开发环境配置

### 项目结构
```
src/
├── api/           # API接口
├── assets/        # 静态资源
├── components/    # 组件
├── configs/       # 配置文件
├── data/          # 数据模块
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

### 构建配置
- **别名配置**: `@` 指向 `src/`, `@data` 指向 `src/data/`
- **自动导入**: Vue, Vue Router, Pinia API自动导入
- **样式配置**: Sass变量文件 `src/styles/variables.scss`
- **代理配置**: 开发环境API代理到 `http://me.yunrobot.cn:7860`

### 环境变量
- `VITE_OPENAI_API_KEY`: OpenAI API密钥
- `VITE_UNSPLASH_ACCESS_KEY`: Unsplash访问密钥
- `VITE_GITHUB_CLIENT_ID`: GitHub客户端ID
- `VITE_TTS_KEY`: 语音服务密钥
- `VITE_TTS_REGION`: 语音服务区域

## 部署配置

### 容器化
- **Docker**: 支持开发和生产环境容器化
- **docker-compose**: 容器编排配置

### 部署平台
- **Netlify**: 支持零配置部署
- **自定义服务器**: 支持Docker部署

## 开发规范

### 代码规范
- 使用TypeScript进行类型检查
- 使用Composition API + `<script setup>`语法
- 组件采用单文件组件(SFC)格式
- 使用Pinia进行状态管理

### 样式规范
- 基于Vuetify 3组件库
- 使用Sass预处理器
- 支持自定义主题变量
- 响应式设计优先

### 性能优化
- 组件懒加载
- 路由懒加载
- 虚拟滚动大数据渲染
- 图片懒加载
- 代码分割

## 第三方服务集成

### AI服务
- **OpenAI**: ChatGPT对话功能
- **Azure TTS**: 文本转语音服务

### 图片服务
- **Unsplash**: 高质量图片API

### 开发工具
- **GitHub**: 代码托管和CI/CD
- **Netlify**: 静态网站部署

## 浏览器支持

### 目标浏览器
- Chrome (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- Edge (最新版本)

### 兼容性考虑
- ES6+ 语法支持
- CSS Grid 和 Flexbox
- 现代JavaScript API
- Service Worker支持 