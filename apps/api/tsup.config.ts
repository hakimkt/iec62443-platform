import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  noExternal: ['@iec62443/database', '@iec62443/shared-types', '@iec62443/shared-schemas', '@iec62443/auth', '@iec62443/config'],
});