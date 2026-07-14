// src/components/hub/progression/WeeklyPrizeGate.tsx - Abre el aviso del premio semanal al llegar al hub.
//
// Convive con la recompensa diaria: si la diaria está pendiente, ESPERA a que el jugador la reclame antes de
// abrirse, para no apilar dos modales encima del otro. Si el jugador cierra la diaria sin reclamarla, el aviso
// del premio saldrá la próxima vez que entre (no se pierde: sigue sin marcarse como visto).
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { IPendingWeeklyPrize } from "@/services/ranking/get-pending-weekly-prizes";
import { WeeklyPrizeModal } from "./WeeklyPrizeModal";
import { useDailyLogin } from "./DailyLoginProvider";

// Un pelín más que la diaria: si ambas están pendientes, la diaria abre primero.
const WEEKLY_PRIZE_AUTO_OPEN_DELAY_MS = 2600;

export function WeeklyPrizeGate({ prizes }: { prizes: IPendingWeeklyPrize[] }) {
  const { status } = useDailyLogin();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const autoOpenedRef = useRef(false);

  // La diaria bloquea la apertura mientras siga sin reclamarse (evita dos modales a la vez).
  const isDailyPending = Boolean(status && !status.claimedToday);

  useEffect(() => {
    if (autoOpenedRef.current || pathname !== "/hub" || prizes.length === 0 || isDailyPending) return;
    autoOpenedRef.current = true;
    const timeout = window.setTimeout(() => setOpen(true), WEEKLY_PRIZE_AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [isDailyPending, pathname, prizes.length]);

  function handleClose(): void {
    setOpen(false);
    // Marca los premios como avisados. Si la petición falla, el aviso volverá a salir: preferimos repetirlo a
    // que el jugador no llegue a enterarse nunca de que ganó.
    void fetch("/api/progression/weekly-prize/ack", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: prizes.map((prize) => prize.id) }),
    }).catch(() => undefined);
  }

  if (!open || prizes.length === 0) return null;
  return <WeeklyPrizeModal prizes={prizes} onClose={handleClose} />;
}
