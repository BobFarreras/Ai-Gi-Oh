// src/services/tutorial/market/resolve-market-tutorial-steps.test.ts - Verifica contrato del flujo Market para desktop y móvil.
import { describe, expect, it } from "vitest";
import { resolveMarketTutorialSteps } from "@/services/tutorial/market/resolve-market-tutorial-steps";

describe("resolveMarketTutorialSteps", () => {
  it("mantiene pasos clave en desktop", () => {
    const steps = resolveMarketTutorialSteps({ isMobileLayout: false });
    expect(steps[0]?.id).toBe("market-type-filter");
    expect(steps.some((step) => step.id === "market-buy-card")).toBe(true);
    expect(steps.some((step) => step.id === "market-buy-pack")).toBe(true);
    expect(steps.at(-1)?.id).toBe("market-open-history");
  });

  it("inserta pasos móviles antes de filtros", () => {
    const steps = resolveMarketTutorialSteps({ isMobileLayout: true });
    expect(steps[0]?.id).toBe("market-mobile-section-listings");
    expect(steps[1]?.id).toBe("market-mobile-section-packs");
    expect(steps[2]?.id).toBe("market-mobile-section-vault");
    expect(steps[3]?.id).toBe("market-mobile-open-filters");
    expect(steps[4]?.id).toBe("market-type-filter");
  });
});
