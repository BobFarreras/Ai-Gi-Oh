// src/components/tutorial/flow/TutorialBigLogOutroOverlay.tsx - Cierre narrativo del tutorial con acciones para continuar o volver al mapa de tutoriales.
"use client";
import Image from "next/image";

interface ITutorialBigLogOutroOverlayProps {
  isVisible: boolean;
  title: string;
  description: string;
  onContinue: () => void;
  onExit: () => void;
}

export function TutorialBigLogOutroOverlay({
  isVisible,
  title,
  description,
  onContinue,
  onExit,
}: ITutorialBigLogOutroOverlayProps) {
  if (!isVisible) return null;
  return (
    <section
      data-tutorial-overlay="true"
      className="pointer-events-auto fixed inset-0 z-[440] flex items-center justify-center bg-slate-950/88 p-4 backdrop-blur-sm"
    >
      <div className="flex max-w-[min(95vw,1120px)] flex-col items-center gap-3 sm:flex-row sm:gap-6">
        <div className="relative h-[240px] w-[240px] shrink-0 overflow-visible bg-transparent sm:h-[320px] sm:w-[320px]">
          <Image
            src="/assets/story/opponents/opp-ch1-biglog/intro-BigLog.png"
            alt="BigLog final del tutorial"
            fill
            sizes="(max-width: 640px) 240px, 320px"
            priority
            className="object-contain drop-shadow-[0_0_30px_rgba(34,211,238,0.48)]"
          />
        </div>
        <article className="relative max-w-[700px] rounded-xl border-2 border-black bg-white px-4 py-3 text-black shadow-[0_8px_0_rgba(0,0,0,0.9)] sm:px-6 sm:py-5">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-black/70">BigLog</p>
          <h2 className="mt-1 text-lg font-black uppercase">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed sm:text-base">{description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-tutorial-overlay="true"
              onClick={onContinue}
              className="rounded-md border border-black/60 px-4 py-2 text-xs font-black uppercase tracking-[0.12em]"
            >
              Siguiente Tutorial
            </button>
            <button
              type="button"
              data-tutorial-overlay="true"
              onClick={onExit}
              className="rounded-md border border-black/35 px-4 py-2 text-xs font-black uppercase tracking-[0.12em]"
            >
              Volver a Tutoriales
            </button>
          </div>
          <span className="absolute left-[-7px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-black bg-white" />
        </article>
      </div>
    </section>
  );
}
