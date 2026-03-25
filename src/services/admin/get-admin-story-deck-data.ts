// src/services/admin/get-admin-story-deck-data.ts - Servicio server-side para hidratar panel admin Story Decks con oponentes, decks y cartas.
import { ICard } from "@/core/entities/ICard";
import { IAdminStoryDeckData } from "@/core/entities/admin/IAdminStoryDeck";
import { GetAdminStoryDeckDataUseCase } from "@/core/use-cases/admin/GetAdminStoryDeckDataUseCase";
import { SupabaseAdminStoryDeckRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminStoryDeckRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

interface IGetAdminStoryDeckDataInput {
  opponentId?: string;
  deckListId?: string;
}

export interface IAdminStoryDeckRuntimeData {
  data: IAdminStoryDeckData;
  availableCards: ICard[];
}

export async function getAdminStoryDeckData(input: IGetAdminStoryDeckDataInput = {}): Promise<IAdminStoryDeckRuntimeData> {
  const client = await createSupabaseServerClient();
  const repository = new SupabaseAdminStoryDeckRepository(client);
  const useCase = new GetAdminStoryDeckDataUseCase(repository);
  const [data, availableCards] = await Promise.all([useCase.execute(input), repository.listAvailableCards()]);
  return { data, availableCards };
}

