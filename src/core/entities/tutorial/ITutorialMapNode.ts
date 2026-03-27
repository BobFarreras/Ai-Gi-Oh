// src/core/entities/tutorial/ITutorialMapNode.ts - Contratos del mapa de tutorial por nodos guiados y desbloqueo secuencial.
export type TutorialNodeKind = "ARSENAL" | "COMBAT" | "MARKET" | "REWARD";

export interface ITutorialMapNodeDefinition {
  id: string;
  order: number;
  title: string;
  description: string;
  kind: TutorialNodeKind;
  href: string;
}

export type TutorialNodeState = "LOCKED" | "AVAILABLE" | "COMPLETED";

export interface ITutorialMapNodeRuntime extends ITutorialMapNodeDefinition {
  state: TutorialNodeState;
}
