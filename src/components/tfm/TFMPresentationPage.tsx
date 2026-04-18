// src/components/tfm/TFMPresentationPage.tsx - Layout de presentación TFM con narrativa visual, stack y fundamentos técnicos.
import Link from "next/link";
import { TFMAnimatedReveal } from "@/components/tfm/internal/TFMAnimatedReveal";
import { TFMHeroHeader } from "@/components/tfm/internal/TFMHeroHeader";
import { TFMOriginJourney } from "@/components/tfm/internal/TFMOriginJourney";
import { TFMSectionCard } from "@/components/tfm/internal/TFMSectionCard";
import { TFMSectionNavigation } from "@/components/tfm/internal/TFMSectionNavigation";
import { TFMTechStackPanel } from "@/components/tfm/internal/TFMTechStackPanel";
import { TFMTechnicalEvidencePanel } from "@/components/tfm/internal/TFMTechnicalEvidencePanel";
import { TFM_PRESENTATION_SECTIONS } from "@/components/tfm/internal/tfm-presentation-sections";

/**
 * Orquesta el flujo visual de defensa con bloques animados y legibles.
 */
export function TFMPresentationPage() {
  return (
    <main className="relative min-h-dvh bg-[#020611] pb-28 text-cyan-100 selection:bg-cyan-500/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
        <TFMAnimatedReveal direction="up">
          <TFMHeroHeader />
        </TFMAnimatedReveal>

        <TFMSectionNavigation
          sections={TFM_PRESENTATION_SECTIONS}
          extraLinks={[
            { id: "stack-tecnologico", label: "Stack" },
            { id: "fundamentos-tecnicos", label: "Fundamentos" },
          ]}
        />

        <TFMAnimatedReveal direction="left" delay={0.05}>
          <TFMOriginJourney />
        </TFMAnimatedReveal>

        <TFMAnimatedReveal direction="right" delay={0.1}>
          <TFMTechStackPanel />
        </TFMAnimatedReveal>

        <TFMAnimatedReveal direction="left" delay={0.15}>
          <TFMTechnicalEvidencePanel />
        </TFMAnimatedReveal>

        <TFMAnimatedReveal direction="right" delay={0.2}>
          <section aria-label="Mensajes de cierre" className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {TFM_PRESENTATION_SECTIONS.map((section) => (
              <TFMSectionCard key={section.id} section={section} />
            ))}
          </section>
        </TFMAnimatedReveal>
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-40 flex justify-center px-4">
        <Link
          href="/"
          className="pointer-events-auto inline-flex h-12 items-center justify-center overflow-hidden border border-cyan-500/55 bg-black/75 px-6 font-mono text-xs font-black uppercase tracking-[0.16em] text-cyan-200 backdrop-blur transition-all hover:border-cyan-300 hover:text-cyan-50 hover:shadow-[0_0_22px_rgba(34,211,238,0.45)] sm:h-14 sm:px-8 sm:text-sm"
          style={{ clipPath: "polygon(14px 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%, 0 14px)" }}
        >
          Volver a Landing
        </Link>
      </div>
    </main>
  );
}
