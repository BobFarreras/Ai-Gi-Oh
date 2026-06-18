// src/core/services/multiplayer/prepare-multiplayer-match.ts - Construye mazos y sorteo iniciales DETERMINISTAS por identidad real, idénticos en ambos clientes.
import { ICard } from "@/core/entities/ICard";
import { createSeededRandom } from "@/core/services/random/seeded-rng";

/**
 * Baraja y asigna runtimeId a un mazo de forma determinista a partir del seed
 * compartido y del ID REAL del propietario.
 *
 * Clave del multijugador: cada mazo se procesa por su propietario real (no por
 * el asiento playerA/playerB local). Así, el mismo mazo lógico produce el mismo
 * orden y los mismos runtimeId en ambos clientes, aunque cada cliente coloque a
 * su jugador local en el asiento playerA. Esto evita el desfase de instancias
 * que rompería la sincronización Realtime.
 */
export function prepareMultiplayerDeck(deck: ICard[], ownerId: string, seed: string): ICard[] {
  const random = createSeededRandom(`${seed}:${ownerId}`);

  // Fisher-Yates determinista sobre una copia.
  const shuffled = deck.map((card) => ({ ...card }));
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }

  // runtimeId determinista: mismo propietario + seed ⇒ mismo identificador en ambos clientes.
  return shuffled.map((card, index) => {
    const suffix = Math.floor(random() * 1_000_000_000)
      .toString(36)
      .padStart(6, "0");
    return { ...card, runtimeId: `${ownerId}-${card.id}-${index}-${suffix}` };
  });
}

export interface IMultiplayerCoinToss {
  starterPlayerId: string;
  starterSide: "PLAYER" | "OPPONENT";
}

/**
 * Resuelve quién empieza de forma determinista por seed. Ambos clientes calculan
 * el mismo ganador usando las identidades canónicas (inviter = playerA de la
 * sesión), y luego cada cliente traduce el lado a su propia perspectiva.
 */
export function resolveMultiplayerCoinToss(input: {
  seed: string;
  canonicalPlayerAId: string;
  canonicalPlayerBId: string;
  localPlayerId: string;
}): IMultiplayerCoinToss {
  const random = createSeededRandom(`${input.seed}:starter`);
  const starterPlayerId = random() < 0.5 ? input.canonicalPlayerAId : input.canonicalPlayerBId;
  return {
    starterPlayerId,
    starterSide: starterPlayerId === input.localPlayerId ? "PLAYER" : "OPPONENT",
  };
}
