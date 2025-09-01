import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import vue from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';

export default [
  // JavaScript 基础配置
  js.configs.recommended,

  // Vue 3 基础配置
  ...vue.configs['flat/recommended'],

  // 通用配置
  {
    files: ['**/*.{js,mjs,cjs,ts,vue}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        console: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        FormData: 'readonly',
        File: 'readonly',
        Blob: 'readonly',
        FileReader: 'readonly',
        Element: 'readonly',
        HTMLElement: 'readonly',
        Event: 'readonly',
        EventTarget: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',

        // Node.js globals
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        global: 'readonly',

        // Vue 3 Composition API globals
        ref: 'readonly',
        reactive: 'readonly',
        computed: 'readonly',
        watch: 'readonly',
        watchEffect: 'readonly',
        onMounted: 'readonly',
        onUnmounted: 'readonly',
        onUpdated: 'readonly',
        onBeforeMount: 'readonly',
        onBeforeUnmount: 'readonly',
        onBeforeUpdate: 'readonly',
        nextTick: 'readonly',
        defineProps: 'readonly',
        defineEmits: 'readonly',
        defineExpose: 'readonly',
        withDefaults: 'readonly',
        toRef: 'readonly',
        toRefs: 'readonly',
        unref: 'readonly',
        isRef: 'readonly',

        // Vue Router globals
        useRoute: 'readonly',
        useRouter: 'readonly',
        useLink: 'readonly',
        onBeforeRouteLeave: 'readonly',
        onBeforeRouteUpdate: 'readonly',

        // Pinia globals
        defineStore: 'readonly',
        storeToRefs: 'readonly',
        acceptHMRUpdate: 'readonly',

        // Vitest globals
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      // 基础规则
      'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
      'prefer-const': 'warn',
      'no-var': 'error',
      'no-unused-vars': 'warn',
      'no-undef': 'warn', // 将未定义变量改为警告

      // Vue 规则
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'vue/component-definition-name-casing': ['warn', 'PascalCase'],
      'vue/component-name-in-template-casing': ['warn', 'PascalCase'],
      'vue/prop-name-casing': ['warn', 'camelCase'],
      'vue/attribute-hyphenation': 'off', // 允许连字符属性名
      'vue/v-on-event-hyphenation': 'off', // 允许连字符事件名
      'vue/html-self-closing': [
        'warn',
        {
          html: {
            void: 'never',
            normal: 'any',
            component: 'any',
          },
          svg: 'always',
          math: 'always',
        },
      ],
      'vue/max-attributes-per-line': [
        'warn',
        {
          singleline: {
            max: 5,
          },
          multiline: {
            max: 1,
          },
        },
      ],
      'vue/html-indent': ['warn', 2],
      'vue/script-indent': ['warn', 2, { baseIndent: 0 }],
      'vue/singleline-html-element-content-newline': 'off',
      'vue/multiline-html-element-content-newline': 'off',
      'vue/html-closing-bracket-newline': 'off',
      'vue/attributes-order': 'off',
      'vue/v-slot-style': 'off',
      'vue/valid-v-for': 'warn',
      'vue/require-v-for-key': 'warn',
      'vue/return-in-computed-property': 'warn',
      'vue/require-explicit-emits': 'off',
      'vue/no-template-shadow': 'off',
      'vue/no-v-html': 'off',
      'vue/no-v-text-v-html-on-component': 'off',
      'vue/valid-v-slot': 'warn',
      'vue/no-required-prop-with-default': 'warn',
      'vue/no-mutating-props': 'warn',
      'vue/valid-v-on': 'warn',
      'vue/require-default-prop': 'off',
    },
  },

  // Vue 文件特殊配置
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: typescriptParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript 规则（在 Vue 文件中）
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',

      // 覆盖基础规则，使用 TypeScript 版本
      'no-unused-vars': 'off', // 使用 @typescript-eslint/no-unused-vars 代替
    },
  },

  // TypeScript 文件配置
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
    },
    rules: {
      // TypeScript 特定规则
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-inferrable-types': 'warn',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',

      // 覆盖基础规则
      'no-unused-vars': 'off',
      'prefer-const': 'off',
      'no-undef': 'off', // TypeScript 会处理这个
    },
  },

  // 忽略配置
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.husky/**',
      '*.config.js',
      '*.config.ts',
      'auto-imports.d.ts',
      'components.d.ts',
      'vite-env.d.ts',
      'coverage/**',
      '.vscode/**',
      '.idea/**',
      '*.min.js',
      '*.min.css',
    ],
  },
];
