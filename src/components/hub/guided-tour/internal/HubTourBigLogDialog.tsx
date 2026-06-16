// src/components/hub/guided-tour/internal/HubTourBigLogDialog.tsx - Diálogo flotante de BigLog para guiar el tour del Hub.
import Image from "next/image";

interface IHubTourBigLogDialogProps {
  title: string;
  objective: string;
  context: string;
  onSkip: () => void;
}

/**
 * Muestra a BigLog indicando el objetivo del paso actual del tour.
 * Diseño responsive: panel compacto en móvil, más amplio en desktop.
 */
export function HubTourBigLogDialog({ title, objective, context, onSkip }: IHubTourBigLogDialogProps) {
  return (
    <section
      aria-label="Guía del tour de BigLog"
      className="pointer-events-auto fixed inset-x-0 bottom-0 z-[200] flex justify-center p-3 sm:bottom-6 sm:p-4"
    >
      <div className="flex w-full max-w-3xl gap-3 rounded-2xl border border-cyan-400/40 bg-[#041120]/92 p-3 shadow-[0_0_40px_rgba(34,211,238,0.28)] backdrop-blur-md sm:gap-4 sm:p-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-cyan-300/40 bg-slate-950 sm:h-20 sm:w-20">
          <Image
            src="/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.webp"
            alt="BigLog"
            fill
            sizes="80px"
            className="object-contain p-1"
            unoptimized
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center">
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300 sm:text-[11px]">{title}</p>
          <p className="mt-1 text-sm font-black uppercase tracking-wide text-white sm:text-base">{objective}</p>
          <p className="mt-1 text-xs leading-relaxed text-slate-300 sm:text-sm">{context}</p>
        </div>
        <div className="flex shrink-0 items-end">
          <button
            type="button"
            onClick={onSkip}
            className="rounded-md border border-amber-400/60 bg-amber-950/70 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-100 transition-colors hover:bg-amber-900/80 sm:px-3 sm:py-2 sm:text-xs"
          >
            Saltar tour
          </button>
        </div>
      </div>
    </section>
  );
}
