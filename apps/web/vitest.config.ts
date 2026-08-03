import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'app/**/*.test.{ts,tsx}'],
    css: true,
    deps: {
      optimizer: {
        web: {
          enabled: true,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@iec62443/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@iec62443/shared-schemas': path.resolve(
        __dirname,
        '../../packages/shared-schemas/src/index.ts',
      ),
      '@iec62443/ui': path.resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@iec62443/api-client': path.resolve(__dirname, '../../packages/api-client/src/index.ts'),
      '@iec62443/auth': path.resolve(__dirname, '../../packages/auth/src/index.ts'),
    },
  },
});
