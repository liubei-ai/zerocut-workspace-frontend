# 技术上下文 - AI视频服务平台

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

### 功能库
- **@vueuse/core**: Vue Composition API工具集
- **@vueuse/integrations**: VueUse集成库
- **VueDraggable**: 拖拽功能（资产管理）
- **Vue3-Perfect-Scrollbar**: 滚动条优化

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
    prompt?: string;
    image?: string;
    duration: number;
    aspect_ratio: '16:9' | '9:16' | '1:1';
    fps: 24 | 30;
  };
}
```

## 数据管理

### 项目数据模型
```typescript
interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  assets: {
    creatives: Creative[];
    images: GeneratedImage[];
    videos: GeneratedVideo[];
    scripts: Script[];
    audios: Audio[];
  };
  settings: ProjectSettings;
  collaborators: Collaborator[];
  createdAt: Date;
  updatedAt: Date;
}
```

### 资产数据模型
```typescript
interface Asset {
  id: string;
  projectId: string;
  name: string;
  type: 'creative' | 'image' | 'video' | 'script' | 'audio';
  url?: string;
  content?: string;
  metadata: {
    model: string;
    parameters: Record<string, any>;
    generatedAt: Date;
    fileSize?: number;
    duration?: number;
    dimensions?: { width: number; height: number };
  };
  tags: string[];
  version: number;
}
```

## 部署配置

### 容器化
- **Docker**: 支持开发和生产环境容器化
- **docker-compose**: 容器编排配置
- **多阶段构建**: 优化生产镜像大小

### 部署平台
- **Netlify**: 支持零配置部署
- **Vercel**: 现代化部署平台
- **自定义服务器**: 支持Docker部署

### CDN配置
- **静态资源**: 图片、视频等资产CDN加速
- **API缓存**: 合理的API响应缓存策略
- **文件上传**: 大文件分片上传支持

## 开发规范

### 代码规范
- 使用TypeScript进行类型检查
- 使用Composition API + `<script setup>`语法
- 组件采用单文件组件(SFC)格式
- AI工具模块独立开发，避免耦合

### AI模型集成规范
- 统一的模型适配器接口
- 标准化的错误处理机制
- 一致的参数配置格式
- 完善的类型定义

### 样式规范
- 基于Vuetify 3组件库
- 使用Sass预处理器
- 支持自定义主题变量
- 响应式设计优先

### 性能优化
- AI工具组件懒加载
- 大文件分片上传
- 结果缓存机制
- 请求队列管理

## 安全考虑

### API安全
- API密钥环境变量管理
- 请求频率限制
- 错误信息脱敏
- HTTPS强制使用

### 数据安全
- 用户数据加密存储
- 文件上传安全检查
- 访问权限控制
- 审计日志记录

## 监控和调试

### 性能监控
- AI模型调用响应时间
- 文件上传下载速度
- 页面加载性能
- 内存使用情况

### 错误监控
- AI模型调用失败率
- 文件处理错误
- 用户操作异常
- 系统运行状态

### 日志管理
- 结构化日志格式
- 分级日志记录
- 日志聚合分析
- 实时告警机制

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
- File API支持（大文件上传）
- WebRTC支持（实时协作功能）

## 第三方服务依赖

### AI服务提供商
- **Deepseek**: 文本生成服务
- **豆包**: 文本和图片生成服务
- **Kimi**: 长文本处理服务
- **即梦**: 图片生成服务
- **通义万相**: 阿里云AI服务
- **Vidu**: 视频生成服务

### 基础设施服务
- **CDN**: 静态资源加速
- **对象存储**: 文件存储服务
- **数据库**: 项目和用户数据存储
- **缓存**: Redis缓存服务

这个技术栈配置确保了AI视频服务平台的技术先进性、可扩展性和稳定性，同时为各种AI模型的集成提供了统一的技术基础。 