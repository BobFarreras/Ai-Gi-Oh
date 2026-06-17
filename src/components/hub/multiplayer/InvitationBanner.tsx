// src/components/hub/multiplayer/InvitationBanner.tsx - Banner de invitación entrante con tiempo de expiración y botones de respuesta.
"use client";

import { useEffect, useState } from "react";
import { IPlayerInvitation } from "@/core/entities/multiplayer/IPlayerInvitation";

interface InvitationBannerProps {
  invitation: IPlayerInvitation;
  onAccept: (invitation: IPlayerInvitation) => void;
  onDecline: (invitation: IPlayerInvitation) => void;
}

function useSecondsLeft(expiresAt: string): number {
  const [secondsLeft, setSecondsLeft] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)),
  );

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => {
      setSecondsLeft((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  return secondsLeft;
}

export function InvitationBanner({ invitation, onAccept, onDecline }: InvitationBannerProps) {
  const secondsLeft = useSecondsLeft(invitation.expiresAt);

  if (secondsLeft <= 0) return null;

  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-cyan-400/50 bg-cyan-950/70 p-4 shadow-[0_0_20px_rgba(34,211,238,0.15)] backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Invitación de duelo</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-100">
          <span className="text-cyan-200">{invitation.fromNickname}</span> te reta a un duelo
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-xs text-slate-400 tabular-nums">{secondsLeft}s</span>
        <button
          type="button"
          onClick={() => onDecline(invitation)}
          className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-red-300 transition hover:bg-red-400/20"
        >
          Rechazar
        </button>
        <button
          type="button"
          onClick={() => onAccept(invitation)}
          className="rounded-lg border border-cyan-400/50 bg-cyan-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-cyan-100 transition hover:bg-cyan-400/30"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
