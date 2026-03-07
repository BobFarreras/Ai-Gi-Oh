// src/components/hub/internal/hub-node-navigation-flow.ts - Máquina de estado pura para navegación de nodos del Hub con fases de targeting y carga.
export type HubNavigationStatus = "idle" | "targeting" | "routing" | "timeout";

export interface IHubNodeNavigationState {
  status: HubNavigationStatus;
  targetNodeId: string | null;
  targetHref: string | null;
}

export type HubNodeNavigationEvent =
  | { type: "NODE_SELECTED"; nodeId: string; href: string }
  | { type: "CAMERA_ARRIVED" }
  | { type: "ROUTE_PENDING" }
  | { type: "ROUTE_TIMEOUT" }
  | { type: "ROUTE_COMPLETED" }
  | { type: "RESET" };

export function createIdleHubNavigationState(): IHubNodeNavigationState {
  return { status: "idle", targetNodeId: null, targetHref: null };
}

function isBusy(state: IHubNodeNavigationState): boolean {
  return state.status !== "idle";
}

export function reduceHubNodeNavigation(
  state: IHubNodeNavigationState,
  event: HubNodeNavigationEvent,
): IHubNodeNavigationState {
  switch (event.type) {
    case "NODE_SELECTED": {
      if (isBusy(state)) return state;
      return { status: "targeting", targetNodeId: event.nodeId, targetHref: event.href };
    }
    case "CAMERA_ARRIVED": {
      if (state.status !== "targeting") return state;
      return { ...state, status: "routing" };
    }
    case "ROUTE_PENDING": {
      if (state.status !== "routing") return state;
      return state;
    }
    case "ROUTE_TIMEOUT": {
      if (state.status !== "routing") return state;
      return { ...state, status: "timeout" };
    }
    case "ROUTE_COMPLETED":
    case "RESET": {
      return createIdleHubNavigationState();
    }
  }
}
