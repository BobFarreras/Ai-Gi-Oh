// src/components/hub/academy/training/modes/arena/internal/training-arena-lobby.types.ts - Tipos compartidos del lobby de arena de entrenamiento.
export interface ITrainingArenaTierOption {
  tier: number;
  isUnlocked: boolean;
  isSelected: boolean;
}

/** Rival del ladder del nivel (fila de "monedas" de progreso). */
export interface ITrainingArenaLadderEntry {
  displayName: string;
  avatarUrl: string;
}

export interface ITrainingArenaLobbyProps {
  level: number;
  tierCode: string;
  tierDifficultyLabel: string;
  tierRewardPreview: { nexus: number; playerExperience: number };
  nextTierRequirementLabel: string;
  tierOptions: ITrainingArenaTierOption[];
  onSelectTier: (tier: number) => void;
  isTierSwitching?: boolean;
  /** Los rivales del nivel en orden (6) para pintar el progreso con avatares. */
  ladder: ITrainingArenaLadderEntry[];
  /** Victorias en el nivel actual: índices < ladderWins = ganados, === ladderWins = siguiente. */
  ladderWins: number;
  opponentName: string;
  playerAvatarUrl: string;
  opponentAvatarUrl: string;
  onStart: () => void;
  onBack: () => void;
}
