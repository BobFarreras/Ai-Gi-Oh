// src/components/hub/multiplayer/internal/multiplayer-lobby-equality.ts - Comparadores puros por contenido para memoización de componentes del lobby.
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { IPlayerInvitation } from "@/core/entities/multiplayer/IPlayerInvitation";

/**
 * Compara dos jugadores online por los campos que afectan al render de la
 * tarjeta. El motor de presencia crea objetos nuevos en cada sync, así que
 * la igualdad por referencia rompería la memoización.
 */
export function areEqualOnlinePlayerProps(
  prev: { player: IOnlinePlayer; inviteSent: boolean; canInvite: boolean },
  next: { player: IOnlinePlayer; inviteSent: boolean; canInvite: boolean },
): boolean {
  return (
    prev.inviteSent === next.inviteSent &&
    prev.canInvite === next.canInvite &&
    prev.player.playerId === next.player.playerId &&
    prev.player.nickname === next.player.nickname &&
    prev.player.status === next.player.status
  );
}

/**
 * Compara dos invitaciones por los campos que afectan al banner. El id y el
 * expiresAt son estables; el estado cambia cuando se acepta/rechaza.
 */
export function areEqualInvitationBannerProps(
  prev: { invitation: IPlayerInvitation; isResponding: boolean },
  next: { invitation: IPlayerInvitation; isResponding: boolean },
): boolean {
  return (
    prev.isResponding === next.isResponding &&
    prev.invitation.id === next.invitation.id &&
    prev.invitation.status === next.invitation.status &&
    prev.invitation.fromNickname === next.invitation.fromNickname &&
    prev.invitation.expiresAt === next.invitation.expiresAt
  );
}
