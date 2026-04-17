// src/components/hub/academy/training/modes/tutorial/internal/training-tutorial-client.types.ts - Tipos del cliente de tutorial de combate.
import { ICard } from "@/core/entities/ICard";

export interface ITrainingTutorialClientProps {
  deck: ICard[];
  fusionDeck: ICard[];
  opponentDeck: ICard[];
  opponentFusionDeck: ICard[];
  seed: string;
}
