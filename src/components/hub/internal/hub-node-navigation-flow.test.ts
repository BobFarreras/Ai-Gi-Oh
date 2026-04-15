// src/components/hub/internal/hub-node-navigation-flow.test.ts - Valida la máquina de estados de navegación del Hub para feedback y carga.
import { describe, expect, it } from "vitest";
import {
  createIdleHubNavigationState,
  reduceHubNodeNavigation,
} from "@/components/hub/internal/hub-node-navigation-flow";

describe("hub-node-navigation-flow", () => {
  it("inicia targeting al seleccionar un nodo", () => {
    const state = createIdleHubNavigationState();
    const next = reduceHubNodeNavigation(state, {
      type: "NODE_SELECTED",
      nodeId: "market",
      href: "/hub/market",
    });
    expect(next.status).toBe("targeting");
    expect(next.targetNodeId).toBe("market");
    expect(next.targetHref).toBe("/hub/market");
  });

  it("ignora segundo click mientras no termina la navegación", () => {
    const state = reduceHubNodeNavigation(createIdleHubNavigationState(), {
      type: "NODE_SELECTED",
      nodeId: "market",
      href: "/hub/market",
    });
    const next = reduceHubNodeNavigation(state, {
      type: "NODE_SELECTED",
      nodeId: "home",
      href: "/hub/arsenal",
    });
    expect(next).toEqual(state);
  });

  it("pasa a routing cuando la cámara llega al nodo", () => {
    const targetingState = reduceHubNodeNavigation(createIdleHubNavigationState(), {
      type: "NODE_SELECTED",
      nodeId: "market",
      href: "/hub/market",
    });
    const next = reduceHubNodeNavigation(targetingState, { type: "CAMERA_ARRIVED" });
    expect(next.status).toBe("routing");
    expect(next.targetHref).toBe("/hub/market");
  });

  it("activa timeout si la ruta tarda demasiado", () => {
    const routingState = reduceHubNodeNavigation(
      reduceHubNodeNavigation(
        reduceHubNodeNavigation(createIdleHubNavigationState(), {
          type: "NODE_SELECTED",
          nodeId: "market",
          href: "/hub/market",
        }),
        { type: "CAMERA_ARRIVED" },
      ),
      { type: "ROUTE_PENDING" },
    );
    const timeoutState = reduceHubNodeNavigation(routingState, { type: "ROUTE_TIMEOUT" });
    expect(timeoutState.status).toBe("timeout");
    expect(timeoutState.targetNodeId).toBe("market");
  });

  it("resetea a idle al completar la ruta", () => {
    const timeoutState = reduceHubNodeNavigation(
      reduceHubNodeNavigation(
        reduceHubNodeNavigation(
          reduceHubNodeNavigation(createIdleHubNavigationState(), {
            type: "NODE_SELECTED",
            nodeId: "market",
            href: "/hub/market",
          }),
          { type: "CAMERA_ARRIVED" },
        ),
        { type: "ROUTE_PENDING" },
      ),
      { type: "ROUTE_TIMEOUT" },
    );
    const next = reduceHubNodeNavigation(timeoutState, { type: "ROUTE_COMPLETED" });
    expect(next).toEqual(createIdleHubNavigationState());
  });

  it("permite cancelar manualmente para volver a idle", () => {
    const state = reduceHubNodeNavigation(createIdleHubNavigationState(), {
      type: "NODE_SELECTED",
      nodeId: "home",
      href: "/hub/arsenal",
    });
    const next = reduceHubNodeNavigation(state, { type: "RESET" });
    expect(next).toEqual(createIdleHubNavigationState());
  });
});

