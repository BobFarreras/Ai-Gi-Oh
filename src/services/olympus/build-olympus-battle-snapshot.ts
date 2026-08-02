// src/services/olympus/build-olympus-battle-snapshot.ts - Construye y firma el estado inicial inmutable de una batalla de Olimpo.
import { createHash } from "node:crypto";
import { IOlympusChampion, IOlympusLegend, IOlympusUpgradeNode } from "@/core/entities/olympus/IOlympus";
import { IOlympusRepository } from "@/core/repositories/IOlympusRepository";
import { resolveChampionBattleProfile } from "@/core/services/olympus/resolve-champion-battle-profile";
import { ValidationError } from "@/core/errors/ValidationError";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { getArenaCatalog } from "@/services/training/get-arena-catalog";
import { buildArenaOpponentsFromPresets } from "@/services/training/internal/build-arena-opponents-from-presets";
import { createOlympusInitialState } from "./create-olympus-initial-state";
import { resolveChampionLoadout, resolveLegendLoadout } from "./resolve-olympus-loadouts";

interface IBuildOlympusBattleSnapshotInput {
  playerId: string;
  champion: IOlympusChampion;
  nodes: IOlympusUpgradeNode[];
  /** Rango comprado por nodo: el efecto se aplica una vez por rango. */
  nodeRanks: Record<string, number>;
  legend: IOlympusLegend;
  seed: string;
  repository: IOlympusRepository;
}

const hashOf = (value: unknown): string => createHash("sha256").update(JSON.stringify(value)).digest("hex");

/**
 * Crea el mismo snapshot que el servidor reproducirá al liquidar. Las cartas prestadas se resuelven
 * aquí y mueren aquí: no tocan la colección ni la experiencia del jugador.
 */
export async function buildOlympusBattleSnapshot(input: IBuildOlympusBattleSnapshotInput) {
  const [catalog, legendEntries] = await Promise.all([
    getArenaCatalog(),
    input.repository.getLegendDeckEntries(input.legend.id),
  ]);
  const cardCatalog = catalog.cardCatalog ?? CARD_BY_ID;
  const opponents = catalog.opponents ?? buildArenaOpponentsFromPresets();
  const profile = resolveChampionBattleProfile(input.champion, input.nodes, input.nodeRanks);
  const champion = resolveChampionLoadout(input.champion, opponents, cardCatalog, profile);
  const legend = resolveLegendLoadout(legendEntries, cardCatalog);
  if (champion.deck.length === 0) throw new ValidationError("El campeón no tiene deck jugable.");

  const snapshot = createOlympusInitialState({
    playerId: input.playerId,
    championName: champion.displayName,
    championDeck: champion.deck,
    championFusionDeck: champion.fusionDeck,
    profile,
    legend: input.legend,
    legendDeck: legend.deck,
    legendFusionDeck: legend.fusionDeck,
    seed: input.seed,
  });
  return {
    snapshot,
    snapshotHash: hashOf({ ...snapshot, idFactory: undefined }),
    // Firmas separadas: permiten auditar qué deck prestado y qué deck legendario se jugaron.
    championSnapshotHash: hashOf({ profile, deck: champion.deck, fusionDeck: champion.fusionDeck }),
    opponentSnapshotHash: hashOf({ legendVersion: input.legend.version, entries: legendEntries }),
    profile,
  };
}
