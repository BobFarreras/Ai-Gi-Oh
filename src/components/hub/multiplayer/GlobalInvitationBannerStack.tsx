// src/components/hub/multiplayer/GlobalInvitationBannerStack.tsx - Overlay flotante de invitaciones entrantes (reutiliza InvitationBanner) con auto-dismiss.
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { IPlayerInvitation } from "@/core/entities/multiplayer/IPlayerInvitation";
import { InvitationBanner } from "./InvitationBanner";

/**
 * Tiempo que el banner permanece visible en el overlay flotante antes de
 * auto-ocultarse. La invitación sigue viva en la BD hasta que expira; para verla
 * de forma persistente el jugador puede ir al lobby de multijugador.
 */
const AUTO_DISMISS_MS = 8000;

interface GlobalInvitationBannerStackProps {
  invitations: IPlayerInvitation[];
  isResponding: boolean;
  onAccept: (invitation: IPlayerInvitation) => void;
  onDecline: (invitation: IPlayerInvitation) => void;
}

/**
 * Pila flotante de banners de invitación, anclada arriba-centro por encima de
 * cualquier sección del hub. Cada banner se oculta solo tras `AUTO_DISMISS_MS`
 * para no estorbar; aceptar/rechazar siguen el flujo normal del lobby.
 *
 * El contenedor exterior es `pointer-events-none` (no bloquea la UI de debajo);
 * solo la columna central de los banners recibe clics.
 */
export function GlobalInvitationBannerStack({
  invitations,
  isResponding,
  onAccept,
  onDecline,
}: GlobalInvitationBannerStackProps) {
  // Ids ya auto-ocultados del overlay (la invitación puede seguir pendiente en BD).
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Programa el auto-dismiss de cada invitación nueva y limpia las que ya no existen.
  useEffect(() => {
    const activeIds = new Set(invitations.map((inv) => inv.id));

    for (const inv of invitations) {
      if (timersRef.current.has(inv.id)) continue;
      const timer = setTimeout(() => {
        setDismissedIds((prev) => {
          const next = new Set(prev);
          next.add(inv.id);
          return next;
        });
      }, AUTO_DISMISS_MS);
      timersRef.current.set(inv.id, timer);
    }

    for (const [id, timer] of timersRef.current) {
      if (!activeIds.has(id)) {
        clearTimeout(timer);
        timersRef.current.delete(id);
      }
    }
    // No podamos `dismissedIds`: los ids son UUIDs únicos que nunca se reutilizan,
    // así que conservarlos es inocuo y evita un setState dentro del effect.
  }, [invitations]);

  // Limpia todos los timers al desmontar.
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  // Mantenemos el overlay montado mientras exista alguna invitación (aunque esté
  // auto-ocultada) para que su animación de salida se reproduzca.
  if (invitations.length === 0) return null;

  const visible = invitations.filter((inv) => !dismissedIds.has(inv.id));

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[120] flex justify-center px-3 pt-3 sm:pt-4">
      <div className="pointer-events-auto flex w-full max-w-md flex-col gap-2">
        <AnimatePresence initial>
          {visible.map((invitation) => (
            <InvitationBanner
              key={invitation.id}
              invitation={invitation}
              isResponding={isResponding}
              onAccept={onAccept}
              onDecline={onDecline}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
