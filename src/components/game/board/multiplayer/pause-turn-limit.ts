// src/components/game/board/multiplayer/pause-turn-limit.ts - Límite de turnos que un jugador puede pasar en
// pausa durante una partida multijugador antes de perder por abandono (anti-AFK). Ver la lógica de timeout de
// turno en Board (index.tsx): cada vez que el reloj expira estando en pausa cuenta como un turno pausado; al
// alcanzar este límite, el rival gana automáticamente.
export const MAX_PAUSED_TURNS_MULTIPLAYER = 3;
