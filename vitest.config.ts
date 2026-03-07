// vitest.config.ts - Configura Vitest para entorno JSDOM, alias y filtros de salida de consola en tests.
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./setup.ts'],
    globals: true,
    onConsoleLog(log) {
      if (log.includes("THREE.WARNING: Multiple instances of Three.js being imported.")) {
        return false;
      }
      return undefined;
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/core/use-cases/**/*.ts'],
      exclude: ['**/*.test.ts', 'src/core/use-cases/GameEngine.ts', 'src/core/use-cases/game-engine/types.ts'],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 70,
      },
    },
  },
});
