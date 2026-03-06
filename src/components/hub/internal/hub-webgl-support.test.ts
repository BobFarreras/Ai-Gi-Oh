// src/components/hub/internal/hub-webgl-support.test.ts - Verifica el detector de soporte WebGL del hub.
import { describe, expect, it, vi } from "vitest";
import { supportsWebGL } from "./hub-webgl-support";

describe("hub-webgl-support", () => {
  it("devuelve false si el canvas no expone contexto WebGL", () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    expect(supportsWebGL()).toBe(false);
    spy.mockRestore();
  });

  it("devuelve true si existe al menos un contexto WebGL", () => {
    const fakeContext = {} as RenderingContext;
    const spy = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((type: string) => {
      if (type === "webgl") return fakeContext;
      return null;
    });
    expect(supportsWebGL()).toBe(true);
    spy.mockRestore();
  });
});
