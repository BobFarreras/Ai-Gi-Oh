// src/services/tutorial/market/resolve-market-tutorial-steps.ts - Construye el flujo del tutorial de Market adaptando pasos para layout móvil o desktop.
import { ITutorialFlowStep } from "@/core/entities/tutorial/ITutorialFlowStep";
import { resolveMarketBaseSteps } from "@/services/tutorial/market/internal/resolve-market-base-steps";
import { MARKET_MOBILE_OPEN_FILTER_STEP, MARKET_MOBILE_SECTION_STEPS } from "@/services/tutorial/market/internal/resolve-market-mobile-section-steps";

interface IResolveMarketTutorialStepsInput {
  isMobileLayout: boolean;
}

/**
 * Adapta la secuencia de pasos al layout móvil sin duplicar reglas de negocio.
 */
export function resolveMarketTutorialSteps(input: IResolveMarketTutorialStepsInput): ITutorialFlowStep[] {
  const baseSteps = resolveMarketBaseSteps();
  if (!input.isMobileLayout) return baseSteps;
  const [typeStep, orderStep, directionStep, ...restBaseSteps] = baseSteps;
  return [
    ...MARKET_MOBILE_SECTION_STEPS,
    MARKET_MOBILE_OPEN_FILTER_STEP,
    typeStep,
    orderStep,
    directionStep,
    ...restBaseSteps,
  ];
}
