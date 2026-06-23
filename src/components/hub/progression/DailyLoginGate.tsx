// src/components/hub/progression/DailyLoginGate.tsx - Abre automáticamente el modal de recompensa diaria si el jugador no ha reclamado hoy.
"use client";

import { useState } from "react";
import { ILoginStreakStatus } from "@/core/entities/progression/ILoginStreak";
import { DailyLoginModal } from "./DailyLoginModal";

export function DailyLoginGate({ status }: { status: ILoginStreakStatus }) {
  const [open, setOpen] = useState(!status.claimedToday);
  if (!open) return null;
  return <DailyLoginModal status={status} onClose={() => setOpen(false)} />;
}
