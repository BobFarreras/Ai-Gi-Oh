// src/components/tfm/internal/tfm-presentation-sections.ts - Guion de cierre en bloques breves para una defensa TFM clara y visual.
export interface ITFMPresentationSection {
  id: string;
  title: string;
  kicker: string;
  summary: string;
  bullets: string[];
}

export const TFM_PRESENTATION_SECTIONS: ITFMPresentationSection[] = [
  {
    id: "producto",
    title: "Producto real y jugable",
    kicker: "Resultado",
    summary: "AI-GI-OH no es maqueta: es un juego funcional con onboarding, combate, market y modo historia.",
    bullets: [
      "Experiencia completa de usuario desde login hasta progresión.",
      "Módulos conectados sin romper reglas de dominio.",
    ],
  },
  {
    id: "aprendizaje",
    title: "Aprendizaje acelerado con IA",
    kicker: "Evolución",
    summary: "Del punto de partida sin experiencia a una entrega técnica defendible mediante práctica constante.",
    bullets: [
      "La IA se usa como apoyo, no como piloto automático.",
      "Cada iteración se valida con pruebas y refactor.",
    ],
  },
  {
    id: "impacto",
    title: "Impacto del enfoque",
    kicker: "Valor",
    summary: "El enfoque web full-stack permitió iterar rápido, desplegar en producción y madurar criterio de ingeniería.",
    bullets: [
      "Entrega pública y demostrable para tribunal.",
      "Base preparada para seguir creciendo tras el TFM.",
    ],
  },
];
