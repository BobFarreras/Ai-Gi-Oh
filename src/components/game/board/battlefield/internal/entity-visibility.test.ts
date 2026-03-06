// src/components/game/board/battlefield/internal/entity-visibility.test.ts - Pruebas unitarias para reglas visuales de cartas en tablero.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { resolveEntityVisibility } from "./entity-visibility";

function createEntity(mode: IBoardEntity["mode"], cardType: ICard["type"]): IBoardEntity {
  const card: ICard = {
    id: `${cardType.toLowerCase()}-id`,
    name: "Carta de prueba",
    description: "Carta mock para visibilidad",
    type: cardType,
    faction: "NEUTRAL",
    cost: 1,
  };
  return {
    instanceId: "entity-1",
    card,
    mode,
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}

describe("resolveEntityVisibility", () => {
  it("debería mostrar DEFENSE boca arriba y horizontal", () => {
    const result = resolveEntityVisibility(createEntity("DEFENSE", "ENTITY"), false);
    expect(result.isFaceDown).toBe(false);
    expect(result.isHorizontal).toBe(true);
  });

  it("debería mantener SET de entidad boca abajo y horizontal hasta revelarse", () => {
    const hidden = resolveEntityVisibility(createEntity("SET", "ENTITY"), false);
    expect(hidden.isFaceDown).toBe(true);
    expect(hidden.isHorizontal).toBe(true);

    const revealed = resolveEntityVisibility(createEntity("SET", "ENTITY"), true);
    expect(revealed.isFaceDown).toBe(false);
    expect(revealed.isHorizontal).toBe(true);
  });

  it("debería mantener SET de ejecución boca abajo y vertical", () => {
    const result = resolveEntityVisibility(createEntity("SET", "EXECUTION"), false);
    expect(result.isFaceDown).toBe(true);
    expect(result.isHorizontal).toBe(false);
  });
});
