// src/components/hub/HubProgressSection.tsx - Nodo flotante de estado del arquitecto con métricas clave del perfil.
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";

interface HubProgressSectionProps {
  progress: IPlayerHubProgress;
}

export function HubProgressSection({ progress }: HubProgressSectionProps) {
  return (
    <section className="relative w-[480px] border border-cyan-400/45 bg-[#040f1e]/85 px-5 py-3 shadow-[0_0_34px_rgba(6,182,212,0.2)]">
      <div className="absolute -bottom-4 left-6 h-3 w-28 bg-cyan-300/25 blur-md" />
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200/85">Estado Del Arquitecto</p>
      <div className="mt-2 grid grid-cols-3 gap-3 text-xs font-semibold text-cyan-100">
        <p>Medallas: {progress.medals}</p>
        <p>Capítulo: {progress.storyChapter}</p>
        <p>Tutorial: {progress.hasCompletedTutorial ? "Completado" : "Pendiente"}</p>
      </div>
    </section>
  );
}
