// src/app/hub/multiplayer/actions/send-invitation.ts - Server Action: envía invitación de duelo a un jugador online.
"use server";

import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function sendInvitation(toPlayerId: string, deckIds: string[]): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };
  if (user.id === toPlayerId) return { ok: false, error: "No puedes invitarte a ti mismo." };

  // Cancelar cualquier invitación previa pendiente hacia el mismo jugador
  await supabase
    .from("player_invitations")
    .update({ status: "CANCELLED" })
    .eq("from_id", user.id)
    .eq("to_id", toPlayerId)
    .eq("status", "PENDING");

  const { error } = await supabase
    .from("player_invitations")
    .insert({ from_id: user.id, to_id: toPlayerId, deck_ids: deckIds });

  if (error) return { ok: false, error: "No se pudo enviar la invitación." };
  return { ok: true };
}
