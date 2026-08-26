import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';

/**
 * 纯计算测试默认运行在 Node 环境，确保算法不依赖 DOM 或 Vue 状态。
 *
 * Vue 组件测试通过文件头的 `@vitest-environment happy-dom` 单独启用轻量 DOM，
 * 既能验证输入、错误和复制等真实交互，又不会让快速的核心算法测试承担
 * 浏览器环境启动成本。Vue 插件只负责把 `.vue` 单文件组件编译给 Vitest。
 */
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
