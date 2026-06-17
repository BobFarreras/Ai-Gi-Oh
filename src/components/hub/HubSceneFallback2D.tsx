// src/components/hub/HubSceneFallback2D.tsx - Fallback 2D del hub para entornos sin WebGL manteniendo navegación por nodos.
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { HubNodeActionPanel } from "@/components/hub/HubNodeActionPanel";
import { resolveHubNodeInteraction } from "@/components/hub/internal/hub-node-interaction";
import { resolveHubNodeBaseColor } from "@/components/hub/internal/hub-3d-node-math";

interface HubSceneFallback2DProps {
  sections: IHubSection[];
  nodes: IHubMapNode[];
  onNavigate: (nodeId: string, href: string) => void;
  onNodeHoverSound?: () => void;
  areNodeLabelsVisible?: boolean;
  activeNodeId: string | null;
  disabledNodeIds?: readonly string[];
  isNavigationBusy: boolean;
  tourActiveNodeId?: string | null;
}

export function HubSceneFallback2D({
  sections,
  nodes,
  onNavigate,
  onNodeHoverSound,
  areNodeLabelsVisible = true,
  activeNodeId,
  disabledNodeIds = [],
  isNavigationBusy,
  tourActiveNodeId = null,
}: HubSceneFallback2DProps) {
  const [lockVisibleBySection, setLockVisibleBySection] = useState<Record<string, boolean>>({});
  const sectionsByType = new Map<HubSectionType, IHubSection>(sections.map((section) => [section.type, section]));

  return (
    <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_45%,rgba(8,47,73,0.55),transparent_52%),linear-gradient(180deg,rgba(1,6,16,0.88),rgba(1,6,16,0.94))]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.05)_1px,transparent_1px)] bg-[size:42px_42px]" />
      {nodes.map((node, index) => {
        const section = sectionsByType.get(node.sectionType);
        if (!section) return null;
        const isDisabled = disabledNodeIds.includes(node.id);
        const entryDelay = tourActiveNodeId !== null ? 0.08 + index * 0.12 : 0;
        return (
          <motion.article
            key={node.id}
            initial={tourActiveNodeId !== null ? { opacity: 0, scale: 0.5, y: 28 } : false}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 18, delay: entryDelay }}
            className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${node.positionX}%`, top: `${node.positionY}%` }}
          >
            {areNodeLabelsVisible ? (
              <HubNodeActionPanel
                section={section}
                baseColor={resolveHubNodeBaseColor(section.type)}
                isHovered={false}
                isLockReasonVisible={Boolean(lockVisibleBySection[section.id])}
                onHoverStart={onNodeHoverSound}
                isNavigationBusy={isNavigationBusy}
                isTargetNode={activeNodeId === node.id}
                isDisabled={isDisabled}
                isTourTarget={tourActiveNodeId === node.id}
                onAction={() => {
                  if (isDisabled) return;
                  const result = resolveHubNodeInteraction(section);
                  if (result.kind === "locked") {
                    setLockVisibleBySection((previous) => ({ ...previous, [section.id]: !previous[section.id] }));
                    return;
                  }
                  onNavigate(node.id, result.href);
                }}
              />
            ) : null}
          </motion.article>
        );
      })}
    </div>
  );
}
