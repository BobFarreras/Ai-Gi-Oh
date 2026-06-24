// src/components/hub/progression/ProgressionDock.tsx - Dock táctico en cluster (2 abajo + 1 encima). Solo en la escena del hub (/hub), igual que el HUD. Carga deslizando desde la izquierda; sin flotación. Labels en desktop, iconos en móvil. Diálogos que se despliegan desde el dock.
"use client";

import { ReactNode, useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

const CLIP_PATH = "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)";
const SCANLINES = "repeating-linear-gradient(0deg,rgba(34,211,238,0.05) 0,rgba(34,211,238,0.05) 1px,transparent 1px,transparent 3px)";
const BADGE_CLIP = "polygon(4px 0,100% 0,100% calc(100% - 4px),calc(100% - 4px) 100%,0 100%,0 4px)";

/** Contador angular tipo HUD con halo de pulso. Vive FUERA del recorte del botón para no cortarse. */
function CountBadge({ count, tone }: { count: number; tone: "amber" | "cyan" }) {
  const fill = tone === "cyan" ? "bg-cyan-400 text-cyan-950 border-cyan-100" : "bg-amber-400 text-amber-950 border-amber-100";
  const halo = tone === "cyan" ? "bg-cyan-400/50" : "bg-amber-400/50";
  return (
    <span className="pointer-events-none absolute -right-2.5 -top-2.5 z-20 flex h-5 min-w-[20px] items-center justify-center">
      <motion.span
        aria-hidden
        className={`absolute inset-0 ${halo}`}
        style={{ clipPath: BADGE_CLIP }}
        animate={{ scale: [1, 1.7], opacity: [0.55, 0] }}
        transition={{ duration: 1.9, repeat: Infinity, ease: "easeOut" }}
      />
      <span className={`relative flex h-5 min-w-[20px] items-center justify-center border px-1 font-mono text-[11px] font-black leading-none ${fill}`} style={{ clipPath: BADGE_CLIP }}>
        {count > 9 ? "9+" : count}
      </span>
    </span>
  );
}

/** Indicador de "hay algo que canjear" en el evento: rombo con halo de pulso. */
function RedeemDiamond() {
  return (
    <span className="pointer-events-none absolute -right-1 -top-1 z-20 flex h-3.5 w-3.5 items-center justify-center">
      <motion.span
        aria-hidden
        className="absolute inset-0 bg-amber-400/55"
        style={{ clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }}
        animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
        transition={{ duration: 1.9, repeat: Infinity, ease: "easeOut" }}
      />
      <span className="relative h-2.5 w-2.5 bg-amber-400" style={{ clipPath: "polygon(50% 0,100% 50%,50% 100%,0 50%)" }} />
    </span>
  );
}

function DockButton({
  label,
  badge,
  onClick,
  children,
}: {
  label: string;
  badge?: ReactNode;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div className="pointer-events-auto relative">
      <motion.button
        type="button"
        aria-label={label}
        onClick={onClick}
        whileHover={{ scale: 1.07 }}
        whileTap={{ scale: 0.94 }}
        style={{ clipPath: CLIP_PATH, backgroundImage: SCANLINES }}
        className="group flex h-12 w-12 items-center justify-center gap-2 border border-cyan-500/45 bg-[#03101c]/90 text-cyan-100 transition-colors duration-200 hover:border-cyan-300/90 hover:bg-[#04192b]/95 hover:shadow-[0_0_18px_rgba(34,211,238,0.45)] sm:w-auto sm:justify-start sm:px-3.5"
      >
        <span className="absolute inset-y-1.5 left-0 w-[3px] bg-cyan-500/70 transition-all duration-200 group-hover:bg-cyan-300" />
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-cyan-200 transition-colors group-hover:text-cyan-50">{children}</span>
        <span className="hidden font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-100/90 group-hover:text-cyan-50 sm:inline">{label}</span>
      </motion.button>
      {badge}
    </div>
  );
}

export function ProgressionDock({ missions: initialMissions, eventOverview: initialEvent, promotions }: IProgressionDockProps) {
  const [panel, setPanel] = useState<DockPanel>(null);
  const [canShow, setCanShow] = useState(false);
  const [missions, setMissions] = useState(initialMissions);
  const [eventOverview, setEventOverview] = useState(initialEvent);
  const pathname = usePathname();

  useEffect(() => {
    const timeout = window.setTimeout(() => setCanShow(true), HUB_HUD_START_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  // Refresca el estado en vivo (misiones + evento) sin recargar: el SSR de layout no se
  // re-ejecuta al navegar dentro del hub, así que el progreso quedaría obsoleto.
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/progression/state");
      if (!response.ok) return;
      const data = (await response.json()) as { missions: IMissionView[]; event: IEventOverview | null };
      setMissions(data.missions ?? []);
      setEventOverview(data.event ?? null);
    } catch {
      // Silencioso: si falla, se mantiene el último estado conocido.
    }
  }, []);

  // Al (re)entrar en el hub, refresca para reflejar duelos/compras recién hechos.
  useEffect(() => {
    if (pathname !== "/hub") return;
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/progression/state");
        if (!active || !response.ok) return;
        const data = (await response.json()) as { missions: IMissionView[]; event: IEventOverview | null };
        if (!active) return;
        setMissions(data.missions ?? []);
        setEventOverview(data.event ?? null);
      } catch {
        // Silencioso.
      }
    })();
    return () => {
      active = false;
    };
  }, [pathname]);

  const handleClose = useCallback(() => {
    setPanel(null);
    void refresh();
  }, [refresh]);

  // Solo en la escena del hub (/hub), igual que el HUD; no en market/story/academy/etc.
  if (pathname !== "/hub") return null;

  const claimableMissions = missions.filter((mission) => mission.completed && !mission.claimed).length;
  const canRedeemEvent = eventOverview
    ? eventOverview.items.some((item) => eventOverview.balance >= item.costPoints && item.owned < item.perPlayerLimit)
    : false;

  const buttons: ReactNode[] = [];
  if (missions.length > 0) {
    buttons.push(
      <DockButton key="missions" label="Misiones" badge={claimableMissions > 0 ? <CountBadge count={claimableMissions} tone="amber" /> : null} onClick={() => setPanel("missions")}>
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      </DockButton>,
    );
  }
  if (eventOverview) {
    buttons.push(
      <DockButton key="event" label="Evento" badge={canRedeemEvent ? <RedeemDiamond /> : null} onClick={() => setPanel("event")}>
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l2.4 5.2L20 8l-4 4 1 6-5-2.8L7 18l1-6-4-4 5.6-.8z" />
        </svg>
      </DockButton>,
    );
  }
  if (promotions.length > 0) {
    buttons.push(
      <DockButton key="news" label="Novedades" badge={<CountBadge count={promotions.length} tone="cyan" />} onClick={() => setPanel("news")}>
        <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      </DockButton>,
    );
  }

  if (buttons.length === 0) return null;

  return (
    <>
      {canShow ? (
        <motion.div
          initial={{ x: "-120vw" }}
          animate={{ x: 0 }}
          transition={{ duration: HUB_HUD_ANIMATION_DURATION, ease: [0.16, 1, 0.3, 1] }}
          style={{ willChange: "transform" }}
          className="pointer-events-none fixed z-40 bottom-[calc(env(safe-area-inset-bottom)+4.5rem)] left-[max(0.5rem,env(safe-area-inset-left))] sm:bottom-6 sm:left-6"
        >
          {buttons.length >= 3 ? (
            <div className="flex flex-col items-center gap-2.5">
              <div>{buttons[0]}</div>
              <div className="flex gap-2.5">
                {buttons[1]}
                {buttons[2]}
              </div>
            </div>
          ) : buttons.length === 2 ? (
            <div className="flex gap-2.5">
              {buttons[0]}
              {buttons[1]}
            </div>
          ) : (
            <div>{buttons[0]}</div>
          )}
        </motion.div>
      ) : null}

      <AnimatePresence>
        {panel === "missions" ? <MissionsPanel key="missions" missions={missions} onClose={handleClose} /> : null}
        {panel === "event" && eventOverview ? <EventPanel key="event" overview={eventOverview} onClose={handleClose} /> : null}
        {panel === "news" ? <NewsPanel key="news" promotions={promotions} onClose={handleClose} /> : null}
      </AnimatePresence>
    </>
  );
}
