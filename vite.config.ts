/// <reference types="vitest" />
// Plugins
import vue from '@vitejs/plugin-vue';
import { viteMockServe } from 'vite-plugin-mock';
import vuetify from 'vite-plugin-vuetify';

import AutoImport from 'unplugin-auto-import/vite';

// Utilities
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // https://github.com/vuetifyjs/vuetify-loader/tree/next/packages/vite-plugin
    vuetify({
      autoImport: true,
      styles: { configFile: 'src/styles/variables.scss' },
    }),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia'],
    }),
    viteMockServe({
      mockPath: 'src/mocks',
      enable: false,
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@data': fileURLToPath(new URL('./src/data', import.meta.url)),
    },
    extensions: ['.js', '.json', '.jsx', '.mjs', '.ts', '.tsx', '.vue'],
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    watch: {
      usePolling: true,
    },
    proxy: {
      '/api/': {
        target: 'https://api.zerocut.cn',
        changeOrigin: true,
        followRedirects: true,
      },
      '/api2/': {
        target: 'http://localhost:9527',
        changeOrigin: true,
        followRedirects: true,
        rewrite: path => path.replace(/^\/api2/, '/api'),
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        charset: false,
        api: 'modern-compiler',
        prependData: `@use 'src/styles/main.scss' as *;`,
      },
      css: { charset: false },
    },
  },
});
