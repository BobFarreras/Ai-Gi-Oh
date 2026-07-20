// vitest.config.ts - Configura Vitest para entorno JSDOM, alias y filtros de salida de consola en tests.
import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./setup.ts'],
    globals: true,
    // Se PARTE de los excludes por defecto de Vitest (node_modules, dist, .git…) y se añaden:
    //  - `e2e/**`: specs de Playwright (usan su propio runner; no deben correr en Vitest).
    //  - `.next/**`: build de Next.
    //  - `**/.claude/**`: worktrees y utillería interna de Claude Code. SIN esto, Vitest barría los tests
    //    DUPLICADos del worktree (contaminaba tests por estado compartido) y sus specs e2e de Playwright.
    exclude: [...configDefaults.exclude, 'e2e/**', '.next/**', '**/.claude/**'],
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
