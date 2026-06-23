// src/components/hub/progression/MissionsLauncher.tsx - Botón flotante del hub que abre el panel de misiones (con badge de reclamables). Oculto durante duelos/partidas.
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { IMissionView } from "@/core/entities/progression/IMission";
import { MissionsPanel } from "./MissionsPanel";

/** Rutas inmersivas donde no debe aparecer el botón (no interrumpir el duelo). */
function isImmersiveRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.includes("/duel/") || pathname.includes("/multiplayer/match/");
}

export function MissionsLauncher({ missions }: { missions: IMissionView[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (isImmersiveRoute(pathname)) return null;

  const claimableCount = missions.filter((mission) => mission.completed && !mission.claimed).length;

  return (
    <>
      <button
        type="button"
        aria-label="Abrir misiones"
        className="fixed bottom-4 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-700/70 bg-slate-900/90 text-cyan-200 shadow-lg backdrop-blur transition hover:bg-slate-800"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
        {claimableCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-black text-slate-950">
            {claimableCount}
          </span>
        ) : null}
      </button>
      {open ? <MissionsPanel missions={missions} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
