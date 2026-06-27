// src/components/hub/progression/DailyLoginGate.tsx - Abre automáticamente el modal de recompensa diaria al llegar al hub (no en sub-rutas ni durante el onboarding). Comparte estado con el dock vía DailyLoginProvider.
"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { DailyLoginModal } from "./DailyLoginModal";
import { useDailyLogin } from "./DailyLoginProvider";

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
    const timeout = window.setTimeout(() => setOpen(true), 0);
    return () => window.clearTimeout(timeout);
  }, [pathname, status]);

  if (!status || !open) return null;
  return <DailyLoginModal status={status} onClaimed={markClaimed} onClose={() => setOpen(false)} />;
}
