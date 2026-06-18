// src/components/hub/multiplayer/internal/avatar-color.test.ts - Tests puros de derivación de colores y iniciales de avatar.
import { describe, expect, it } from "vitest";
import { getAvatarGradientClasses, getAvatarInitial } from "./avatar-color";

describe("getAvatarGradientClasses", () => {
  it("es determinista: mismo id → mismo gradiente", () => {
    const a = getAvatarGradientClasses("player-123");
    const b = getAvatarGradientClasses("player-123");
    expect(a).toEqual(b);
  });

  it("devuelve clases from-* y to-* válidas", () => {
    const { from, to } = getAvatarGradientClasses("abc");
    expect(from).toMatch(/^from-/);
    expect(to).toMatch(/^to-/);
  });

  it("ids distintos pueden (no necesariamente) dar gradientes distintos", () => {
    const ids = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const gradients = new Set(ids.map((id) => getAvatarGradientClasses(id).from));
    // Con 8 ids y 8 gradientes, es extremadamente improbable que todos colisionen.
    expect(gradients.size).toBeGreaterThan(1);
  });

  it("funciona con id vacío sin lanzar", () => {
    const { from, to } = getAvatarGradientClasses("");
    expect(from).toMatch(/^from-/);
    expect(to).toMatch(/^to-/);
  });
});

describe("getAvatarInitial", () => {
  it("devuelve la inicial en mayúscula", () => {
    expect(getAvatarInitial("aria")).toBe("A");
    expect(getAvatarInitial("Zephyr")).toBe("Z");
  });

  it("devuelve ? para nickname vacío o solo espacios", () => {
    expect(getAvatarInitial("")).toBe("?");
    expect(getAvatarInitial("   ")).toBe("?");
  });

  it("recorta espacios antes de tomar la inicial", () => {
    expect(getAvatarInitial("  noctis")).toBe("N");
  });
});
