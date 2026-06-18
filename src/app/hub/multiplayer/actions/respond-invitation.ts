// src/app/hub/multiplayer/actions/respond-invitation.ts - Server Action: acepta o rechaza una invitación; si acepta, crea la sesión de partida.
"use server";

import { declineInvitationService, acceptInvitationService } from "@/services/multiplayer/respond-invitation-service";

export async function declineInvitation(invitationId: string): Promise<{ ok: boolean; error?: string }> {
  return declineInvitationService(invitationId);
}

export async function acceptInvitation(
  invitationId: string,
  myDeckIds: string[],
): Promise<{ ok: boolean; matchId?: string; error?: string }> {
  return acceptInvitationService(invitationId, myDeckIds);
}
