// src/components/hub/ranking/WeeklyLeaderboardsClient.tsx - UI de los rankings semanales: dos tableros
// (Actividad / Comercial), tu posición, premios por puesto y cuenta atrás al cierre del domingo.
"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Activity, CalendarClock, Coins, Home, ShoppingBag, Trophy } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import Link from "next/link";
import { getAvatarGradientClasses, getAvatarInitial } from "@/components/hub/internal/avatar-color";
import {
  IWeeklyLeaderboardsData,
  WeeklyLeaderboardBoard,
} from "@/services/ranking/get-weekly-leaderboards";
import {
  formatResetCountdown,
  msUntilWeeklyLeaderboardReset,
} from "@/core/services/progression/reset-schedule";

interface WeeklyLeaderboardsClientProps {
  data: IWeeklyLeaderboardsData;
}

const BOARD_META: Record<WeeklyLeaderboardBoard, { label: string; icon: typeof Activity; hint: string; accent: string }> = {
  ACTIVITY: {
    label: "Actividad",
    icon: Activity,
    hint: "Suma jugando: +20 por combate y +15 por cada misión, evento o diaria reclamada.",
    accent: "cyan",
  },
  COMMERCIAL: {
    label: "Comercial",
    icon: ShoppingBag,
    hint: "Suma en el mercado: cartas compradas (+10), packs (+30) y evoluciones (+20).",
    accent: "amber",
  },
};

const RANK_STYLE: Record<number, string> = {
  1: "border-amber-400/70 bg-amber-500/15 text-amber-300",
  2: "border-slate-300/60 bg-slate-400/10 text-slate-200",
  3: "border-orange-400/60 bg-orange-500/10 text-orange-300",
};

function useCountdown(): string {
  const [label, setLabel] = useState(() => formatResetCountdown(msUntilWeeklyLeaderboardReset(Date.now())));
  useEffect(() => {
    const tick = () => setLabel(formatResetCountdown(msUntilWeeklyLeaderboardReset(Date.now())));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);
  return label;
}

export function WeeklyLeaderboardsClient({ data }: WeeklyLeaderboardsClientProps) {
  const [active, setActive] = useState<WeeklyLeaderboardBoard>("ACTIVITY");
  const countdown = useCountdown();

  const board = useMemo(() => data.boards.find((b) => b.board === active) ?? null, [data.boards, active]);
  const prizeByRank = useMemo(() => {
    const map = new Map<number, number>();
    for (const prize of board?.prizes ?? []) map.set(prize.rank, prize.rewardNexus);
    return map;
  }, [board]);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* Cabecera */}
      <header className="relative flex w-full items-center gap-3 rounded-xl border border-cyan-800/50 bg-[#041120]/90 p-2 shadow-[0_0_20px_rgba(8,145,178,0.15)] backdrop-blur-xl sm:px-4 sm:py-2.5">
        <BackButton href="/hub/ranking" label="" className="px-2 py-1.5" />
        <h1 className="hidden truncate text-lg font-black uppercase tracking-widest text-violet-100 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)] sm:block">
          Rankings semanales
        </h1>
        <div
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-violet-500/40 bg-[#020a14]/90 px-2.5 py-1.5 sm:gap-2 sm:px-3.5"
          aria-label={`Cierre y premios en ${countdown}`}
          title="Los premios se reparten los domingos por la noche"
        >
          <CalendarClock size={16} className="text-violet-300" />
          <span className="text-sm font-black tabular-nums text-violet-200 sm:text-base">{countdown}</span>
          <span className="hidden text-[11px] font-bold uppercase tracking-widest text-violet-400 sm:inline">al cierre</span>
        </div>
        <Link
          href="/hub"
          aria-label="Volver a la sala de control"
          className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-600/50 bg-[#021426]/85 px-3 py-2 text-sm font-black uppercase tracking-widest text-slate-300 transition hover:border-slate-400/70 hover:text-slate-100 sm:px-4"
        >
          <Home size={16} className="shrink-0" />
          <span className="hidden sm:inline">Hub</span>
        </Link>
      </header>

      {/* Pestañas de tablero (siempre los dos tableros) */}
      <div className="flex gap-2">
        {(Object.keys(BOARD_META) as WeeklyLeaderboardBoard[]).map((boardId) => {
          const meta = BOARD_META[boardId];
          const Icon = meta.icon;
          const isActive = boardId === active;
          return (
            <button
              key={boardId}
              type="button"
              onClick={() => setActive(boardId)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-black uppercase tracking-widest transition sm:text-sm ${
                isActive
                  ? "border-cyan-400/70 bg-cyan-500/15 text-cyan-100"
                  : "border-slate-700/50 bg-[#020a14]/70 text-slate-400 hover:border-cyan-600/50 hover:text-slate-200"
              }`}
            >
              <Icon size={16} className="shrink-0" />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Cómo se ganan puntos + tu posición */}
      <div className="rounded-lg border border-slate-700/50 bg-[#020a14]/70 px-3 py-2">
        <p className="text-[11px] leading-snug text-slate-400">{BOARD_META[active].hint}</p>
        {board && board.localRank ? (
          <p className="mt-1 flex items-center gap-1.5 text-xs font-bold text-emerald-300">
            <Trophy size={13} className="shrink-0" />
            Tu posición: #{board.localRank} · {board.localPoints} pts
          </p>
        ) : (
          <p className="mt-1 text-xs text-slate-500">Aún no tienes puntos esta semana en este tablero.</p>
        )}
      </div>

      {/* Lista */}
      <div className="home-modern-scroll flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {!board || board.entries.length === 0 ? (
          <p className="m-auto max-w-xs text-center font-mono text-xs uppercase tracking-widest text-slate-500">
            Sé el primero en puntuar esta semana.
          </p>
        ) : (
          board.entries.map((entry) => {
            const prize = prizeByRank.get(entry.rank) ?? 0;
            const isLocal = entry.playerId === data.localPlayerId;
            return (
              <div
                key={entry.playerId}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  isLocal ? "border-emerald-500/50 bg-emerald-950/20" : "border-slate-800/60 bg-[#03141f]/70"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-sm font-black tabular-nums ${
                    RANK_STYLE[entry.rank] ?? "border-slate-700/60 bg-slate-900/50 text-slate-400"
                  }`}
                >
                  {entry.rank}
                </span>
                {entry.avatarUrl ? (
                  <Image src={entry.avatarUrl} alt="" width={32} height={32} className="h-8 w-8 shrink-0 rounded-full border border-cyan-800/50 object-cover" />
                ) : (
                  <span
                    aria-hidden
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cyan-800/50 bg-gradient-to-br text-xs font-black text-white ${getAvatarGradientClasses(entry.playerId).from} ${getAvatarGradientClasses(entry.playerId).to}`}
                  >
                    {getAvatarInitial(entry.nickname)}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-100">
                  {entry.nickname}
                  {isLocal ? <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">tú</span> : null}
                </span>
                {prize > 0 ? (
                  <span className="flex shrink-0 items-center gap-1 rounded-md border border-amber-500/40 bg-amber-950/20 px-1.5 py-0.5 text-[11px] font-black text-amber-300" title="Premio si ganas la semana">
                    <Coins size={12} /> {prize}
                  </span>
                ) : null}
                <span className="shrink-0 text-sm font-black tabular-nums text-cyan-300">{entry.points}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
