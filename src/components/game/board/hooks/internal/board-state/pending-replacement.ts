// src/components/game/board/hooks/internal/board-state/pending-replacement.ts - Define el contrato UI para reemplazos pendientes en zonas llenas del tablero.
import { BattleMode } from "@/core/entities/IPlayer";
import { ReplacementZoneType } from "@/core/use-cases/game-engine/actions/play-card-with-zone-replacement";

export interface IPendingZoneReplacement {
  cardId: string;
  mode: BattleMode;
  zone: ReplacementZoneType;
}

