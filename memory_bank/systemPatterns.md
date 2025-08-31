# 系统模式 - AI视频服务平台

## 架构概览

### 整体架构

项目采用**模块化AI工具聚合架构**，基于Vue 3的组合式API设计模式，专注于AI视频创作工具的整合。

```
┌─────────────────────────────────────────┐
│              用户界面层                  │
├─────────────────────────────────────────┤
│ Vuetify 3 组件 + AI工具专用组件         │
├─────────────────────────────────────────┤
│              路由层 (Router)            │
├─────────────────────────────────────────┤
│            状态管理层 (Pinia)           │
├─────────────────────────────────────────┤
│           AI模型抽象层 (AI Layer)       │
├─────────────────────────────────────────┤
│          项目资产管理层 (Asset)         │
├─────────────────────────────────────────┤
│            API服务层 (Services)         │
├─────────────────────────────────────────┤
│         AI模型集成层 (Integrations)     │
├─────────────────────────────────────────┤
│        ✅ 代码质量保障层 (Quality)       │
└─────────────────────────────────────────┘
```

## 核心设计模式

### ✅ 1. 代码质量保障模式

- **模式**: 自动化代码质量检查和规范化
- **组件**: ESLint + Prettier + Husky + CommitLint
- **优势**: 确保代码质量一致性，提高团队协作效率

```typescript
// 代码质量保障流程
interface QualityAssurance {
  // 开发时检查
  linting: {
    tool: 'ESLint v9';
    scope: 'Vue 3 + TypeScript + JavaScript';
    rules: 'Vue specific + TypeScript + Best practices';
    autoFix: boolean;
  };

  // 代码格式化
  formatting: {
    tool: 'Prettier';
    scope: 'All source files';
    rules: 'Unified code style';
    integration: 'ESLint + Editor';
  };

  // Git 工作流
  gitWorkflow: {
    preCommit: 'Lint-staged + Auto-fix';
    commitMsg: 'Conventional Commits validation';
    hooks: 'Husky managed';
  };
}

// 开发工作流
class DevelopmentWorkflow {
  async codeCheck(): Promise<void> {
    // 1. ESLint 检查
    await this.runESLint();
    // 2. Prettier 格式化
    await this.formatCode();
    // 3. TypeScript 类型检查
    await this.typeCheck();
  }

  async commit(message: string): Promise<void> {
    // 1. Pre-commit hook
    await this.runLintStaged();
    // 2. Commit message validation
    await this.validateCommitMessage(message);
    // 3. Git commit
    await this.gitCommit(message);
  }
}
```

### 2. AI模型抽象模式

- **模式**: 统一的AI模型接口抽象
- **优势**: 屏蔽不同AI模型的API差异，便于扩展
- **实现**: 每种AI工具类型都有统一的抽象接口

```typescript
// AI模型抽象接口
interface AIModelProvider {
  name: string;
  type: 'text' | 'image' | 'video';
  generate(params: GenerateParams): Promise<GenerateResult>;
  getStatus(): Promise<ModelStatus>;
}

// 文本生成模型实现
class DeepseekProvider implements AIModelProvider {
  name = 'Deepseek';
  type = 'text' as const;

  async generate(params: TextGenerateParams): Promise<TextResult> {
    // Deepseek API调用逻辑
  }
}
```

### 3. 项目化资产管理模式

- **模式**: 以项目为中心的资产组织模式
- **特点**: 所有创作资源按项目分组管理
- **组织**: 支持资产的版本控制和关联关系

```typescript
// 项目资产数据模型
interface Project {
  id: string;
  name: string;
  description: string;
  assets: {
    scripts: Script[];
    images: Image[];
    videos: Video[];
    audios: Audio[];
    creatives: Creative[];
  };
  collaborators: User[];
  createdAt: Date;
  updatedAt: Date;
}

// 资产基础接口
interface Asset {
  id: string;
  projectId: string;
  name: string;
  type: AssetType;
  url: string;
  metadata: Record<string, any>;
  version: number;
  tags: string[];
}
```

### 4. 独立聚合模式

- **模式**: 各AI工具模块独立开发，统一聚合
- **特点**: 模块间不做功能耦合，便于扩展
- **实现**: 每个AI工具都是独立的Vue组件模块

```typescript
// AI工具模块结构
interface AIToolModule {
  name: string;
  component: Component;
  config: ToolConfig;
  providers: AIModelProvider[];
  routes: RouteConfig[];
}

// 工具注册系统
class AIToolRegistry {
  private tools = new Map<string, AIToolModule>();

  register(tool: AIToolModule) {
    this.tools.set(tool.name, tool);
  }

  getTools(): AIToolModule[] {
    return Array.from(this.tools.values());
  }
}
```

## 关键架构决策

### ✅ 1. 代码质量架构

- **ESLint 配置**: 支持 Vue 3 + TypeScript 的完整检查
- **自动化流程**: Git hooks + Lint-staged 的自动化质量控制
- **提交规范**: Conventional Commits 的强制验证

```javascript
// ESLint 配置架构
const eslintConfig = [
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
    },
    rules: {
      // Vue 特定规则
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'warn',

      // TypeScript 规则
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',

      // 基础规则
      'prefer-const': 'warn',
      'no-var': 'error',
    },
  },
];

// Git hooks 配置
const huskyConfig = {
  'pre-commit': 'npx lint-staged',
  'commit-msg': 'npx --no-install commitlint --edit "$1"',
};

// Lint-staged 配置
const lintStagedConfig = {
  '*.{js,mjs,cjs,ts,vue}': ['eslint --fix --quiet', 'prettier --write'],
  '*.{scss,css,md,json}': ['prettier --write'],
};
```

### 2. AI工具模块化设计

- **结构**: 按AI工具类型划分模块
- **独立性**: 每个模块可独立开发和部署
- **扩展性**: 新模型接入只需实现标准接口

```
src/modules/
├── creative/          # 创意策划模块
│   ├── components/    # 组件
│   ├── providers/     # AI模型提供者
│   ├── stores/        # 状态管理
│   └── types/         # 类型定义
├── image/             # 图片生成模块
│   ├── components/
│   ├── providers/     # 即梦、豆包、通义万相
│   └── ...
├── video/             # 视频生成模块
│   ├── components/
│   ├── providers/     # Vidu 2.0、Q1
│   └── ...
└── assets/            # 资产管理模块
```

### 3. 统一配置管理

- **模型配置**: 集中管理所有AI模型的配置
- **环境变量**: 统一的API密钥和配置管理
- **类型安全**: TypeScript接口定义配置结构

```typescript
// AI模型配置
interface AIModelConfig {
  name: string;
  apiKey: string;
  baseURL: string;
  timeout: number;
  rateLimit: {
    requests: number;
    window: number; // 时间窗口（秒）
  };
  features: string[];
}

// 配置管理
export const aiConfig = {
  text: {
    deepseek: {
      name: 'Deepseek',
      apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
      timeout: 30000,
      rateLimit: { requests: 100, window: 3600 },
    },
    doubao: {
      /* 豆包配置 */
    },
    kimi: {
      /* Kimi配置 */
    },
  },
  image: {
    jimeng: {
      /* 即梦配置 */
    },
    doubao: {
      /* 豆包图片配置 */
    },
    tongyi: {
      /* 通义万相配置 */
    },
  },
  video: {
    vidu2: {
      /* Vidu 2.0配置 */
    },
    viduQ1: {
      /* Vidu Q1配置 */
    },
  },
};
```

### 4. 状态管理架构

- **模块化状态**: 每个AI工具模块独立的状态管理
- **全局状态**: 项目、用户、资产的全局状态
- **持久化**: 重要数据的本地持久化

```typescript
// 全局状态结构
interface GlobalState {
  user: UserState;
  projects: ProjectState;
  assets: AssetState;
  ui: UIState;
  quality: QualityState; // ✅ 代码质量状态
}

// AI工具模块状态
interface AIToolState {
  currentModel: string;
  history: GenerationHistory[];
  settings: ToolSettings;
  status: 'idle' | 'generating' | 'error';
}

// ✅ 代码质量状态
interface QualityState {
  eslintStatus: 'passing' | 'failing' | 'checking';
  prettierStatus: 'formatted' | 'needs-formatting';
  commitStatus: 'valid' | 'invalid';
  lastCheck: Date;
}
```

## ✅ 代码质量保障架构

### 1. 静态代码分析架构

```typescript
// ESLint 规则分层
interface ESLintRules {
  base: {
    // 基础 JavaScript 规则
    'prefer-const': 'warn';
    'no-var': 'error';
    'no-unused-vars': 'warn';
  };

  typescript: {
    // TypeScript 特定规则
    '@typescript-eslint/no-unused-vars': 'warn';
    '@typescript-eslint/no-explicit-any': 'warn';
    '@typescript-eslint/no-inferrable-types': 'warn';
  };

  vue: {
    // Vue 特定规则
    'vue/multi-word-component-names': 'off';
    'vue/no-unused-vars': 'warn';
    'vue/component-definition-name-casing': ['warn', 'PascalCase'];
  };
}

// 代码检查流程
class CodeQualityChecker {
  async checkCode(files: string[]): Promise<QualityReport> {
    const eslintResults = await this.runESLint(files);
    const prettierResults = await this.checkPrettier(files);
    const typeResults = await this.runTypeScript(files);

    return {
      eslint: eslintResults,
      prettier: prettierResults,
      typescript: typeResults,
      overall: this.calculateOverallScore(eslintResults, prettierResults, typeResults),
    };
  }
}
```

### 2. Git 工作流架构

```typescript
// Git hooks 管理
interface GitHooksConfig {
  'pre-commit': {
    script: 'npx lint-staged';
    description: '运行代码检查和自动修复';
    failOnError: true;
  };

  'commit-msg': {
    script: 'npx --no-install commitlint --edit "$1"';
    description: '验证提交信息格式';
    rules: 'Conventional Commits';
  };
}

// 提交信息验证
interface CommitLintRules {
  'type-enum': ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'revert', 'build', 'ci'];
  'type-case': 'lower-case';
  'subject-case': 'sentence-case' | 'start-case' | 'pascal-case' | 'upper-case';
  'header-max-length': 72;
}
```

### 3. 自动化质量控制

```typescript
// Lint-staged 配置
interface LintStagedConfig {
  '*.{js,mjs,cjs,ts,vue}': [
    'eslint --fix --quiet', // 自动修复 ESLint 问题
    'prettier --write', // 自动格式化代码
  ];
  '*.{scss,css,md,json}': [
    'prettier --write', // 格式化样式和文档文件
  ];
}

// 质量门禁
class QualityGate {
  async validateCommit(): Promise<boolean> {
    // 1. 运行 lint-staged
    const lintResult = await this.runLintStaged();
    if (!lintResult.success) return false;

    // 2. 检查 TypeScript 类型
    const typeResult = await this.checkTypes();
    if (!typeResult.success) return false;

    // 3. 验证提交信息
    const commitResult = await this.validateCommitMessage();
    if (!commitResult.success) return false;

    return true;
  }
}
```

## 错误处理架构

### 1. AI模型调用错误处理

```typescript
// 统一错误处理
interface AIError {
  code: string;
  message: string;
  model: string;
  timestamp: Date;
  context?: any;
}

class AIErrorHandler {
  handle(error: AIError): void {
    // 记录错误
    this.logError(error);

    // 用户友好提示
    this.showUserMessage(error);

    // 重试机制
    if (this.shouldRetry(error)) {
      this.scheduleRetry(error);
    }
  }
}
```

### 2. 用户体验错误处理

```typescript
// 用户界面错误状态
interface UIErrorState {
  loading: boolean;
  error: string | null;
  retryCount: number;
  canRetry: boolean;
}

// 错误边界组件
class ErrorBoundary extends Vue {
  errorCaptured(error: Error, instance: ComponentInternalInstance, info: string) {
    // 记录错误信息
    console.error('Component error:', error, info);

    // 显示错误页面
    this.showErrorPage(error);

    // 防止错误向上传播
    return false;
  }
}
```

## 性能优化架构

### 1. 代码分割策略

```typescript
// 路由级别代码分割
const routes = [
  {
    path: '/creative',
    component: () => import('@modules/creative/CreativeModule.vue'),
  },
  {
    path: '/image',
    component: () => import('@modules/image/ImageModule.vue'),
  },
  {
    path: '/video',
    component: () => import('@modules/video/VideoModule.vue'),
  },
];

// AI工具按需加载
class AIToolLoader {
  async loadTool(toolName: string): Promise<AIToolModule> {
    switch (toolName) {
      case 'creative':
        return await import('@modules/creative');
      case 'image':
        return await import('@modules/image');
      case 'video':
        return await import('@modules/video');
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }
}
```

### 2. 缓存策略

```typescript
// AI生成结果缓存
interface CacheStrategy {
  text: {
    ttl: 3600; // 1小时
    maxSize: 1000; // 最多1000条记录
  };
  image: {
    ttl: 86400; // 24小时
    maxSize: 100; // 最多100张图片
  };
  video: {
    ttl: 604800; // 7天
    maxSize: 10; // 最多10个视频
  };
}

class ResultCache {
  private cache = new Map<string, CacheItem>();

  set(key: string, value: any, ttl: number): void {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item || item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }
}
```

## 安全架构

### 1. API密钥管理

```typescript
// 环境变量配置
interface APIKeys {
  VITE_DEEPSEEK_API_KEY: string;
  VITE_DOUBAO_API_KEY: string;
  VITE_KIMI_API_KEY: string;
  VITE_JIMENG_API_KEY: string;
  VITE_TONGYI_API_KEY: string;
  VITE_VIDU_API_KEY: string;
}

// 密钥管理器
class APIKeyManager {
  private keys: Map<string, string> = new Map();

  constructor() {
    // 从环境变量加载密钥
    this.loadKeys();
  }

  getKey(provider: string): string {
    const key = this.keys.get(provider);
    if (!key) {
      throw new Error(`API key not found for provider: ${provider}`);
    }
    return key;
  }

  private loadKeys(): void {
    // 安全地加载环境变量
    Object.entries(import.meta.env).forEach(([key, value]) => {
      if (key.startsWith('VITE_') && key.includes('API_KEY')) {
        const provider = this.extractProvider(key);
        this.keys.set(provider, value as string);
      }
    });
  }
}
```

### 2. 数据验证架构

```typescript
// 输入验证
interface ValidationRules {
  text: {
    maxLength: 10000;
    allowedChars: RegExp;
    forbiddenWords: string[];
  };
  image: {
    maxSize: 10 * 1024 * 1024; // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'];
    maxDimensions: { width: 4096, height: 4096 };
  };
  video: {
    maxSize: 100 * 1024 * 1024; // 100MB
    allowedTypes: ['video/mp4', 'video/webm'];
    maxDuration: 300; // 5分钟
  };
}

class InputValidator {
  validateText(input: string): ValidationResult {
    const rules = ValidationRules.text;

    if (input.length > rules.maxLength) {
      return { valid: false, error: 'Text too long' };
    }

    if (!rules.allowedChars.test(input)) {
      return { valid: false, error: 'Invalid characters' };
    }

    return { valid: true };
  }
}
```

## 测试架构

### 1. 单元测试模式

```typescript
// AI模型测试
describe('AIModelProvider', () => {
  let provider: DeepseekProvider;

  beforeEach(() => {
    provider = new DeepseekProvider({
      apiKey: 'test-key',
      baseURL: 'https://test-api.com',
    });
  });

  test('should generate text successfully', async () => {
    const params = { prompt: 'Test prompt' };
    const result = await provider.generate(params);

    expect(result).toBeDefined();
    expect(result.text).toMatch(/\w+/);
  });
});

// 组件测试
describe('CreativeModule', () => {
  test('should render model selection', () => {
    const wrapper = mount(CreativeModule);
    expect(wrapper.find('[data-test="model-selector"]')).toBeTruthy();
  });
});
```

### 2. 集成测试模式

```typescript
// AI工具集成测试
describe('AI Tool Integration', () => {
  test('should complete full creative workflow', async () => {
    // 1. 选择模型
    await selectModel('deepseek');

    // 2. 输入提示词
    await inputPrompt('Generate a creative story');

    // 3. 生成内容
    const result = await generateContent();

    // 4. 验证结果
    expect(result).toBeDefined();
    expect(result.content).toMatch(/story/i);
  });
});
```

这个系统架构确保了AI视频服务平台的技术先进性、可维护性和可扩展性，同时通过完整的代码质量保障体系确保了代码的高质量和一致性。
