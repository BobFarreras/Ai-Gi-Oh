// src/components/hub/academy/training/TrainingDeckReadyGate.tsx - Muestra aviso cuando el jugador no tiene deck 20/20 para entrar a tutorial o arena.
import Link from "next/link";

export function TrainingDeckReadyGate() {
  return (
    <main className="hub-control-room-bg flex min-h-dvh items-center justify-center px-4 text-cyan-100">
      <div className="rounded-xl border border-rose-300/45 bg-rose-950/40 p-4 text-center">
        <p className="text-sm font-black uppercase text-rose-100">Deck incompleto</p>
        <p className="mt-1 text-sm text-rose-100/90">Necesitas 20 cartas en Arsenal para entrar al combate de entrenamiento.</p>
        <Link href="/hub/home" className="mt-3 inline-block rounded-md border border-rose-200/45 px-3 py-2 text-xs font-bold uppercase">
          Ir a Arsenal
        </Link>
      </div>
    </main>
  );
}
