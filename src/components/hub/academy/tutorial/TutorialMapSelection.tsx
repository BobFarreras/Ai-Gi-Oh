// src/components/hub/academy/tutorial/TutorialMapSelection.tsx - Escena del mapa tutorial con layout fullscreen en desktop y scroll seguro en mobile.
import Image from "next/image";
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";
import { TutorialCircuitMap } from "@/components/hub/academy/tutorial/TutorialCircuitMap";
import { resolvePrepareDeckGuideVisibility } from "@/components/hub/academy/tutorial/internal/resolve-prepare-deck-guide-visibility";
import { ACADEMY_HOME_ROUTE } from "@/core/constants/routes/academy-routes";
import { ITutorialMapNodeRuntime } from "@/core/entities/tutorial/ITutorialMapNode";

interface ITutorialMapSelectionProps {
  nodes: ITutorialMapNodeRuntime[];
}

export function TutorialMapSelection({ nodes }: ITutorialMapSelectionProps) {
  const shouldGuidePrepareDeck = resolvePrepareDeckGuideVisibility(nodes);
  const guidedNodeId = shouldGuidePrepareDeck ? "tutorial-arsenal-basics" : null;

  return (
    <section className="relative h-full min-h-0 px-2 pb-2 text-cyan-100 sm:px-3 lg:flex lg:flex-col lg:gap-4 lg:px-4 lg:py-4">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center pt-0 lg:hidden">
        <header className="w-full max-w-4xl rounded-2xl border border-cyan-500/30 bg-[#041425]/78 px-3 py-3 backdrop-blur-sm sm:px-4 lg:px-6 lg:py-4">
          <div className="flex items-center justify-center gap-4 text-left">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-cyan-300/50 bg-slate-950 lg:h-20 lg:w-20">
              <Image src="/assets/story/opponents/opp-ch1-biglog/tutorial-BigLog.png" alt="BigLog Academy" fill className="object-contain object-top p-1" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-black uppercase tracking-[0.06em] text-white sm:text-3xl lg:text-4xl">Ruta de Tutorial</h1>
              <p className="mt-1 text-base font-semibold text-slate-200 lg:text-lg">Completa los 4 nodos para desbloquear tu recompensa final.</p>
            </div>
          </div>
        </header>
      </div>

      <div className="hidden justify-center lg:flex">
        <header className="w-full max-w-4xl rounded-2xl border border-cyan-500/30 bg-[#041425]/78 px-6 py-4 backdrop-blur-sm [@media(min-width:1024px)_and_(max-height:900px)]:px-4 [@media(min-width:1024px)_and_(max-height:900px)]:py-3">
          <div className="flex items-center justify-center gap-4 text-left">
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-cyan-300/50 bg-slate-950 [@media(min-width:1024px)_and_(max-height:900px)]:h-14 [@media(min-width:1024px)_and_(max-height:900px)]:w-14">
              <Image src="/assets/story/opponents/opp-ch1-biglog/tutorial-BigLog.png" alt="BigLog Academy" fill className="object-contain object-top p-1" />
            </div>
            <div className="min-w-0">
              <h1 className="text-4xl font-black uppercase tracking-[0.06em] text-white [@media(min-width:1024px)_and_(max-height:900px)]:text-3xl">Ruta de Tutorial</h1>
              <p className="mt-1 text-lg font-semibold text-slate-200 [@media(min-width:1024px)_and_(max-height:900px)]:text-base [@media(min-width:1024px)_and_(max-height:900px)]:leading-tight">Completa los 4 nodos para desbloquear tu recompensa final.</p>
            </div>
          </div>
        </header>
      </div>

      <div data-testid="tutorial-map-scroll-container" className="h-full min-h-0 overflow-y-auto pt-[8.3rem] pb-[calc(4.2rem+env(safe-area-inset-bottom))] sm:pt-[9rem] lg:flex-1 lg:overflow-visible lg:pt-0 lg:pb-0">
        <TutorialCircuitMap nodes={nodes} guidedNodeId={guidedNodeId} />
      </div>

      <footer className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-[max(0.4rem,env(safe-area-inset-bottom))] lg:hidden">
        <div className="pointer-events-auto inline-flex">
          <AcademyBackButton label="Volver a Academy" href={ACADEMY_HOME_ROUTE} className="w-full max-w-xs lg:w-auto" />
        </div>
      </footer>

      <footer className="hidden justify-center lg:flex">
        <AcademyBackButton label="Volver a Academy" href={ACADEMY_HOME_ROUTE} className="w-auto" />
      </footer>
    </section>
  );
}
