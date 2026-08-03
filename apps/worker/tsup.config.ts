import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/worker.ts'],
  format: ['esm'],
  noExternal: ['@iec62443/database', '@iec62443/shared-types', '@iec62443/shared-schemas', '@iec62443/config'],
});