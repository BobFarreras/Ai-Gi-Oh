// src/components/game/board/battlefield/internal/pin-slot-entities.test.ts - Verifica que los slots se mantengan estables cuando se elimina una entidad intermedia.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { pinSlotEntities } from "./pin-slot-entities";

function createEntity(instanceId: string): IBoardEntity {
  return {
    instanceId,
    mode: "ATTACK",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
    card: { id: instanceId, name: instanceId, description: "test", type: "ENTITY", faction: "OPEN_SOURCE", cost: 1, attack: 100, defense: 100 },
  };
}

describe("pin-slot-entities", () => {
  it("mantiene slot fijo para entidades restantes al eliminar una carta del medio", () => {
    const a = createEntity("a");
    const b = createEntity("b");
    const c = createEntity("c");

    const first = pinSlotEntities([a, b, c], 3, {});
    expect(first.entitiesBySlot.map((entity) => entity?.instanceId ?? null)).toEqual(["a", "b", "c"]);

    const second = pinSlotEntities([a, c], 3, first.slotByEntityId);
    expect(second.entitiesBySlot.map((entity) => entity?.instanceId ?? null)).toEqual(["a", null, "c"]);
  });
});
