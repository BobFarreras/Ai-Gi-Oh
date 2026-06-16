// src/components/hub/internal/hub-scene-node3d-props-equality.ts - Comparador de igualdad para memoizar nodos 3D del hub.
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";

export interface IHubSceneNode3DComparableProps {
  node: IHubMapNode;
  section: IHubSection;
  nodeEntryDelay?: number;
  showActionPanel?: boolean;
  isTargetNode: boolean;
  isNavigationBusy: boolean;
  isDisabled: boolean;
  isTourTarget?: boolean;
  onNodeHoverSound?: () => void;
  onNavigate: (nodeId: string, href: string) => void;
}

function areNodesEqual(a: IHubMapNode, b: IHubMapNode): boolean {
  return (
    a.id === b.id &&
    a.sectionType === b.sectionType &&
    a.districtLabel === b.districtLabel &&
    a.positionX === b.positionX &&
    a.positionY === b.positionY
  );
}

function areSectionsEqual(a: IHubSection, b: IHubSection): boolean {
  return (
    a.id === b.id &&
    a.type === b.type &&
    a.title === b.title &&
    a.description === b.description &&
    a.href === b.href &&
    a.isLocked === b.isLocked &&
    a.lockReason === b.lockReason
  );
}

export function areHubSceneNode3DPropsEqual(
  previous: IHubSceneNode3DComparableProps,
  next: IHubSceneNode3DComparableProps,
): boolean {
  return (
    areNodesEqual(previous.node, next.node) &&
    areSectionsEqual(previous.section, next.section) &&
    previous.nodeEntryDelay === next.nodeEntryDelay &&
    previous.showActionPanel === next.showActionPanel &&
    previous.isTargetNode === next.isTargetNode &&
    previous.isNavigationBusy === next.isNavigationBusy &&
    previous.isDisabled === next.isDisabled &&
    previous.isTourTarget === next.isTourTarget &&
    previous.onNodeHoverSound === next.onNodeHoverSound &&
    previous.onNavigate === next.onNavigate
  );
}
