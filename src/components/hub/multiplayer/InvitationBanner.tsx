// src/components/hub/multiplayer/InvitationBanner.tsx - Banner de invitación entrante con countdown bar visual, glow estático y botones de respuesta.
"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { IPlayerInvitation } from "@/core/entities/multiplayer/IPlayerInvitation";
import { InvitationCountdownBar } from "./internal/InvitationCountdownBar";
import { areEqualInvitationBannerProps } from "./internal/multiplayer-lobby-equality";
import { getAvatarGradientClasses, getAvatarInitial } from "./internal/avatar-color";

/**
 * Duración total estándar de una invitación (segundos). Sirve como denominador
 * de la barra de progreso. Si la BD cambia este valor, ajústalo aquí.
 */
const INVITATION_TOTAL_SECONDS = 30;

interface InvitationBannerProps {
  invitation: IPlayerInvitation;
  isResponding: boolean;
  onAccept: (invitation: IPlayerInvitation) => void;
  onDecline: (invitation: IPlayerInvitation) => void;
}

/**
 * Banner de invitación entrante. Memoizado por contenido. La barra de cuenta
 * atrás usa width transition (no transform) a 1Hz, barato. El glow del borde
 * es box-shadow estático (sin animación en bucle) según la regla 5 de perf.
 */
function InvitationBannerComponent({
  invitation,
  isResponding,
  onAccept,
  onDecline,
}: InvitationBannerProps) {
  // Avatar generado determinista del rival que reta (gradiente estable por fromId).
  const { from, to } = getAvatarGradientClasses(invitation.fromId);
  const rivalInitial = getAvatarInitial(invitation.fromNickname);

  return (
    <motion.div
      role="alert"
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="relative overflow-hidden rounded-2xl border border-cyan-400/50 bg-cyan-950/70 p-4 shadow-[0_0_20px_rgba(34,211,238,0.18)] backdrop-blur-sm"
    >
      {/* Halo cian decorativo (gradiente radial estático, no filter blur) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.35),transparent_70%)]"
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          {/* Avatar del rival que reta */}
          <div
            aria-hidden
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${from} ${to} text-lg font-black text-white shadow-[0_0_14px_rgba(34,211,238,0.4),inset_0_0_8px_rgba(0,0,0,0.4)]`}
          >
            {rivalInitial}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-cyan-300">
              Invitación de duelo
            </p>
            {/* Nombre del rival como titular destacado */}
            <p className="mt-0.5 truncate text-lg font-black text-cyan-100 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
              {invitation.fromNickname}
            </p>
            <p className="mt-0.5 truncate text-xs text-slate-300">te reta a un duelo</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => onDecline(invitation)}
            disabled={isResponding}
            aria-label={`Rechazar invitación de ${invitation.fromNickname}`}
            className="rounded-lg border border-rose-400/40 bg-rose-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-rose-300 transition hover:bg-rose-400/25 active:scale-95 disabled:opacity-50"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => onAccept(invitation)}
            disabled={isResponding}
            aria-label={`Aceptar invitación de ${invitation.fromNickname}`}
            className="rounded-lg border border-cyan-400/60 bg-cyan-500/25 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-400/40 hover:shadow-[0_0_14px_rgba(34,211,238,0.45)] active:scale-95 disabled:opacity-50"
          >
            {isResponding ? "…" : "Aceptar"}
          </button>
        </div>
      </div>

      {/* Barra de expiración debajo del contenido */}
      <div className="mt-3">
        <InvitationCountdownBar
          expiresAt={invitation.expiresAt}
          totalSeconds={INVITATION_TOTAL_SECONDS}
        />
      </div>
    </motion.div>
  );
}

export const InvitationBanner = memo(InvitationBannerComponent, areEqualInvitationBannerProps);
