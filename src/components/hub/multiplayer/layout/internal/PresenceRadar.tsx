// src/components/hub/multiplayer/layout/internal/PresenceRadar.tsx - Radar circular de presencia (desktop) con sweep y blips por jugador online.
"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { IOnlinePlayer } from "@/core/entities/multiplayer/IOnlinePlayer";
import { OnlinePlayerStatusDot } from "../../internal/OnlinePlayerStatusDot";
import { getAvatarGradientClasses, getAvatarInitial } from "../../internal/avatar-color";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";

interface PresenceRadarProps {
  players: IOnlinePlayer[];
  localNickname: string;
  localPlayerId: string;
  onSelectPlayer?: (player: IOnlinePlayer) => void;
}

/** Radio del anillo de blips como porcentaje del contenedor (0-50). */
const BLIP_RADIUS_PERCENT = 38;

/** Hash djb2 para ángulo determinista por playerId (SSR-safe, sin Math.random). */
function hashAngle(id: string): number {
  let hash = 5381;
  for (let i = 0; i < id.length; i += 1) {
    hash = ((hash << 5) + hash + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

/** Posición (x, y) en porcentaje para un ángulo dado sobre el radio de blips. */
function blipPosition(angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: 50 + BLIP_RADIUS_PERCENT * Math.cos(rad),
    y: 50 + BLIP_RADIUS_PERCENT * Math.sin(rad),
  };
}

/**
 * Radar de presencia (solo desktop). Anillos y sweep se DESMONTAN en modo
 * rendimiento (regla 4: desmontar, no ocultar con CSS). Los blips son
 * estáticos (sin animación infinita) y se posicionan de forma determinista.
 */
function PresenceRadarComponent({ players, localNickname, localPlayerId, onSelectPlayer }: PresenceRadarProps) {
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();
  const localAvatar = getAvatarGradientClasses(localPlayerId);
  const localInitial = getAvatarInitial(localNickname);

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[340px]">
      {/* Anillos giratorios (desmontados en modo rendimiento) */}
      {!shouldReduceCombatEffects && (
        <>
          <div
            aria-hidden
            className="hub-control-ring absolute left-1/2 top-1/2 h-[92%] w-[92%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          />
          <div
            aria-hidden
            className="hub-control-ring-slow absolute left-1/2 top-1/2 h-[74%] w-[74%] -translate-x-1/2 -translate-y-1/2 rounded-full"
          />
        </>
      )}

      {/* Cuerpo del radar + sweep conic */}
      <div className="hub-control-radar absolute inset-[6%] rounded-full">
        {!shouldReduceCombatEffects && (
          <div
            aria-hidden
            className="hub-control-radar-sweep absolute left-1/2 top-1/2 h-full w-full rounded-full"
          />
        )}
        {/* Crosshair estático (gradientes, no filter) */}
        <div aria-hidden className="absolute inset-0 rounded-full border border-cyan-400/20" />
        <div aria-hidden className="absolute left-1/2 top-[8%] bottom-[8%] w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-cyan-400/25 to-transparent" />
        <div aria-hidden className="absolute top-1/2 left-[8%] right-[8%] h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-400/25 to-transparent" />
      </div>

      {/* Centro: avatar del jugador local */}
      <div className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.4),transparent_70%)]" />
        <div
          aria-hidden
          className={`relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${localAvatar.from} ${localAvatar.to} text-base font-black text-white shadow-[0_0_18px_rgba(34,211,238,0.5),inset_0_0_8px_rgba(0,0,0,0.4)]`}
        >
          {localInitial}
        </div>
      </div>

      {/* Blips de jugadores online */}
      {players.map((player) => {
        const { x, y } = blipPosition(hashAngle(player.playerId));
        const { from, to } = getAvatarGradientClasses(player.playerId);
        return (
          <motion.button
            key={player.playerId}
            type="button"
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.4 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={() => onSelectPlayer?.(player)}
            aria-label={`${player.nickname}, ${player.status === "IDLE" ? "disponible" : player.status === "IN_MATCH" ? "en duelo" : "en lobby"}`}
            className="group absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-cyan-400/40 bg-[#020a14]/90 backdrop-blur-sm transition hover:border-cyan-300/80 hover:shadow-[0_0_14px_rgba(34,211,238,0.5)]"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <span
              aria-hidden
              className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${from} ${to} text-[11px] font-black text-white`}
            >
              {getAvatarInitial(player.nickname)}
            </span>
            <span className="absolute -right-0.5 -top-0.5">
              <OnlinePlayerStatusDot status={player.status} size={8} />
            </span>
            {/* Tooltip de nickname al hover (estático, sin animación) */}
            <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-950/90 px-1.5 py-0.5 text-[10px] font-bold text-cyan-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {player.nickname}
            </span>
          </motion.button>
        );
      })}

      {/* Estado vacío: ningún blip */}
      {players.length === 0 && (
        <p className="absolute bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Escaneando_sector…
        </p>
      )}
    </div>
  );
}

export const PresenceRadar = memo(PresenceRadarComponent);
