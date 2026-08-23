import { defineConfig } from 'vitest/config';

/**
 * 纯计算核心在 Node 环境中测试，不启动浏览器，也不加载 VitePress 主题。
 *
 * 这样做有两个目的：一是保证工具算法不依赖 DOM 或 Vue 状态；二是让测试
 * 保持快速，后续界面测试可以作为独立层增加，而不会混入数值算法测试。
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
