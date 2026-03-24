// src/services/tutorial/arsenal/resolve-arsenal-tutorial-steps.ts - Define pasos guiados del nodo Preparar Deck para la fase inicial.
import { ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";

export function resolveArsenalTutorialSteps(): ITutorialFlowStep[] {
  return [
    {
      id: "arsenal-select-collection-card",
      title: "Selecciona carta del almacén",
      description: "Primero elige una carta del almacén para inspeccionarla como harías en una sesión real.",
      targetId: "tutorial-home-collection",
      allowedTargetIds: ["tutorial-home-collection"],
      completionType: "USER_ACTION",
      expectedActionId: "SELECT_COLLECTION_CARD",
    },
    {
      id: "arsenal-detail-explanation",
      title: "Lee el detalle antes de actuar",
      description:
        "Este panel explica estadísticas, versión, nivel y texto de carta. Acostúmbrate a revisarlo antes de mover cartas.",
      targetId: "tutorial-home-inspector",
      allowedTargetIds: [],
      completionType: "MANUAL_NEXT",
    },
    {
      id: "arsenal-select-deck-card",
      title: "Selecciona carta del deck",
      description: "Ahora selecciona una carta del deck principal para dejar preparado el botón Remover.",
      targetId: "tutorial-home-deck",
      allowedTargetIds: ["tutorial-home-deck"],
      completionType: "USER_ACTION",
      expectedActionId: "SELECT_DECK_CARD",
    },
    {
      id: "arsenal-remove-deck",
      title: "Remover para abrir hueco",
      description:
        "Pulsa Remover para liberar un slot. Si el deck está en 20/20, no podrás añadir hasta abrir un hueco.",
      targetId: "tutorial-home-remove-button",
      allowedTargetIds: ["tutorial-home-remove-button"],
      completionType: "USER_ACTION",
      expectedActionId: "REMOVE_CARD_FROM_DECK",
    },
    {
      id: "arsenal-reselect-collection-card",
      title: "Reelige carta del almacén",
      description: "Tras remover, vuelve al almacén y selecciona la carta que quieres insertar en el deck.",
      targetId: "tutorial-home-collection",
      allowedTargetIds: ["tutorial-home-collection"],
      completionType: "USER_ACTION",
      expectedActionId: "SELECT_COLLECTION_CARD",
    },
    {
      id: "arsenal-add-deck",
      title: "Añadir al deck",
      description: "Con hueco libre y carta seleccionada, pulsa Añadir. El objetivo final es mantener siempre 20 cartas.",
      targetId: "tutorial-home-add-button",
      allowedTargetIds: ["tutorial-home-add-button"],
      completionType: "USER_ACTION",
      expectedActionId: "ADD_CARD_TO_DECK",
    },
    {
      id: "arsenal-deck-capacity-rule",
      title: "Regla de tamaño del deck",
      description:
        "Deck principal: 20 cartas obligatorias para competir. Si bajas de 20, rellena; si llegas a 20, añade solo tras remover.",
      targetId: "tutorial-home-deck",
      allowedTargetIds: [],
      completionType: "MANUAL_NEXT",
    },
    {
      id: "arsenal-max-copies-rule",
      title: "Límite de copias por carta",
      description:
        "Regla clave de Arsenal: en el deck solo puedes llevar hasta 3 copias de la misma carta.",
      targetId: "tutorial-home-deck",
      allowedTargetIds: [],
      completionType: "MANUAL_NEXT",
    },
    {
      id: "arsenal-fusion-recipe-cards",
      title: "Receta completa en el deck",
      description:
        "La receta de GemGPT usa 3 cartas del deck principal: ChatGPT + Gemini + Kernel de GemGPT (mágica).",
      targetId: "tutorial-home-fusion-recipe-cards",
      allowedTargetIds: [],
      completionType: "MANUAL_NEXT",
    },
    {
      id: "arsenal-fusion-result",
      title: "Carta final en bloque de fusión",
      description:
        "GemGPT debe estar en este bloque. Las cartas de tipo FUSION quedan fuera del deck principal.",
      targetId: "tutorial-home-fusion-card-tutorial-gemgpt-fusion",
      allowedTargetIds: [],
      completionType: "MANUAL_NEXT",
    },
    {
      id: "arsenal-fusion-explanation",
      title: "Cómo funciona Fusión",
      description:
        "Para fusionar necesitas 2 materiales + 1 mágica de fusión y la carta de fusión colocada en su bloque.",
      targetId: "tutorial-home-fusion-block",
      allowedTargetIds: [],
      completionType: "MANUAL_NEXT",
    },
    {
      id: "arsenal-evolution-theory",
      title: "Cómo detectar evolución",
      description:
        "Selecciona una carta vibrando: eso indica que puede evolucionar. Costes por salto: 4, 8, 16... copias.",
      targetId: "tutorial-home-collection",
      allowedTargetIds: ["tutorial-home-collection", "tutorial-home-inspector"],
      completionType: "USER_ACTION",
      expectedActionId: "SELECT_COLLECTION_CARD",
    },
    {
      id: "arsenal-open-evolve",
      title: "Evolución práctica",
      description: "Perfecto. Ahora pulsa el botón Evolucionar para ejecutar la mejora y ver la animación.",
      targetId: "tutorial-home-evolve-button",
      allowedTargetIds: ["tutorial-home-collection", "tutorial-home-evolve-button", "tutorial-home-inspector"],
      completionType: "USER_ACTION",
      expectedActionId: "OPEN_EVOLVE_PANEL",
    },
  ];
}
