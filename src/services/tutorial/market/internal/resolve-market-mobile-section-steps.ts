// src/services/tutorial/market/internal/resolve-market-mobile-section-steps.ts - Pasos introductorios de secciones móviles para tutorial de Market.
import { ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";

export const MARKET_MOBILE_SECTION_STEPS: ITutorialFlowStep[] = [
  { id: "market-mobile-section-listings", title: "Sección Mercado", description: "Aquí exploras cartas sueltas, aplicas filtros y abres su detalle para comprar.", targetId: "market-mobile-tab-listings", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
  { id: "market-mobile-section-packs", title: "Sección Packs", description: "En Packs eliges sobres, revisas cartas posibles y ejecutas compras aleatorias.", targetId: "market-mobile-tab-packs", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
  { id: "market-mobile-section-vault", title: "Sección Almacén", description: "En Almacén/Historial revisas stock y transacciones para controlar tus recursos.", targetId: "market-mobile-tab-vault", allowedTargetIds: [], completionType: "MANUAL_NEXT" },
];

export const MARKET_MOBILE_OPEN_FILTER_STEP: ITutorialFlowStep = {
  id: "market-mobile-open-filters",
  title: "Botón de Filtros",
  description: "Primero pulsa Filtros para desplegar el bloque de configuración en móvil.",
  targetId: "market-mobile-open-filters",
  allowedTargetIds: ["market-mobile-open-filters"],
  completionType: "USER_ACTION",
  expectedActionId: "OPEN_MOBILE_FILTERS",
};
