// src/services/tutorial/arsenal/resolve-arsenal-tutorial-steps.ts - Define pasos guiados del nodo Preparar Deck para la fase inicial.
import { ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";

export function resolveArsenalTutorialSteps(): ITutorialFlowStep[] {
  return [
    {
      id: "arsenal-select-card",
      title: "Selecciona una carta",
      description: "Pulsa la carta resaltada para abrir su detalle. Este foco muestra cómo identificar el objetivo activo.",
      targetId: "arsenal-card-slot",
      allowedTargetIds: ["arsenal-card-slot"],
      completionType: "USER_ACTION",
      expectedActionId: "SELECT_CARD_DETAIL",
    },
    {
      id: "arsenal-add-deck",
      title: "Añadir al deck",
      description: "Ahora usa el botón de añadir. Mientras dure este paso, el resto de acciones queda bloqueado.",
      targetId: "arsenal-add-button",
      allowedTargetIds: ["arsenal-add-button"],
      completionType: "USER_ACTION",
      expectedActionId: "ADD_CARD_TO_DECK",
    },
    {
      id: "arsenal-open-evolve",
      title: "Abrir evolución",
      description: "Pulsa Evolucionar para cerrar la práctica. También puedes avanzar con Siguiente para continuar.",
      targetId: "arsenal-evolve-button",
      allowedTargetIds: ["arsenal-evolve-button"],
      completionType: "BOTH",
      expectedActionId: "OPEN_EVOLVE_PANEL",
    },
  ];
}
