// src/components/hub/HubSceneNode.tsx - Renderiza un punto interactivo del mapa del hub con estado bloqueado/desbloqueado.
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { getControlPanelPosition } from "@/components/hub/control-room-layout";

interface HubSceneNodeProps {
  node: IHubMapNode;
  section: IHubSection;
}

export function HubSceneNode({ node, section }: HubSceneNodeProps) {
  const position = getControlPanelPosition(section.type);
  const [isLockReasonVisible, setIsLockReasonVisible] = useState(false);
  const panelWidth = 790;
  const panelHeight = 230;
  const content = (
    <div className="group relative" style={{ width: `${panelWidth}px`, height: `${panelHeight}px` }}>
      <Image
        src="/assets/hud/hud-section.png"
        alt=""
        aria-hidden="true"
        width={920}
        height={700}
        className="pointer-events-none absolute -left-[1%] inset-y-0 h-full w-[106%] object-fill opacity-95"
      />
      <div className="absolute inset-[18%_27%_18%_27%] flex flex-col items-center justify-center text-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-200/85">{node.districtLabel}</p>
        <h2 className="mt-1 text-[clamp(1.08rem,1.6vw,1.55rem)] font-black uppercase tracking-wide text-cyan-100">{section.title}</h2>
        <p className="mt-1 text-[11px] leading-tight text-slate-200/92">{section.description}</p>
        {section.isLocked && isLockReasonVisible ? (
          <p className="mt-2 text-[11px] font-semibold text-amber-300">{section.lockReason}</p>
        ) : null}
      </div>
    
    </div>
  );

  return (
    <article
      className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
      style={{ left: position.left, top: position.top }}
    >
      {section.isLocked ? (
        <button
          aria-label={`Mostrar bloqueo de ${section.title}`}
          type="button"
          onClick={() => setIsLockReasonVisible((previous) => !previous)}
          className="cursor-pointer border-0 bg-transparent p-0 text-left opacity-90"
        >
          {content}
        </button>
      ) : (
        <Link aria-label={`Abrir ${section.title}`} href={section.href} className="block transition hover:scale-[1.02]">
          {content}
        </Link>
      )}
    </article>
  );
}
