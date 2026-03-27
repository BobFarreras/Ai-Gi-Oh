// setup.ts - Configura utilidades globales de testing para Vitest + JSDOM.
import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import React from "react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";

type NextImageLikeProps = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> & {
  src: string | { src: string };
  alt: string;
  fill?: boolean;
  priority?: boolean;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  loader?: unknown;
  unoptimized?: boolean;
  onLoadingComplete?: unknown;
};

/**
 * Sustituye `next/image` por un `img` simple en tests para evitar warnings de
 * configuración de optimización (`qualities`) que no afectan a la lógica.
 */
vi.mock("next/image", () => ({
  default: ({ src, alt, fill, ...rest }: NextImageLikeProps) => {
    const resolvedSrc = typeof src === "string" ? src : src.src;
    const nextRest = rest as Record<string, unknown>;
    delete nextRest.priority;
    delete nextRest.placeholder;
    delete nextRest.blurDataURL;
    delete nextRest.loader;
    delete nextRest.unoptimized;
    delete nextRest.onLoadingComplete;
    const imageProps: React.ImgHTMLAttributes<HTMLImageElement> = fill ? { ...rest, style: { ...(rest.style ?? {}), width: "100%", height: "100%" } } : rest;
    return React.createElement("img", { src: resolvedSrc, alt, ...imageProps });
  },
}));

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
