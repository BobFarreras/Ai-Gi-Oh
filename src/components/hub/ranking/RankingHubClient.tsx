// src/components/hub/ranking/RankingHubClient.tsx - Orquestador de la página de ranking con SELECTOR entre
// los tres tableros (Multijugador / Actividad / Comercial). Al cambiar de tablero, las filas animan hacia
// su nueva posición (framer-motion layout) y las que entran/salen hacen fade. Cada fila muestra su métrica.
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, CalendarClock, Home, ShoppingBag, Swords, Users, Zap } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { UserSearchInput } from "@/components/hub/internal/UserSearchInput";
import { IRankingBoard, IRankingBoardsData, RankingBoardId } from "@/services/ranking/get-ranking-boards";
import { formatResetCountdown, msUntilWeeklyLeaderboardReset } from "@/core/services/progression/reset-schedule";
import { RankingBoardRow } from "./RankingBoardRow";

interface RankingHubClientProps {
  data: IRankingBoardsData;
}

const BOARD_META: Record<RankingBoardId, { label: string; icon: typeof Swords; isWeekly: boolean }> = {
  MULTIPLAYER: { label: "Multijugador", icon: Swords, isWeekly: false },
  ACTIVITY: { label: "Actividad", icon: Activity, isWeekly: true },
  COMMERCIAL: { label: "Comercio", icon: ShoppingBag, isWeekly: true },
};

/** Chip de "tu puntuación" por tablero (etiqueta + color + icono). */
const VALUE_CHIP: Record<RankingBoardId, { label: string; icon: typeof Zap; border: string; text: string }> = {
  MULTIPLAYER: { label: "ELO", icon: Zap, border: "border-amber-500/40", text: "text-amber-300" },
  ACTIVITY: { label: "pts", icon: Activity, border: "border-cyan-500/40", text: "text-cyan-300" },
  COMMERCIAL: { label: "pts", icon: ShoppingBag, border: "border-amber-500/40", text: "text-amber-300" },
};

function useWeeklyCountdown(active: boolean): string {
  const [label] = useState(() => formatResetCountdown(msUntilWeeklyLeaderboardReset(Date.now())));
  return active ? label : "";
}

export function RankingHubClient({ data }: RankingHubClientProps) {
  const [activeId, setActiveId] = useState<RankingBoardId>(data.boards[0]?.id ?? "MULTIPLAYER");
  const [query, setQuery] = useState("");

  const activeBoard = useMemo<IRankingBoard | null>(
    () => data.boards.find((board) => board.id === activeId) ?? null,
    [data.boards, activeId],
  );
  const meta = BOARD_META[activeId];
  const countdown = useWeeklyCountdown(meta.isWeekly);
  const valueChip = VALUE_CHIP[activeId];
  const ValueIcon = valueChip.icon;
  const totalDuelists = activeBoard?.entries.length ?? 0;

  const filtered = useMemo(() => {
    const entries = activeBoard?.entries ?? [];
    const needle = query.trim().toLowerCase();
    if (!needle) return entries;
    return entries.filter((entry) => entry.nickname.toLowerCase().includes(needle));
  }, [activeBoard, query]);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Cabecera con SELECTOR de ranking */}
      <header className="relative flex w-full items-center gap-2 rounded-xl border border-cyan-800/50 bg-[#041120]/90 p-2 shadow-[0_0_20px_rgba(8,145,178,0.15)] backdrop-blur-xl sm:gap-3 sm:px-3">
        <BackButton href="/hub/multiplayer" label="" className="px-2 py-1.5" />

        <div className="home-modern-scroll flex flex-1 items-center gap-1 overflow-x-auto rounded-lg border border-slate-700/50 bg-[#020a14]/80 p-1">
          {data.boards.map((board) => {
            const boardMeta = BOARD_META[board.id];
            const Icon = boardMeta.icon;
            const isActive = board.id === activeId;
            return (
              <button
                key={board.id}
                type="button"
                onClick={() => setActiveId(board.id)}
                aria-pressed={isActive}
                className={`relative flex shrink-0 items-center gap-1.5 rounded-md px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors ${
                  isActive ? "text-slate-950" : "text-slate-400 hover:text-slate-100"
                }`}
              >
                {isActive ? (
                  <motion.span
                    layoutId="ranking-selector-pill"
                    className="absolute inset-0 rounded-md bg-gradient-to-r from-cyan-400 to-sky-500 shadow-[0_0_16px_rgba(34,211,238,0.5)]"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                ) : null}
                <Icon size={15} className="relative z-10 shrink-0" />
                <span className="relative z-10">{boardMeta.label}</span>
              </button>
            );
          })}
        </div>

        <Link
          href="/hub"
          aria-label="Volver a la sala de control"
          className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-600/50 bg-[#021426]/85 px-2.5 py-2 text-sm font-black uppercase tracking-widest text-slate-300 transition hover:border-slate-400/70 hover:text-slate-100 sm:px-3"
        >
          <Home size={16} className="shrink-0" />
          <span className="hidden lg:inline">Hub</span>
        </Link>
      </header>

      {/* Stats del tablero activo: tu puntuación, total de duelistas y tu posición (cada apartado, la suya) */}
      <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
        {meta.isWeekly && countdown ? (
          <span className="mr-auto flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-500/40 bg-violet-950/30 px-2.5 py-1.5 text-[11px] font-black text-violet-200" title="Cierre y premios los domingos por la noche">
            <CalendarClock size={14} /> {countdown}
          </span>
        ) : null}
        {activeBoard && activeBoard.localValue !== null ? (
          <div className={`flex items-center gap-1.5 rounded-lg border ${valueChip.border} bg-[#020a14]/90 px-2.5 py-1.5 shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] sm:px-3.5`} aria-label={`Tu puntuación: ${activeBoard.localValue}`}>
            <ValueIcon size={16} className={valueChip.text} />
            <span className={`text-sm font-black tabular-nums ${valueChip.text} sm:text-base`}>{activeBoard.localValue.toLocaleString()}</span>
            <span className="hidden text-[11px] font-bold uppercase tracking-widest text-slate-500 sm:inline">{valueChip.label}</span>
          </div>
        ) : null}
        <div className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-[#020a14]/90 px-2.5 py-1.5 shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] sm:px-3.5" aria-label={`${totalDuelists} duelistas clasificados`}>
          <Users size={16} className="text-cyan-400" />
          <span className="text-sm font-black tabular-nums text-cyan-300 sm:text-base">{totalDuelists}</span>
          <span className="hidden text-[11px] font-bold uppercase tracking-widest text-cyan-600 sm:inline">duelistas</span>
        </div>
        {activeBoard?.localRank ? (
          <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1.5 shadow-[0_0_10px_rgba(52,211,153,0.25)] sm:px-3.5" aria-label={`Tu posición: ${activeBoard.localRank}`}>
            <span className="text-sm font-black tabular-nums text-emerald-300 sm:text-base">#{activeBoard.localRank}</span>
            <span className="hidden text-[11px] font-bold uppercase tracking-widest text-emerald-400 sm:inline">tú</span>
          </div>
        ) : null}
      </div>

      <UserSearchInput value={query} onChange={setQuery} placeholder="Buscar duelista…" />

      {/* Lista animada */}
      <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-700/50 bg-slate-900/30 p-2">
        <div className="home-modern-scroll min-h-0 flex-1 overflow-y-auto pr-1">
          {filtered.length === 0 ? (
            <div className="flex h-full items-center justify-center px-4 py-8 text-center">
              <p className="text-sm text-slate-400">
                {query.trim() ? "Ningún duelista coincide con la búsqueda." : "Aún no hay clasificados en este ranking."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 pt-1">
              <AnimatePresence mode="popLayout" initial={false}>
                {filtered.map((entry) => (
                  <RankingBoardRow
                    key={entry.playerId}
                    entry={entry}
                    isLocal={entry.playerId === data.localPlayerId}
                    boardId={activeId}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
