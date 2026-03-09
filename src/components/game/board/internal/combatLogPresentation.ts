// src/components/game/board/internal/combatLogPresentation.ts - Fachada de formateo del combat log para no acoplar consumidores a la estructura interna.
export type { IPlayerLabels } from "@/components/game/board/internal/combat-log-presentation/types";
export { extractEventCardIds, extractEventAmount } from "@/components/game/board/internal/combat-log-presentation/payload-readers";
export { resolveActorName, formatEventDelta, buildBannerMessage } from "@/components/game/board/internal/combat-log-presentation/banner-and-delta";
export { formatCombatLogEvent } from "@/components/game/board/internal/combat-log-presentation/format-combat-log-event";
