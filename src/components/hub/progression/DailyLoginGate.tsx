// src/components/hub/progression/DailyLoginGate.tsx - Abre automáticamente el modal de recompensa diaria si el jugador no ha reclamado hoy. Comparte estado con el dock vía DailyLoginProvider.
"use client";

import { useState } from "react";
import { DailyLoginModal } from "./DailyLoginModal";
import { useDailyLogin } from "./DailyLoginProvider";

export function DailyLoginGate() {
  const { status, markClaimed } = useDailyLogin();
  const [open, setOpen] = useState(status ? !status.claimedToday : false);
  if (!status || !open) return null;
  return <DailyLoginModal status={status} onClaimed={markClaimed} onClose={() => setOpen(false)} />;
}
