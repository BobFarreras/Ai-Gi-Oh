// src/components/hub/HubScene.tsx - Renderiza la escena táctica del hub con radar y nodos de navegación por sección.
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { HubProgressSection } from "@/components/hub/HubProgressSection";
import { HubSceneNode } from "@/components/hub/HubSceneNode";
import { HubSessionSection } from "@/components/hub/HubSessionSection";
import { HubUserSection } from "@/components/hub/HubUserSection";

interface HubSceneProps {
  playerLabel?: string;
  progress?: IPlayerHubProgress;
  showMetaNodes?: boolean;
  sections: IHubSection[];
  nodes: IHubMapNode[];
}

export function HubScene({ playerLabel, progress, showMetaNodes = false, sections, nodes }: HubSceneProps) {
  const sectionsByType = new Map<HubSectionType, IHubSection>(sections.map((section) => [section.type, section]));

  return (
    <section className="relative min-h-screen overflow-hidden">
  
    {showMetaNodes && playerLabel ? (
        <div className="absolute left-[6%] top-[6%] z-40">
          <HubUserSection playerLabel={playerLabel} />
        </div>
      ) : null}
      {showMetaNodes && progress ? (
        <div className="absolute left-1/2 top-[7%] z-40 -translate-x-1/2">
          <HubProgressSection progress={progress} />
        </div>
      ) : null}
      {showMetaNodes ? (
        <div className="absolute right-[6%] top-[6%] z-40">
          <HubSessionSection />
        </div>
      ) : null}

      {nodes.map((node) => {
        const section = sectionsByType.get(node.sectionType);
        if (!section) {
          return null;
        }
        return <HubSceneNode key={node.id} node={node} section={section} />;
      })}
    </section>
  );
}
