// src/core/entities/multiplayer/IPlayerInvitation.ts - Invitación de duelo entre dos jugadores.
export type InvitationStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";

export interface IPlayerInvitation {
  id: string;
  fromId: string;
  fromNickname: string;
  toId: string;
  status: InvitationStatus;
  matchId: string | null;
  deckIds: string[];
  expiresAt: string;
  createdAt: string;
}
