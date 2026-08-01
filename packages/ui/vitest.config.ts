import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    css: true,
  },
  resolve: {
    alias: {
      '@iec62443/shared-types': path.resolve(__dirname, '../shared-types/src/index.ts'),
    },
  },
});
