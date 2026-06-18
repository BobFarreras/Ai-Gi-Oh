// src/components/hub/ranking/RankingTopAvatar.tsx - Avatar del top 3 con halo radial pulsante, doble anillo conic rotatorio y glow (desmontable en modo rendimiento).
"use client";

import { memo } from "react";
import Image from "next/image";
import { getAvatarGradientClasses, getAvatarInitial } from "@/components/hub/internal/avatar-color";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";
import { PodiumTier } from "./internal/tier";

interface RankingTopAvatarProps {
  playerId: string;
  nickname: string;
  avatarUrl: string | null;
  tier: PodiumTier;
}

/** Clase del anillo conic interior por tier (rotación rápida, horaria). */
const RING_INNER: Record<PodiumTier, string> = {
  gold: "podium-ring-gold",
  silver: "podium-ring-silver",
  bronze: "podium-ring-bronze",
};

/** Clase del halo radial pulsante por tier. */
const HALO: Record<PodiumTier, string> = {
  gold: "podium-halo-gold",
  silver: "podium-halo-silver",
  bronze: "podium-halo-bronze",
};

/** Glow estático por tier (box-shadow sin animar, regla 5 perf). */
const STATIC_GLOW: Record<PodiumTier, string> = {
  gold: "shadow-[0_0_16px_rgba(251,191,36,0.6)]",
  silver: "shadow-[0_0_14px_rgba(203,213,225,0.5)]",
  bronze: "shadow-[0_0_12px_rgba(217,119,6,0.5)]",
};

/**
 * Avatar del top 3. Combina capas energéticas sin iconos:
 * 1. Halo radial pulsante detrás (opacity + scale, barato).
 * 2. Anillo conic interior rotatorio (transform: rotate, GPU).
 * 3. Anillo conic exterior más sutil rotando en sentido contrario.
 * 4. Glow estático por tier.
 * 5. Avatar generado o imagen al centro.
 *
 * Todas las animaciones se DESMONTAN en modo rendimiento (regla 4 perf),
 * dejando solo el glow estático. Nunca se anima box-shadow en bucle.
 */
function RankingTopAvatarComponent({ playerId, nickname, avatarUrl, tier }: RankingTopAvatarProps) {
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();
  const avatar = getAvatarGradientClasses(playerId);
  const initial = getAvatarInitial(nickname);

  return (
    <div className="relative flex h-9 w-9 items-center justify-center sm:h-12 sm:w-12">
      {/* Halo radial pulsante detrás (desmontado en modo rendimiento) */}
      {shouldReduceCombatEffects && (
        <div
          aria-hidden
          className={`absolute -inset-2 rounded-full ${HALO[tier]}`}
          style={{ animation: "none", opacity: 0.6 }}
        />
      )}

      {/* Anillo conic exterior más sutil (rotación antihoraria, más lento) */}
      {!shouldReduceCombatEffects && (
        <div
          aria-hidden
          className={`absolute -inset-[5px] rounded-full ${RING_INNER[tier]} opacity-50 ${STATIC_GLOW[tier]}`}
          style={{ animationDirection: "reverse", animationDuration: "8s" }}
        />
      )}

      {/* Anillo conic interior (rotación horaria, más rápido) */}
      {!shouldReduceCombatEffects && (
        <div
          aria-hidden
          className={`absolute -inset-[3px] rounded-full ${RING_INNER[tier]} ${STATIC_GLOW[tier]}`}
        />
      )}

      {/* Máscara interior para crear el efecto de anillo (hueco central) */}
      <div aria-hidden className="absolute inset-0 rounded-full bg-[#020a14]" />

      {/* Avatar real */}
      <div className="relative h-[calc(100%-4px)] w-[calc(100%-4px)] overflow-hidden rounded-full">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={nickname} fill sizes="48px" className="object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${avatar.from} ${avatar.to} text-sm font-black text-white sm:text-base`}>
            {initial}
          </div>
        )}
      </div>
    </div>
  );
}

export const RankingTopAvatar = memo(RankingTopAvatarComponent);
