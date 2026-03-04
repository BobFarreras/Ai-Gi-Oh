// src/components/hub/HubScene.tsx - Construye una sala de control sci-fi con paneles tipo consola para navegar secciones.
import Image from "next/image";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { HubSectionType, IHubSection } from "@/core/entities/hub/IHubSection";
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";
import { HubSceneNode } from "@/components/hub/HubSceneNode";

interface HubSceneProps {
  progress: IPlayerHubProgress;
  sections: IHubSection[];
  nodes: IHubMapNode[];
}

export function HubScene({ progress, sections, nodes }: HubSceneProps) {
  const sectionsByType = new Map<HubSectionType, IHubSection>(sections.map((section) => [section.type, section]));

  return (
    <main className="hub-control-room-bg relative min-h-screen overflow-hidden px-4 py-6 text-slate-100 sm:px-6 sm:py-8">
      <header className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-[#040a12]/85 shadow-[0_18px_36px_rgba(1,3,8,0.7)]">
    
        <div className="relative grid min-h-[94px] grid-cols-[1fr_auto] items-center gap-4 px-6 py-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-cyan-300">Sala de Control</h1>
            <p className="text-xs text-slate-300">Centro táctico principal para gestionar todos los modos del juego.</p>
          </div>
          <div className="text-right text-xs font-semibold text-cyan-100">
            <p>Medallas: {progress.medals}</p>
            <p>Capítulo: {progress.storyChapter}</p>
            <p>Tutorial: {progress.hasCompletedTutorial ? "Completado" : "Pendiente"}</p>
          </div>
        </div>
      </header>

      <section className="relative mx-auto mt-6 h-[74vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-800/85 bg-[#020911]/78 shadow-[0_28px_60px_rgba(1,2,7,0.86),inset_0_0_0_1px_rgba(15,23,42,0.8)]">
        <Image
          src="/assets/hud/hud-container.png"
          alt=""
          aria-hidden="true"
          fill
          className="pointer-events-none z-9990 object-cover opacity-95"
        />
        <div className="absolute inset-[8%_7%_7%_7%] z-20 overflow-hidden rounded-2xl">
          <div className="hub-control-ambient absolute inset-0" />
          <div className="hub-control-flow-beam absolute inset-0" />
        </div>

        {nodes.map((node) => {
          const section = sectionsByType.get(node.sectionType);
          if (!section) {
            return null;
          }
          return <HubSceneNode key={node.id} node={node} section={section} />;
        })}
      </section>
    </main>
  );
}
