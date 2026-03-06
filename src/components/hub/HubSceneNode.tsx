// src/components/hub/HubSceneNode.tsx - Renderiza un nodo táctico del hub con iconografía futurista, estado de bloqueo y navegación.
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { IHubMapNode } from "@/core/entities/hub/IHubMapNode";
import { IHubSection } from "@/core/entities/hub/IHubSection";
import { getControlPanelPosition } from "@/components/hub/control-room-layout";
import { getHubNodePreset } from "@/components/hub/nodes/hub-node-presets";

export function HubSceneNode({ node, section }: HubSceneNodeProps) {
  const position = getControlPanelPosition(section.type);
  const [isLockReasonVisible, setIsLockReasonVisible] = useState(false);
  const preset = getHubNodePreset(section.type);
  const Icon = preset.icon;
  const Decor = preset.Decor;
  const statusLabel = useMemo(() => (section.isLocked ? "LOCKED" : "ONLINE"), [section.isLocked]);
  const content = (
    <div className={`hub-node-panel group relative min-h-[162px] w-[292px] max-w-[74vw] overflow-visible border px-4 py-3 text-center transition-all duration-300 ${preset.shellClass}`}>
      <div className="hub-node-scan absolute inset-0 opacity-55" />
      <Decor />
      <div className="absolute left-3 top-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/90">
        <Icon className="h-3.5 w-3.5" />
        <span>{statusLabel}</span>
      </div>
      <div className="absolute right-3 top-3 h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
      <div className="relative mt-6 flex h-full flex-col items-center justify-center">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-cyan-200/85">{node.districtLabel}</p>
        <h2 className="mt-1 text-xl font-black uppercase tracking-wide text-cyan-100">{section.title}</h2>
        <p className="mt-1 text-xs leading-tight text-slate-200/92">{section.description}</p>
        {section.isLocked && isLockReasonVisible ? <p className="mt-2 text-[11px] font-semibold text-amber-300">{section.lockReason}</p> : null}
      </div>
      <div className="hub-node-glow absolute inset-x-0 bottom-0 h-10" />
    </div>
  );

  return (
    <article className="absolute z-30 -translate-x-1/2 -translate-y-1/2" style={{ left: position.left, top: position.top }}>
      {section.isLocked ? (
        <button
          aria-label={`Mostrar bloqueo de ${section.title}`}
          type="button"
          onClick={() => setIsLockReasonVisible((previous) => !previous)}
          className="cursor-pointer border-0 bg-transparent p-0 text-left opacity-95"
        >
          {content}
        </button>
      ) : (
        <Link aria-label={`Abrir ${section.title}`} href={section.href} className="block transition hover:scale-[1.03]">
          {content}
        </Link>
      )}
    </article>
  );
}

interface HubSceneNodeProps {
  node: IHubMapNode;
  section: IHubSection;
}
