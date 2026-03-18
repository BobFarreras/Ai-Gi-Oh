// src/components/tutorial/flow/TutorialBigLogIntroOverlay.tsx - Overlay de introducción de BigLog antes de iniciar un nodo guiado de tutorial.
"use client";
import Image from "next/image";

interface ITutorialBigLogIntroOverlayProps {
  isVisible: boolean;
  title: string;
  description: string;
  onStart: () => void;
}

export function TutorialBigLogIntroOverlay({ isVisible, title, description, onStart }: ITutorialBigLogIntroOverlayProps) {
  if (!isVisible) return null;
  return (
    <section data-tutorial-overlay="true" className="pointer-events-auto fixed inset-0 z-[440] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="flex max-w-[min(94vw,980px)] items-center gap-4">
        <div className="relative h-[200px] w-[200px] shrink-0 overflow-visible bg-transparent">
          <Image src="/assets/story/opponents/opp-ch1-biglog/intro-BigLog.png" alt="Introducción de BigLog" fill sizes="200px" priority className="object-contain drop-shadow-[0_0_24px_rgba(34,211,238,0.45)]" />
        </div>
        <article className="relative rounded-xl border-2 border-black bg-white px-4 py-3 text-black shadow-[0_8px_0_rgba(0,0,0,0.9)]">
          <p className="text-[11px] font-black uppercase tracking-[0.26em] text-black/70">BigLog</p>
          <h2 className="mt-1 text-lg font-black uppercase">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed sm:text-base">{description}</p>
          <button
            type="button"
            data-tutorial-overlay="true"
            onClick={onStart}
            className="mt-4 rounded-md border border-black/60 px-4 py-2 text-xs font-black uppercase tracking-[0.12em]"
          >
            Empezar
          </button>
          <span className="absolute left-[-7px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-black bg-white" />
        </article>
      </div>
    </section>
  );
}
