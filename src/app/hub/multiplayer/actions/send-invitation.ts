// src/app/hub/multiplayer/actions/send-invitation.ts - Server Action: envía invitación de duelo a un jugador online.
"use server";

import { sendInvitationService } from "@/services/multiplayer/send-invitation-service";

export async function sendInvitation(toPlayerId: string, deckIds: string[]): Promise<{ ok: boolean; error?: string }> {
  return sendInvitationService(toPlayerId, deckIds);
}
