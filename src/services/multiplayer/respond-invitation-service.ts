import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function declineInvitationService(invitationId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { error } = await supabase
    .from("player_invitations")
    .update({ status: "DECLINED" })
    .eq("id", invitationId)
    .eq("to_id", user.id)
    .eq("status", "PENDING");

  if (error) return { ok: false, error: "No se pudo rechazar la invitación." };
  return { ok: true };
}

export async function acceptInvitationService(
  invitationId: string,
  myDeckIds: string[],
): Promise<{ ok: boolean; matchId?: string; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado." };

  const { data: invitation, error: invError } = await supabase
    .from("player_invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("to_id", user.id)
    .eq("status", "PENDING")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (invError || !invitation) return { ok: false, error: "Invitación no encontrada o expirada." };

  const seed = crypto.randomUUID();
  const { data: session, error: sessionError } = await supabase
    .from("match_sessions")
    .insert({
      player_a_id: invitation.from_id,
      player_b_id: user.id,
      deck_a_ids: invitation.deck_ids,
      deck_b_ids: myDeckIds,
      seed,
      status: "WAITING",
    })
    .select("id")
    .single();

  if (sessionError || !session) return { ok: false, error: "No se pudo crear la sesión de partida." };

  await supabase
    .from("player_invitations")
    .update({ status: "ACCEPTED", match_id: session.id })
    .eq("id", invitationId);

  return { ok: true, matchId: session.id };
}
