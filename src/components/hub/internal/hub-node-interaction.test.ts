// src/components/hub/internal/hub-node-interaction.test.ts - Verifica resolución de acción al hacer click en nodo de Hub.
import { describe, expect, it } from "vitest";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { resolveHubNodeInteraction } from "./hub-node-interaction";

function createSection(overrides?: Partial<IHubSection>): IHubSection {
  return {
    id: "home",
    type: "HOME",
    title: "Arsenal",
    description: "Gestiona mazos.",
    href: "/hub/home",
    isLocked: false,
    lockReason: null,
    ...overrides,
  };
}

describe("hub-node-interaction", () => {
  it("resuelve navegación cuando la sección está desbloqueada", () => {
    expect(resolveHubNodeInteraction(createSection())).toEqual({ kind: "navigate", href: "/hub/home" });
  });

  it("resuelve bloqueo cuando la sección está cerrada", () => {
    expect(resolveHubNodeInteraction(createSection({ isLocked: true }))).toEqual({ kind: "locked" });
  });
});
