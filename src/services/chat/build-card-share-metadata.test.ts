// src/services/chat/build-card-share-metadata.test.ts - Frontera de seguridad de CARD_SHARE: solo se puede
// compartir una carta que se posee, y la instantánea sale del catálogo/progresión reales, nunca del cliente.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { ICard } from "@/core/entities/ICard";

const getCollection = vi.fn();
const listByPlayer = vi.fn();

vi.mock("@/services/player-persistence/create-player-runtime-repositories", () => ({
  createPlayerRuntimeRepositories: async () => ({
    collectionRepository: { getCollection },
    playerCardProgressRepository: { listByPlayer },
  }),
}));

const { buildCardShareMetadata } = await import("./build-card-share-metadata");

const ownedCard: ICard = {
  id: "entity-react",
  name: "React",
  description: "",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 4,
  attack: 1500,
  defense: 1200,
  renderUrl: "/assets/renders/react.webp",
};

beforeEach(() => {
  getCollection.mockReset();
  listByPlayer.mockReset();
  getCollection.mockResolvedValue([{ card: ownedCard }]);
  listByPlayer.mockResolvedValue([]);
});

describe("buildCardShareMetadata", () => {
  it("rechaza compartir una carta que el jugador no tiene en su colección", async () => {
    await expect(buildCardShareMetadata("p1", "entity-que-no-tengo")).rejects.toThrow(/colección/i);
  });

  it("rechaza un cardId ausente o no textual", async () => {
    await expect(buildCardShareMetadata("p1", undefined)).rejects.toThrow(/no válida/i);
    await expect(buildCardShareMetadata("p1", { cardId: "x" })).rejects.toThrow(/no válida/i);
  });

  it("construye la instantánea desde la carta real: ignora nombre, stats e imagen que mande el cliente", async () => {
    // El cliente solo aporta el cardId; aunque intentara colar otros campos, aquí no llegan.
    const metadata = await buildCardShareMetadata("p1", "entity-react");
    expect(metadata).toMatchObject({
      cardId: "entity-react",
      name: "React",
      attack: 1500,
      defense: 1200,
      renderUrl: "/assets/renders/react.webp",
    });
  });

  it("aplica la progresión real del jugador a las stats compartidas", async () => {
    // Nivel 20 ⇒ bonus de nivel de entity (+100 ATK a nivel 5, +200/+200 a nivel 20 en la curva vigente).
    listByPlayer.mockResolvedValue([
      { playerId: "p1", cardId: "entity-react", versionTier: 0, level: 20, xp: 0, masteryPassiveSkillId: null, updatedAtIso: "" },
    ]);
    const metadata = await buildCardShareMetadata("p1", "entity-react");
    expect(metadata.level).toBe(20);
    expect(metadata.attack as number).toBeGreaterThan(1500);
  });
});
