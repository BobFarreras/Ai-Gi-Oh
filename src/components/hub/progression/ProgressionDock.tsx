// src/components/hub/progression/ProgressionDock.tsx - Dock táctico futurista (misiones, evento, novedades) abajo-izquierda. Entra deslizando desde la izquierda (mismo timing que el HUD). Responsive: icono+label en desktop, solo icono en móvil.
"use client";

import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { IMissionView } from "@/core/entities/progression/IMission";
import { IEventOverview } from "@/core/entities/progression/IEvent";
import { IFeaturedPromotion } from "@/core/entities/progression/IPromotion";
import { HUB_HUD_ANIMATION_DURATION, HUB_HUD_START_DELAY_MS } from "@/components/hub/internal/hub-entry-timings";
import { MissionsPanel } from "./MissionsPanel";
import { EventPanel } from "./EventPanel";
import { NewsPanel } from "./NewsPanel";

type DockPanel = "missions" | "event" | "news" | null;

interface IProgressionDockProps {
  missions: IMissionView[];
  eventOverview: IEventOverview | null;
  promotions: IFeaturedPromotion[];
}

function isImmersiveRoute(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname.includes("/duel/") || pathname.includes("/multiplayer/match/");
}

/** Esquinas cortadas (top-left + bottom-right) para el look HUD táctico. */
const CLIP_PATH = "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)";
/** Scanlines sutiles estáticas (sin animación: cero coste GPU continuo). */
const SCANLINES = "repeating-linear-gradient(0deg,rgba(34,211,238,0.05) 0,rgba(34,211,238,0.05) 1px,transparent 1px,transparent 3px)";

function DockButton({
  index,
  label,
  badge,
  badgeTone = "amber",
  onClick,
  children,
}: {
  index: string;
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
      style={{ clipPath: CLIP_PATH, backgroundImage: SCANLINES }}
      className="group pointer-events-auto relative flex h-11 items-center gap-2.5 border border-cyan-500/40 bg-[#03101c]/90 pl-3 pr-3.5 text-cyan-100 transition-all duration-200 hover:translate-x-0.5 hover:border-cyan-300/90 hover:bg-[#04192b]/95 hover:shadow-[0_0_18px_rgba(34,211,238,0.4)]"
    >
      <span className="absolute inset-y-1 left-0 w-[3px] bg-cyan-500/70 transition-all duration-200 group-hover:bg-cyan-300 group-hover:shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
      <span className="hidden font-mono text-[9px] font-bold tracking-[0.2em] text-cyan-500/60 sm:inline">{index}</span>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-cyan-200 transition-colors group-hover:text-cyan-50">{children}</span>
      <span className="hidden font-mono text-[11px] font-black uppercase tracking-[0.16em] text-cyan-100/90 group-hover:text-cyan-50 sm:inline">{label}</span>
      {badge === "dot" ? (
        <span className={`absolute right-1 top-1 h-2.5 w-2.5 ${toneClass}`} style={{ clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }} />
      ) : typeof badge === "number" && badge > 0 ? (
        <span
          className={`absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center px-1 font-mono text-[10px] font-black leading-none ${toneClass}`}
          style={{ clipPath: "polygon(3px 0,100% 0,100% calc(100% - 3px),calc(100% - 3px) 100%,0 100%,0 3px)" }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function ProgressionDock({ missions, eventOverview, promotions }: IProgressionDockProps) {
  const [panel, setPanel] = useState<DockPanel>(null);
  const [canShow, setCanShow] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const timeout = window.setTimeout(() => setCanShow(true), HUB_HUD_START_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  if (isImmersiveRoute(pathname)) return null;

  const claimableMissions = missions.filter((mission) => mission.completed && !mission.claimed).length;
  const canRedeemEvent = eventOverview
    ? eventOverview.items.some((item) => eventOverview.balance >= item.costPoints && item.owned < item.perPlayerLimit)
    : false;

  const hasAnything = missions.length > 0 || eventOverview !== null || promotions.length > 0;
  if (!hasAnything) return null;

  return (
    <>
      {canShow ? (
        <motion.div
          initial={{ x: "-120vw" }}
          animate={{ x: 0 }}
          transition={{ duration: HUB_HUD_ANIMATION_DURATION, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: "transform" }}
          className="pointer-events-none fixed z-40 flex flex-col gap-2.5 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] left-[max(0.5rem,env(safe-area-inset-left))] sm:bottom-6 sm:left-6"
        >
          {missions.length > 0 ? (
            <DockButton index="01" label="Misiones" badge={claimableMissions} onClick={() => setPanel("missions")}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </DockButton>
          ) : null}

          {eventOverview ? (
            <DockButton index="02" label="Evento" badge={canRedeemEvent ? "dot" : null} onClick={() => setPanel("event")}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 5.2L20 8l-4 4 1 6-5-2.8L7 18l1-6-4-4 5.6-.8z" />
              </svg>
            </DockButton>
          ) : null}

          {promotions.length > 0 ? (
            <DockButton index="03" label="Novedades" badge={promotions.length} badgeTone="cyan" onClick={() => setPanel("news")}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.7 21a2 2 0 0 1-3.4 0" />
              </svg>
            </DockButton>
          ) : null}
        </motion.div>
      ) : null}

      {panel === "missions" ? <MissionsPanel missions={missions} onClose={() => setPanel(null)} /> : null}
      {panel === "event" && eventOverview ? <EventPanel overview={eventOverview} onClose={() => setPanel(null)} /> : null}
      {panel === "news" ? <NewsPanel promotions={promotions} onClose={() => setPanel(null)} /> : null}
    </>
  );
}
