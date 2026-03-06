// src/components/hub/HubSceneFallback2D.tsx - Fallback 2D del hub para entornos sin WebGL manteniendo navegación por nodos.
"use client";

import { useState } from "react";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { HubNodeActionPanel } from "@/components/hub/HubNodeActionPanel";
import { resolveHubNodeInteraction } from "@/components/hub/internal/hub-node-interaction";
import { resolveHubNodeBaseColor } from "@/components/hub/internal/hub-3d-node-math";

interface HubSceneFallback2DProps {
  sections: IHubSection[];
  nodes: IHubMapNode[];
  onNavigate: (href: string) => void;
  onNodeHoverSound?: () => void;
  areNodeLabelsVisible?: boolean;
}

export function HubSceneFallback2D({
  sections,
  nodes,
  onNavigate,
  onNodeHoverSound,
  areNodeLabelsVisible = true,
}: HubSceneFallback2DProps) {
  const [lockVisibleBySection, setLockVisibleBySection] = useState<Record<string, boolean>>({});
  const sectionsByType = new Map<HubSectionType, IHubSection>(sections.map((section) => [section.type, section]));

  return (
    <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_45%,rgba(8,47,73,0.55),transparent_52%),linear-gradient(180deg,rgba(1,6,16,0.88),rgba(1,6,16,0.94))]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.05)_1px,transparent_1px)] bg-[size:42px_42px]" />
      {nodes.map((node) => {
        const section = sectionsByType.get(node.sectionType);
        if (!section) return null;
        return (
          <article
            key={node.id}
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
                onAction={() => {
                  const result = resolveHubNodeInteraction(section);
                  if (result.kind === "locked") {
                    setLockVisibleBySection((previous) => ({ ...previous, [section.id]: !previous[section.id] }));
                    return;
                  }
                  onNavigate(result.href);
                }}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
