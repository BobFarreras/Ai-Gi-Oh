// src/services/tutorial/arsenal/resolve-arsenal-tutorial-steps.ts - Define pasos guiados del nodo Preparar Deck para la fase inicial.
import { ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";

export function resolveArsenalTutorialSteps(): ITutorialFlowStep[] {
  return [
    {
      id: "arsenal-select-deck-card",
      title: "Selecciona carta del deck",
      description: "Empieza seleccionando una carta dentro del deck principal para liberar un hueco.",
      targetId: "tutorial-home-deck",
      allowedTargetIds: ["tutorial-home-deck"],
      completionType: "USER_ACTION",
      expectedActionId: "SELECT_DECK_CARD",
    },
    {
      id: "arsenal-remove-deck",
      title: "Remover para abrir espacio",
      description: "Pulsa Remover para dejar un hueco en el deck. Así evitarás errores de deck completo al añadir.",
      targetId: "tutorial-home-remove-button",
      allowedTargetIds: ["tutorial-home-remove-button"],
      completionType: "USER_ACTION",
      expectedActionId: "REMOVE_CARD_FROM_DECK",
    },
    {
      id: "arsenal-select-collection-card",
      title: "Selecciona carta del almacén",
      description: "Ahora selecciona una carta del almacén para cargar detalle y prepararla para añadir.",
      targetId: "tutorial-home-collection",
      allowedTargetIds: ["tutorial-home-collection"],
      completionType: "USER_ACTION",
      expectedActionId: "SELECT_COLLECTION_CARD",
    },
    {
      id: "arsenal-add-deck",
      title: "Añadir al deck",
      description: "Con hueco libre y carta seleccionada, pulsa Añadir para llevarla al deck.",
      targetId: "tutorial-home-add-button",
      allowedTargetIds: ["tutorial-home-add-button"],
      completionType: "USER_ACTION",
      expectedActionId: "ADD_CARD_TO_DECK",
    },
    {
      id: "arsenal-detail-explanation",
      title: "Detalle de carta",
      description: "El panel de detalle muestra versión, nivel, texto y tipo. Revísalo antes de decidir acciones.",
      targetId: "tutorial-home-inspector",
      allowedTargetIds: ["tutorial-home-inspector"],
      completionType: "MANUAL_NEXT",
    },
    {
      id: "arsenal-fusion-explanation",
      title: "Cómo funciona Fusión",
      description:
        "Para fusionar necesitas 2 materiales + una mágica de fusión y tener la carta fusión en el bloque de fusión.",
      targetId: "tutorial-home-fusion-block",
      allowedTargetIds: ["tutorial-home-fusion-block"],
      completionType: "MANUAL_NEXT",
    },
    {
      id: "arsenal-open-evolve",
      title: "Evolución en almacén",
      description: "Selecciona una carta evolvable del almacén y pulsa Evolucionar para ver la animación.",
      targetId: "tutorial-home-evolve-button",
      allowedTargetIds: ["tutorial-home-collection", "tutorial-home-evolve-button", "tutorial-home-inspector"],
      completionType: "BOTH",
      expectedActionId: "OPEN_EVOLVE_PANEL",
    },
  ];
}
