// src/services/admin/get-admin-starter-deck-template-data.ts - Servicio server-side para hidratar starter deck admin con plantillas y catálogo de cartas.
import { ICard } from "@/core/entities/ICard";
import { IAdminStarterDeckTemplateData } from "@/core/entities/admin/IAdminStarterDeckTemplate";
import { GetAdminStarterDeckTemplateUseCase } from "@/core/use-cases/admin/GetAdminStarterDeckTemplateUseCase";
import { SupabaseAdminStarterDeckRepository } from "@/infrastructure/persistence/supabase/admin/SupabaseAdminStarterDeckRepository";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export interface IAdminStarterDeckRuntimeData {
  data: IAdminStarterDeckTemplateData;
  availableCards: ICard[];
}

export async function getAdminStarterDeckTemplateData(templateKey?: string): Promise<IAdminStarterDeckRuntimeData> {
  const client = await createSupabaseServerClient();
  const repository = new SupabaseAdminStarterDeckRepository(client);
  const useCase = new GetAdminStarterDeckTemplateUseCase(repository);
  const [data, availableCards] = await Promise.all([useCase.execute(templateKey), repository.listAvailableCards()]);
  return { data, availableCards };
}
