// src/components/hub/academy/training/modes/arena/internal/TrainingArenaLobby.tsx - Pantalla previa de arena con presentación Jugador vs Oponente y CTA de inicio.
import Image from "next/image";

interface ITrainingArenaLobbyProps {
  tier: number;
  opponentName: string;
  playerIntroUrl: string;
  opponentIntroUrl: string;
  onStart: () => void;
}

/**
 * Presenta el duelo antes de cargar el tablero para reforzar identidad de tier y rival.
 */
export function TrainingArenaLobby(props: ITrainingArenaLobbyProps) {
  return (
    <section className="mx-auto flex h-full w-full max-w-6xl flex-col items-center justify-center gap-6 px-4 text-cyan-100">
      <p className="rounded-full border border-cyan-300/45 bg-cyan-400/10 px-4 py-1 text-xs font-black uppercase tracking-[0.16em]">
        Arena - Tier {props.tier}
      </p>
      <div className="grid w-full items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
        <article className="rounded-2xl border border-cyan-300/35 bg-slate-950/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Jugador</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-cyan-200/30">
            <Image src={props.playerIntroUrl} alt="Intro del jugador" width={640} height={360} className="h-auto w-full object-cover" priority />
          </div>
        </article>
        <div className="mx-auto text-center">
          <p className="text-5xl font-black uppercase tracking-[0.15em] text-cyan-100">VS</p>
        </div>
        <article className="rounded-2xl border border-rose-300/35 bg-slate-950/70 p-4">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-200">{props.opponentName}</p>
          <div className="mt-3 overflow-hidden rounded-xl border border-rose-200/35">
            <Image src={props.opponentIntroUrl} alt={`Intro de ${props.opponentName}`} width={640} height={360} className="h-auto w-full object-cover" priority />
          </div>
        </article>
      </div>
      <button
        type="button"
        onClick={props.onStart}
        className="rounded-xl border border-emerald-300/60 bg-emerald-500/20 px-6 py-3 text-sm font-black uppercase tracking-[0.15em] text-emerald-100 hover:bg-emerald-400/30"
      >
        Empezar Combate
      </button>
    </section>
  );
}
