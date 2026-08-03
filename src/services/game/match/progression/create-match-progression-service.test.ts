// src/services/game/match/progression/create-match-progression-service.test.ts - Verifica selección de servicio de progresión post-duelo según modo.
import { describe, expect, it, vi } from "vitest";
import { createMatchProgressionService } from "@/services/game/match/progression/create-match-progression-service";
import { RemoteMatchProgressionService } from "@/services/game/match/progression/RemoteMatchProgressionService";

describe("create-match-progression-service", () => {
  it("usa servicio remoto donde el jugador juega con SU mazo", () => {
    expect(createMatchProgressionService("TRAINING")).toBeInstanceOf(RemoteMatchProgressionService);
    expect(createMatchProgressionService("STORY")).toBeInstanceOf(RemoteMatchProgressionService);
    expect(createMatchProgressionService("MULTIPLAYER")).toBeInstanceOf(RemoteMatchProgressionService);
    // Supervivencia sí usa el mazo propio: su experiencia es legítima.
    expect(createMatchProgressionService("SURVIVAL")).toBeInstanceOf(RemoteMatchProgressionService);
  });

  it("usa servicio tutorial sin persistencia", async () => {
    const service = createMatchProgressionService("TUTORIAL");
    const result = await service.applyBattleCardExperience("battle-test", []);
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("Olimpo no persiste experiencia: el mazo es prestado del campeón", async () => {
    const service = createMatchProgressionService("OLYMPUS");
    expect(service).not.toBeInstanceOf(RemoteMatchProgressionService);
    await expect(service.applyBattleCardExperience("battle-test", [
      { cardId: "entity-a", playerId: "p1", gainedXp: 120 } as never,
    ])).resolves.toEqual([]);
  });

  it("mantiene contrato async estable", async () => {
    const service = createMatchProgressionService("TUTORIAL");
    await expect(service.applyBattleCardExperience("battle-test", [])).resolves.toEqual([]);
    expect(vi.isMockFunction(service.applyBattleCardExperience)).toBe(false);
  });
});
