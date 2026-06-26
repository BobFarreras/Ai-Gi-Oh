// src/components/hub/progression/DailyLoginProvider.tsx - Estado compartido de la recompensa diaria entre el popup automático (Gate) y el dock, para que reclamar en cualquiera actualice el badge y el modal sin recargar.
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { IDailyLoginClaimResult, ILoginStreakStatus } from "@/core/entities/progression/ILoginStreak";

interface IDailyLoginContext {
  status: ILoginStreakStatus | null;
  /** Marca el día como reclamado para todos los consumidores (Gate + dock). */
  markClaimed: (result: IDailyLoginClaimResult) => void;
}

const DailyLoginContext = createContext<IDailyLoginContext | null>(null);

export function DailyLoginProvider({ initialStatus, children }: { initialStatus: ILoginStreakStatus | null; children: ReactNode }) {
  const [status, setStatus] = useState(initialStatus);
  const markClaimed = (result: IDailyLoginClaimResult) =>
    setStatus((prev) => (prev ? { ...prev, claimedToday: true, currentStreak: result.currentStreak } : prev));
  return <DailyLoginContext.Provider value={{ status, markClaimed }}>{children}</DailyLoginContext.Provider>;
}

export function useDailyLogin(): IDailyLoginContext {
  return useContext(DailyLoginContext) ?? { status: null, markClaimed: () => undefined };
}
