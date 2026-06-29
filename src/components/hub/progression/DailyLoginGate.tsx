// src/components/hub/progression/DailyLoginGate.tsx - Abre automáticamente el modal de recompensa diaria al llegar al hub (no en sub-rutas ni durante el onboarding). Comparte estado con el dock vía DailyLoginProvider.
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DailyLoginModal } from "./DailyLoginModal";
import { useDailyLogin } from "./DailyLoginProvider";

// Margen antes de abrir la recompensa diaria al llegar al hub: da aire a que la escena se asiente
// (sobre todo tras el tutorial) en vez de saltar de golpe.
const DAILY_REWARD_AUTO_OPEN_DELAY_MS = 2000;

export function DailyLoginGate() {
  const { status, markClaimed } = useDailyLogin();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const autoOpenedRef = useRef(false);

  // La recompensa diaria salta automáticamente una sola vez y SOLO en la página del hub (/hub),
  // no en sub-rutas (academy, market…). El layout ya impide montar este gate durante el onboarding,
  // así que tras completar el tutorial aparece al llegar al hub. El setState va diferido con un
  // microtimer para no infringir react-hooks/set-state-in-effect.
  useEffect(() => {
    if (autoOpenedRef.current || pathname !== "/hub" || !status || status.claimedToday) return;
    autoOpenedRef.current = true;
    const timeout = window.setTimeout(() => setOpen(true), DAILY_REWARD_AUTO_OPEN_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, [pathname, status]);

  if (!status || !open) return null;
  return <DailyLoginModal status={status} onClaimed={markClaimed} onClose={() => setOpen(false)} />;
}
