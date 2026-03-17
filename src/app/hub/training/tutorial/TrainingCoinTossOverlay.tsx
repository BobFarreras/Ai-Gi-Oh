// src/app/hub/training/tutorial/TrainingCoinTossOverlay.tsx - Overlay inicial del tutorial para explicar quién empieza el turno.
"use client";

interface ITrainingCoinTossOverlayProps {
  isVisible: boolean;
  starterSide: "PLAYER" | "OPPONENT";
  onContinue: () => void;
}

export function TrainingCoinTossOverlay({ isVisible, starterSide, onContinue }: ITrainingCoinTossOverlayProps) {
  if (!isVisible) return null;
  return (
    <div className="absolute inset-0 z-[500] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <article className="w-full max-w-xl rounded-2xl border border-cyan-300/45 bg-slate-950/95 p-5 text-cyan-100 shadow-[0_14px_44px_rgba(0,0,0,0.55)]">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Moneda inicial</p>
        <h2 className="mt-2 text-2xl font-black uppercase">Inicio del duelo</h2>
        <p className="mt-2 text-sm text-cyan-100/90">Resultado: {starterSide === "PLAYER" ? "Empiezas tú" : "Empieza el rival"}.</p>
        <p className="mt-1 text-sm text-cyan-100/90">Recuerda: en el primer turno no se puede atacar.</p>
        <button
          type="button"
          onClick={onContinue}
          className="mt-4 rounded-md border border-cyan-200/45 px-3 py-2 text-xs font-black uppercase hover:bg-cyan-300/10"
          aria-label="Continuar tutorial de combate"
        >
          Continuar tutorial
        </button>
      </article>
    </div>
  );
}
