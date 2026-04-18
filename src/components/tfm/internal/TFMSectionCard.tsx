// src/components/tfm/internal/TFMSectionCard.tsx - Tarjeta de cierre para mensajes clave de la presentación TFM.
import type { ITFMPresentationSection } from "@/components/tfm/internal/tfm-presentation-sections";

interface ITFMSectionCardProps {
  section: ITFMPresentationSection;
}

/**
 * Presenta ideas de cierre con tipografía grande para defensa oral.
 */
export function TFMSectionCard({ section }: ITFMSectionCardProps) {
  return (
    <article id={section.id} className="scroll-mt-24 rounded-xl border border-cyan-500/35 bg-black/55 p-5 sm:p-6">
      <p className="font-mono text-sm uppercase tracking-[0.14em] text-cyan-300">{section.kicker}</p>
      <h2 className="mt-2 text-2xl font-black text-cyan-50 sm:text-3xl">{section.title}</h2>
      <p className="mt-3 text-lg leading-relaxed text-cyan-100/90">{section.summary}</p>
      <ul className="mt-4 space-y-2 text-base text-cyan-100/95">
        {section.bullets.map((bullet) => (
          <li key={bullet} className="flex gap-2">
            <span aria-hidden className="mt-[9px] h-2 w-2 rounded-full bg-cyan-400" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
