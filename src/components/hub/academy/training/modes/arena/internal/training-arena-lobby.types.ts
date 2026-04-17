// src/components/hub/academy/training/modes/arena/internal/training-arena-lobby.types.ts - Tipos compartidos del lobby de arena de entrenamiento.
export interface ITrainingArenaTierOption {
  tier: number;
  isUnlocked: boolean;
  isSelected: boolean;
}

export interface ITrainingArenaLobbyProps {
  level: number;
  tierCode: string;
  tierDifficultyLabel: string;
  tierRewardPreview: { nexus: number; playerExperience: number };
  nextTierRequirementLabel: string;
  tierOptions: ITrainingArenaTierOption[];
  onSelectTier: (tier: number) => void;
  opponentName: string;
  playerAvatarUrl: string;
  opponentAvatarUrl: string;
  onStart: () => void;
  onBack: () => void;
}
