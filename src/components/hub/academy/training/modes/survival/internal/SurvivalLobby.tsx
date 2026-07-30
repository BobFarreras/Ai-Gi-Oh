// src/components/hub/academy/training/modes/survival/internal/SurvivalLobby.tsx - Presenta el estado de expedición y permite entrar al siguiente duelo.
import Link from "next/link";
import { ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { ACADEMY_TRAINING_ARENA_ROUTE } from "@/core/constants/routes/academy-routes";

interface ISurvivalLobbyProps {
  run: ISurvivalRun | null;
  isLoading: boolean;
  error: string | null;
  onStart: () => void;
}

export function SurvivalLobby({ run, isLoading, error, onStart }: ISurvivalLobbyProps) {
  const nextBattle = (run?.currentBattleIndex ?? 0) + 1;
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#03090b] px-5 py-8 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(16,185,129,0.24),transparent_42%),linear-gradient(145deg,rgba(6,78,59,0.22),transparent_55%)]" />
      <section className="relative mx-auto flex min-h-[calc(100dvh-4rem)] max-w-5xl flex-col justify-center">
        <p className="text-xs font-black uppercase tracking-[0.36em] text-emerald-300">Protocolo de resistencia</p>
        <h1 className="mt-3 max-w-3xl text-5xl font-black uppercase italic leading-none sm:text-7xl">Supervivencia</h1>
        <p className="mt-5 max-w-2xl text-base text-zinc-300 sm:text-lg">
          Conservas tus LP entre combates. Cada cinco victorias, el Nexus restaura 2.000 LP sin superar tu máximo.
        </p>
        <div className="mt-9 grid gap-3 sm:grid-cols-3">
          <Stat label="LP disponibles" value={`${run?.currentLp ?? 8000} / ${run?.maxLp ?? 8000}`} />
          <Stat label="Victorias" value={String(run?.wins ?? 0)} />
          <Stat label="Próximo duelo" value={`#${nextBattle}`} />
        </div>
        {error ? <p role="alert" className="mt-5 rounded-xl border border-rose-500/40 bg-rose-950/50 p-4 text-rose-100">{error}</p> : null}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onStart} disabled={isLoading} className="min-h-12 rounded-xl bg-emerald-400 px-7 py-3 font-black uppercase tracking-wider text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-60">
            {isLoading ? "Preparando duelo…" : run ? "Continuar expedición" : "Iniciar expedición"}
          </button>
          <Link href={ACADEMY_TRAINING_ARENA_ROUTE} className="flex min-h-12 items-center justify-center rounded-xl border border-white/15 px-7 py-3 font-bold text-zinc-200 hover:bg-white/5">
            Volver a modos
          </Link>
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-emerald-300/15 bg-black/35 p-5 backdrop-blur-sm">
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-emerald-200">{value}</p>
    </article>
  );
}
