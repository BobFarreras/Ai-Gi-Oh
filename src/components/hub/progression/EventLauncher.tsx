// src/components/hub/progression/EventLauncher.tsx - Botón flotante del hub para el evento activo (con punto si hay algo canjeable). Oculto en duelos/partidas.
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { IEventOverview } from "@/core/entities/progression/IEvent";
import { EventPanel } from "./EventPanel";

function isImmersiveRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.includes("/duel/") || pathname.includes("/multiplayer/match/");
}

export function EventLauncher({ overview }: { overview: IEventOverview }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (isImmersiveRoute(pathname)) return null;

  const canRedeem = overview.items.some((item) => overview.balance >= item.costPoints && item.owned < item.perPlayerLimit);

  return (
    <>
      <button
        type="button"
        aria-label="Abrir evento"
        className="fixed bottom-20 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-fuchsia-700/70 bg-slate-900/90 text-fuchsia-200 shadow-lg backdrop-blur transition hover:bg-slate-800"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 5.2L20 8l-4 4 1 6-5-2.8L7 18l1-6-4-4 5.6-.8z" />
        </svg>
        {canRedeem ? <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-amber-400" /> : null}
      </button>
      {open ? <EventPanel overview={overview} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
