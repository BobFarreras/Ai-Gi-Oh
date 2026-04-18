// src/components/tfm/internal/tfm-phase-two-content.ts - Contenido narrativo ampliado para la fase 2 de la presentación TFM.
export interface ITFMJourneyMilestone {
  id: string;
  title: string;
  detail: string;
}

export interface ITFMPersonalNarrative {
  title: string;
  summary: string;
  highlights: string[];
}

export const TFM_PERSONAL_NARRATIVE: ITFMPersonalNarrative = {
  title: "De cero experiencia a construir un juego completo",
  summary:
    "Este TFM nace desde un punto de partida real: sin bagaje previo en desarrollo, pero con curiosidad constante y disciplina para aprender creando.",
  highlights: [
    "Inicio sin experiencia técnica previa en programación profesional.",
    "Aprendizaje iterativo basado en construir, fallar, corregir y documentar.",
    "Uso de IA como copiloto para acelerar comprensión, no como sustituto del criterio técnico.",
  ],
};

export const TFM_PROJECT_DECISION_MILESTONES: ITFMJourneyMilestone[] = [
  {
    id: "ideas-previas",
    title: "Ideas previas descartadas",
    detail:
      "Se exploraron propuestas de TFM, pero no encajaban por motivación ni por potencial de aprendizaje técnico real.",
  },
  {
    id: "punto-inflexion",
    title: "Punto de inflexión",
    detail:
      "La decisión fue apostar por un videojuego propio, combinando producto visual, arquitectura y reglas de negocio complejas.",
  },
  {
    id: "apuesta-web",
    title: "Apuesta web pragmática",
    detail:
      "Aunque una vía clásica sería C/C++, se eligió stack web para construir end-to-end, desplegar rápido y demostrar ingeniería full-stack.",
  },
];
