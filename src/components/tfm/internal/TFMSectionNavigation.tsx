// src/components/tfm/internal/TFMSectionNavigation.tsx - Navegación compacta por anclas para la defensa web del TFM.
import type { ITFMPresentationSection } from "@/components/tfm/internal/tfm-presentation-sections";

interface ITFMNavigationLink {
  id: string;
  label: string;
}

interface ITFMSectionNavigationProps {
  sections: ITFMPresentationSection[];
  extraLinks?: ITFMNavigationLink[];
}

/**
 * Renderiza navegación rápida para moverse entre bloques principales.
 */
export function TFMSectionNavigation({ sections, extraLinks = [] }: ITFMSectionNavigationProps) {
  const links: ITFMNavigationLink[] = [
    ...extraLinks,
    ...sections.map((section) => ({ id: section.id, label: section.kicker })),
  ];

  return (
    <nav aria-label="Navegación de la presentación" className="rounded-xl border border-cyan-500/35 bg-black/60 p-3 backdrop-blur">
      <ul className="flex flex-wrap gap-2">
        {links.map((link) => (
          <li key={link.id}>
            <a href={`#${link.id}`} className="inline-flex rounded-md border border-cyan-500/35 bg-cyan-900/20 px-3 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-900/40">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
