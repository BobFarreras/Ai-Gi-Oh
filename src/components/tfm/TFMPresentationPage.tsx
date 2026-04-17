// src/components/tfm/TFMPresentationPage.tsx - Layout de presentación TFM con narrativa visual, stack y fundamentos técnicos.
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
    <main className="min-h-dvh bg-[#020611] text-cyan-100 selection:bg-cyan-500/30">
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
    </main>
  );
}
