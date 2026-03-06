// src/components/game/card/internal/card-frame-meta.ts - Utilidades visuales para badge de tipo y meta de arquetipo.
import { Binary, Bot, Braces, Cpu, Database, ShieldCheck, Wrench } from "lucide-react";
import { ICard } from "@/core/entities/ICard";

export function resolveTypeBadge(card: ICard): string {
  if (card.type !== "ENTITY") return card.type;
  return card.archetype ? `${card.archetype}` : "ENTITY";
}

export function resolveEntityArchetypeMeta(archetype: ICard["archetype"]): { Icon: typeof Bot; chipClass: string } | null {
  switch (archetype) {
    case "LLM":
      return { Icon: Bot, chipClass: "text-fuchsia-200 bg-fuchsia-500/20 border-fuchsia-300/45" };
    case "FRAMEWORK":
      return { Icon: Braces, chipClass: "text-sky-200 bg-sky-500/20 border-sky-300/45" };
    case "DB":
      return { Icon: Database, chipClass: "text-emerald-200 bg-emerald-500/20 border-emerald-300/45" };
    case "IDE":
      return { Icon: Binary, chipClass: "text-orange-200 bg-orange-500/20 border-orange-300/45" };
    case "LANGUAGE":
      return { Icon: Cpu, chipClass: "text-indigo-200 bg-indigo-500/20 border-indigo-300/45" };
    case "TOOL":
      return { Icon: Wrench, chipClass: "text-amber-200 bg-amber-500/20 border-amber-300/45" };
    case "SECURITY":
      return { Icon: ShieldCheck, chipClass: "text-cyan-100 bg-cyan-500/20 border-cyan-300/45" };
    default:
      return null;
  }
}

