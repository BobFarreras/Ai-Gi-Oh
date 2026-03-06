// src/components/game/board/battlefield/internal/entity-motion.test.ts - Verifica que las cartas ocultas no muestren frente durante entrada al tablero.
import { describe, expect, it } from "vitest";
import { resolveEntityMotionState } from "./entity-motion";

describe("resolveEntityMotionState", () => {
  it("debería iniciar y animar SET boca abajo sin flash frontal", () => {
    const result = resolveEntityMotionState({
      isAttacking: false,
      isActivating: false,
      isOpponentSide: false,
      isHorizontal: true,
    });
    expect(result.initial.rotateY).toBe(0);
    expect(result.animate.rotateY).toBe(0);
    expect(result.initial.rotateZ).toBe(-90);
    expect(result.animate.rotateZ).toBe(-90);
  });

  it("debería mantener DEFENSE boca arriba en horizontal", () => {
    const result = resolveEntityMotionState({
      isAttacking: false,
      isActivating: false,
      isOpponentSide: true,
      isHorizontal: true,
    });
    expect(result.initial.rotateY).toBe(0);
    expect(result.animate.rotateY).toBe(0);
    expect(result.initial.rotateZ).toBe(-90);
  });
});
