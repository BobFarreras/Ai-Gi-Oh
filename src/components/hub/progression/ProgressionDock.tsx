// src/components/hub/progression/ProgressionDock.tsx - Dock táctico unificado (misiones, evento, novedades) arriba-izquierda. Mismo lenguaje HUD que "Recentrar"; responsive (icono+label en desktop, solo icono en móvil).
"use client";

import { ReactNode, useState } from "react";
import { usePathname } from "next/navigation";
import { IMissionView } from "@/core/entities/progression/IMission";
import { IEventOverview } from "@/core/entities/progression/IEvent";
import { IFeaturedPromotion } from "@/core/entities/progression/IPromotion";
import { MissionsPanel } from "./MissionsPanel";
import { EventPanel } from "./EventPanel";
import { NewsPanel } from "./NewsPanel";

type DockPanel = "missions" | "event" | "news" | null;

interface IProgressionDockProps {
  missions: IMissionView[];
  eventOverview: IEventOverview | null;
  promotions: IFeaturedPromotion[];
}

/** Rutas inmersivas donde el dock no debe aparecer (no interrumpir el duelo). */
function isImmersiveRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.includes("/duel/") || pathname.includes("/multiplayer/match/");
}

const CLIP_PATH = "polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)";

function DockButton({
  label,
  badge,
  badgeTone = "amber",
  onClick,
  children,
}: {
  label: string;
  badge?: number | "dot" | null;
  badgeTone?: "amber" | "cyan";
  onClick: () => void;
  children: ReactNode;
}) {
  const toneClass = badgeTone === "cyan" ? "bg-cyan-400 text-slate-950" : "bg-amber-400 text-slate-950";
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{ clipPath: CLIP_PATH }}
      className="pointer-events-auto relative flex h-11 items-center gap-2 border border-cyan-500/50 bg-[#030914]/85 px-2.5 font-mono text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition-all hover:border-cyan-300 hover:shadow-[0_0_18px_rgba(34,211,238,0.45)] sm:text-xs"
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">{children}</span>
      <span className="hidden pr-1 sm:inline">{label}</span>
      {badge === "dot" ? (
        <span className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#030914] ${toneClass}`} />
      ) : typeof badge === "number" && badge > 0 ? (
        <span className={`absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] leading-none ${toneClass}`}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function ProgressionDock({ missions, eventOverview, promotions }: IProgressionDockProps) {
  const [panel, setPanel] = useState<DockPanel>(null);
  const pathname = usePathname();
  if (isImmersiveRoute(pathname)) return null;

  const claimableMissions = missions.filter((mission) => mission.completed && !mission.claimed).length;
  const canRedeemEvent = eventOverview
    ? eventOverview.items.some((item) => eventOverview.balance >= item.costPoints && item.owned < item.perPlayerLimit)
    : false;

  const hasAnything = missions.length > 0 || eventOverview !== null || promotions.length > 0;
  if (!hasAnything) return null;

  return (
    <>
      <div className="pointer-events-none fixed left-[max(0.5rem,env(safe-area-inset-left))] top-[max(0.5rem,env(safe-area-inset-top))] z-40 flex flex-col gap-2 sm:left-4 sm:top-4">
        {missions.length > 0 ? (
          <DockButton label="Misiones" badge={claimableMissions} onClick={() => setPanel("missions")}>
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          </DockButton>
        ) : null}

        {eventOverview ? (
          <DockButton label="Evento" badge={canRedeemEvent ? "dot" : null} onClick={() => setPanel("event")}>
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 5.2L20 8l-4 4 1 6-5-2.8L7 18l1-6-4-4 5.6-.8z" />
            </svg>
          </DockButton>
        ) : null}

        {promotions.length > 0 ? (
          <DockButton label="Novedades" badge={promotions.length} badgeTone="cyan" onClick={() => setPanel("news")}>
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.7 21a2 2 0 0 1-3.4 0" />
            </svg>
          </DockButton>
        ) : null}
      </div>

      {panel === "missions" ? <MissionsPanel missions={missions} onClose={() => setPanel(null)} /> : null}
      {panel === "event" && eventOverview ? <EventPanel overview={eventOverview} onClose={() => setPanel(null)} /> : null}
      {panel === "news" ? <NewsPanel promotions={promotions} onClose={() => setPanel(null)} /> : null}
    </>
  );
}
