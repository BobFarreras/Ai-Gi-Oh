// src/components/hub/academy/tutorial/nodes/internal/resolve-step-id-membership.test.ts - Verifica pertenencia segura de stepId para reglas de UI tutorial.
import { describe, expect, it } from "vitest";
import { resolveStepIdMembership } from "@/components/hub/academy/tutorial/nodes/internal/resolve-step-id-membership";

describe("resolveStepIdMembership", () => {
  it("retorna true cuando el step actual pertenece al grupo", () => {
    expect(resolveStepIdMembership("market-buy-pack", ["market-buy-pack", "market-open-history"])).toBe(true);
  });

  it("retorna false cuando no hay step actual o no está en grupo", () => {
    expect(resolveStepIdMembership(null, ["market-buy-pack"])).toBe(false);
    expect(resolveStepIdMembership("market-type-filter", ["market-buy-pack"])).toBe(false);
  });
});
