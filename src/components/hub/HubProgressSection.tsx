// src/components/hub/HubProgressSection.tsx - Widget HUD con métricas de progreso del arquitecto en el hub.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Coins, Library, Medal, ShieldCheck, Trophy, type LucideIcon } from "lucide-react";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { isHubSectionTypeUnlocked, isTutorialGateActive } from "@/core/services/hub/HubAccessPolicy";
import { getEloLeague, getLeagueStyle, type EloLeague } from "@/components/hub/ranking/internal/tier";

type ProgressTone = "amber" | "cyan" | "emerald" | "orange" | "violet";

interface IProgressItemProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone: ProgressTone;
  /** Destino de navegación; si se omite, el recuadro es informativo (no interactivo). */
  href?: string;
  /** Bloqueado por el gate del tutorial: se muestra atenuado y no navega. */
  locked?: boolean;
  /** Texto accesible para el destino, p.ej. "Ir al Mercado". */
  navLabel?: string;
  onNavigate?: (href: string) => void;
}

const ICON_TONE_CLASS: Record<ProgressTone, string> = {
  amber: "text-amber-200",
  cyan: "text-cyan-200",
  emerald: "text-emerald-200",
  orange: "text-orange-200",
  violet: "text-violet-200",
};

const BORDER_TONE_CLASS: Record<ProgressTone, string> = {
  amber: "border-amber-500/30 bg-amber-950/20",
  cyan: "border-cyan-500/30 bg-cyan-950/20",
  emerald: "border-emerald-500/30 bg-emerald-950/20",
  orange: "border-orange-500/30 bg-orange-950/20",
  violet: "border-violet-500/30 bg-violet-950/20",
};

const VALUE_TONE_CLASS: Record<ProgressTone, string> = {
  amber: "text-amber-300",
  cyan: "text-cyan-200",
  emerald: "text-emerald-300",
  orange: "text-orange-300",
  violet: "text-violet-300",
};

function ProgressItem({ label, value, icon: Icon, tone, href, locked = false, navLabel, onNavigate }: IProgressItemProps) {
  const baseClass = `flex items-center gap-1 rounded-sm border px-1.5 py-1 shadow-[inset_0_0_15px_rgba(0,0,0,0.2)] sm:gap-2 sm:px-2 ${BORDER_TONE_CLASS[tone]}`;
  const inner = (
    <>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-black/30 sm:h-10 sm:w-10">
        <Icon className={`h-3.5 w-3.5 animate-pulse sm:h-5 sm:w-5 ${ICON_TONE_CLASS[tone]}`} />
      </div>
      <div className="flex min-w-0 flex-col text-left">
        <span className="font-mono text-[6px] uppercase tracking-[0.12em] text-white/60 sm:text-[8px] sm:tracking-widest">{label}</span>
        <span className={`truncate font-mono text-[11px] font-black leading-tight sm:text-base ${VALUE_TONE_CLASS[tone]}`}>{value}</span>
      </div>
    </>
  );

  if (!href) return <div className={baseClass}>{inner}</div>;

  return (
    <button
      type="button"
      aria-label={locked ? `${navLabel ?? label} (bloqueado: completa el tutorial)` : navLabel ?? `Ir a ${label}`}
      aria-disabled={locked}
      disabled={locked}
      onClick={() => onNavigate?.(href)}
      className={`${baseClass} w-full text-left transition enabled:cursor-pointer enabled:hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {inner}
    </button>
  );
}

interface IHudStats {
  eloRating: number;
  nexus: number;
  collectionCount: number;
}

const LEAGUE_TONE: Record<EloLeague, ProgressTone> = {
  bronze: "orange",
  silver: "cyan",
  gold: "amber",
  diamond: "cyan",
  master: "violet",
};

interface HubProgressSectionProps {
  progress: IPlayerHubProgress;
  onToggleSound?: () => void;
}

export function HubProgressSection({ progress, onToggleSound }: HubProgressSectionProps) {
  const router = useRouter();
  const tutorialTone: ProgressTone = progress.hasCompletedTutorial ? "emerald" : progress.hasSkippedTutorial ? "amber" : "orange";
  const tutorialValue = progress.hasCompletedTutorial ? "Listo" : progress.hasSkippedTutorial ? "Libre" : "Pendiente";
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const [stats, setStats] = useState<IHudStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState(false);

  const league = stats ? getEloLeague(stats.eloRating) : null;
  const leagueLabel = league ? getLeagueStyle(league).label : "";

  // Gateo alineado con HubAccessPolicy (única fuente de verdad). Arena y Academy son TRAINING
  // (siempre accesibles); el Ranking no es una sección del hub, se bloquea mientras el gate siga activo.
  const gateActive = isTutorialGateActive(progress);
  const marketLocked = !isHubSectionTypeUnlocked("MARKET", progress);
  const arsenalLocked = !isHubSectionTypeUnlocked("HOME", progress);
  const storyLocked = !isHubSectionTypeUnlocked("STORY", progress);

  function navigate(href: string): void {
    onToggleSound?.();
    router.push(href);
  }

  /** Carga lazy: solo se dispara desde el click de "Ver más" (no en render/efecto). */
  async function loadStats(): Promise<void> {
    setIsLoadingStats(true);
    setStatsError(false);
    try {
      const response = await fetch("/api/player/hud-stats", { credentials: "include" });
      if (!response.ok) throw new Error("hud-stats failed");
      setStats((await response.json()) as IHudStats);
    } catch {
      setStatsError(true);
    } finally {
      setIsLoadingStats(false);
    }
  }

  function toggleExtra(): void {
    onToggleSound?.();
    const next = !showExtra;
    setShowExtra(next);
    // Pide los datos la primera vez (o reintenta si la anterior falló).
    if (next && !isLoadingStats && (!stats || statsError)) void loadStats();
  }

  return (
    <section
      className="group relative mx-auto flex w-[92vw] max-w-[640px] flex-col items-center justify-center border border-cyan-500/40 bg-[#010a14]/90 px-2 py-2 shadow-[0_15px_40px_rgba(6,182,212,0.15)] backdrop-blur-md transition-all hover:border-cyan-400/80 hover:bg-[#021224]/95 sm:w-[600px] sm:px-4"
      style={{ clipPath: "polygon(15px 0, calc(100% - 15px) 0, 100% 15px, 100% calc(100% - 15px), calc(100% - 15px) 100%, 15px 100%, 0 calc(100% - 15px), 0 15px)" }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.3)_50%)] bg-[length:100%_4px] opacity-40" />
      <div className="absolute top-0 left-1/2 h-1 w-24 sm:w-32 -translate-x-1/2 bg-cyan-400 shadow-[0_0_20px_rgba(6,182,212,1)]" />
      <button
        type="button"
        aria-label={isCollapsed ? "Expandir estado del arquitecto" : "Contraer estado del arquitecto"}
        onClick={() => {
          onToggleSound?.();
          setIsCollapsed((previous) => !previous);
        }}
        className="relative z-10 flex w-full items-center justify-between border-b border-cyan-900/60 px-2 pb-1"
      >
        <div className="flex gap-1"><div className="h-1 w-3 sm:w-4 bg-cyan-500/50" /><div className="h-1 w-1 bg-cyan-500/50" /></div>
        <p className="font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-cyan-400">Estado del Arquitecto</p>
        <div className="flex items-center gap-1">
          <div className="h-1 w-1 bg-cyan-500/50" />
          <div className="h-1 w-3 sm:w-4 bg-cyan-500/50" />
          <span className="font-mono text-[10px] text-cyan-300">{isCollapsed ? "+" : "-"}</span>
        </div>
      </button>
      {!isCollapsed ? (
        <div className="relative z-10 mt-1.5 flex w-full flex-col gap-1.5 px-1">
          <div className="grid w-full grid-cols-3 gap-1 sm:gap-2">
            <ProgressItem label="Medallas" value={progress.medals} icon={Medal} tone="amber" href="/hub/academy/training/arena" navLabel="Ir a la Arena" onNavigate={navigate} />
            <ProgressItem label="Capítulo" value={progress.storyChapter} icon={BookOpen} tone="cyan" href="/hub/story" navLabel="Ir a Historia" locked={storyLocked} onNavigate={navigate} />
            <ProgressItem label="Tutorial" value={tutorialValue} icon={ShieldCheck} tone={tutorialTone} href="/hub/academy" navLabel="Ir a Academy" onNavigate={navigate} />
          </div>

          {showExtra ? (
            <div className="grid w-full grid-cols-3 gap-1 sm:gap-2">
              {isLoadingStats ? (
                <p className="col-span-3 py-1.5 text-center font-mono text-[9px] uppercase tracking-widest text-cyan-400/70">Cargando…</p>
              ) : statsError ? (
                <p className="col-span-3 py-1.5 text-center font-mono text-[9px] uppercase tracking-widest text-rose-300/80">Error al cargar</p>
              ) : stats ? (
                <>
                  <ProgressItem label={league ? `Liga ${leagueLabel}` : "Ranking"} value={stats.eloRating} icon={Trophy} tone={league ? LEAGUE_TONE[league] : "violet"} href="/hub/ranking" navLabel="Ir al Ranking" locked={gateActive} onNavigate={navigate} />
                  <ProgressItem label="Nexus" value={stats.nexus.toLocaleString()} icon={Coins} tone="amber" href="/hub/market" navLabel="Ir al Mercado" locked={marketLocked} onNavigate={navigate} />
                  <ProgressItem label="Colección" value={stats.collectionCount} icon={Library} tone="cyan" href="/hub/arsenal" navLabel="Ir al Arsenal" locked={arsenalLocked} onNavigate={navigate} />
                </>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            aria-expanded={showExtra}
            aria-label={showExtra ? "Ver menos estadísticas" : "Ver más estadísticas"}
            onClick={toggleExtra}
            className="flex w-full items-center justify-center gap-1 border-t border-cyan-900/40 pt-1 font-mono text-[8px] font-black uppercase tracking-[0.25em] text-cyan-400/80 transition-colors hover:text-cyan-200 sm:text-[9px]"
          >
            {showExtra ? "Ver menos" : "Ver más"}
            <svg viewBox="0 0 24 24" className={`h-3 w-3 fill-none stroke-current transition-transform ${showExtra ? "rotate-180" : ""}`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
          </button>
        </div>
      ) : null}
    </section>
  );
}
