// setup.ts - Configura utilidades globales de testing para Vitest + JSDOM.
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

const originalWarn = console.warn;
const originalError = console.error;
const mockPlay = () => Promise.resolve();
const mockPause = () => {};

beforeAll(() => {
  // Evita ruido de JSDOM por métodos multimedia no implementados.
  Object.defineProperty(HTMLMediaElement.prototype, "play", {
    configurable: true,
    writable: true,
    value: mockPlay,
  });
  Object.defineProperty(HTMLMediaElement.prototype, "pause", {
    configurable: true,
    writable: true,
    value: mockPause,
  });
  // Silencia un warning conocido de Three.js en entorno de test.
  const ignoreKnownThreeWarning = (firstArg: unknown) =>
    typeof firstArg === "string" && firstArg.includes("THREE.WARNING: Multiple instances of Three.js being imported.");

  console.warn = (...args: unknown[]) => {
    const firstArg = args[0];
    if (ignoreKnownThreeWarning(firstArg)) {
      return;
    }
    originalWarn(...args);
  };
  console.error = (...args: unknown[]) => {
    const firstArg = args[0];
    if (ignoreKnownThreeWarning(firstArg)) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Limpia el DOM después de cada test para evitar interferencias.
afterEach(() => {
  cleanup();
});
