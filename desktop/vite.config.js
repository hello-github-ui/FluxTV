import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vite 配置文件
 * 用于构建 FluxTV 桌面应用
 */
export default defineConfig({
  /**
   * 插件配置
   */
  plugins: [
    react(),
  ],

  /**
   * 基础路径
   */
  base: './',

  /**
   * 构建输出目录
   */
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },

  /**
   * 开发服务器配置
   */
  server: {
    port: 5173,
    strictPort: true,
  },

  /**
   * 路径别名配置
   */
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
