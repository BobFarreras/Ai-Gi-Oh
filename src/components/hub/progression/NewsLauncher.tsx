// src/components/hub/progression/NewsLauncher.tsx - Botón flotante del hub para noticias/promociones. Oculto en duelos/partidas.
"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { IFeaturedPromotion } from "@/core/entities/progression/IPromotion";
import { NewsPanel } from "./NewsPanel";

function isImmersiveRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.includes("/duel/") || pathname.includes("/multiplayer/match/");
}

export function NewsLauncher({ promotions }: { promotions: IFeaturedPromotion[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  if (isImmersiveRoute(pathname)) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Abrir novedades"
        className="fixed bottom-36 left-4 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-cyan-700/70 bg-slate-900/90 text-cyan-200 shadow-lg backdrop-blur transition hover:bg-slate-800"
        onClick={() => setOpen(true)}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {promotions.length > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-cyan-400 px-1 text-[11px] font-black text-slate-950">
            {promotions.length}
          </span>
        ) : null}
      </button>
      {open ? <NewsPanel promotions={promotions} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
