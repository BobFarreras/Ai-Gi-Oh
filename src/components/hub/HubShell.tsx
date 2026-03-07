// src/components/hub/HubShell.tsx - Contenedor raíz del hub que monta fondo, atmósfera y escena de nodos distribuida.
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { HubScene } from "@/components/hub/HubScene";
import { CyberBackground } from "@/components/landing/CyberBackground";

interface HubShellProps {
  playerLabel: string;
  progress: IPlayerHubProgress;
  sections: IHubSection[];
  nodes: IHubMapNode[];
}

export function HubShell({ playerLabel, progress, sections, nodes }: HubShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden text-slate-100">
      <CyberBackground />
      <div className="relative z-20">
        <HubScene playerLabel={playerLabel} progress={progress} showMetaNodes sections={sections} nodes={nodes} />
      </div>
    </main>
  );
}
