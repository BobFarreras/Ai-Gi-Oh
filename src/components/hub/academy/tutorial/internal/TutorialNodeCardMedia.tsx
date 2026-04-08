// src/components/hub/academy/tutorial/internal/TutorialNodeCardMedia.tsx - Renderiza arte temático por tipo de nodo tutorial para reforzar identidad visual.
import Image from "next/image";
import { Card } from "@/components/game/card/Card";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { ITutorialMapNodeRuntime } from "@/core/entities/tutorial/ITutorialMapNode";

interface ITutorialNodeCardMediaProps {
  node: ITutorialMapNodeRuntime;
}

const ARSENAL_CARD_STACK = [
  { card: ENTITY_CARDS[16], className: "left-[2%] top-[16%] -rotate-[18deg]" },
  { card: EXECUTION_CARDS[0], className: "left-[16%] top-[4%] rotate-[12deg]" },
  { card: ENTITY_CARDS[2], className: "left-[30%] top-[20%] -rotate-[9deg]" },
  { card: EXECUTION_CARDS[2], className: "left-[46%] top-[7%] rotate-[15deg]" },
  { card: ENTITY_CARDS[4], className: "left-[61%] top-[18%] -rotate-[14deg]" },
  { card: EXECUTION_CARDS[4], className: "left-[76%] top-[8%] rotate-[11deg]" },
];

function renderArsenalMosaic(): JSX.Element {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(34,211,238,0.16),transparent_45%),linear-gradient(180deg,rgba(2,11,22,0.68),rgba(2,11,22,0.94))]">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.08)_1px,transparent_1px)] bg-[size:18px_18px] opacity-35" />
      {ARSENAL_CARD_STACK.map((entry) => (
        <div key={entry.card.id} className={`absolute origin-top-left scale-[0.19] shadow-[0_0_18px_rgba(34,211,238,0.22)] ${entry.className}`}>
          <Card card={entry.card} disableHoverEffects disableDefaultShadow isPerformanceMode />
        </div>
      ))}
    </div>
  );
}

function renderMarketNexus(): JSX.Element {
  return (
    <div className="relative h-full w-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.15),transparent_65%)]">
      <Image src="/assets/renders/nexus.webp" alt="Nexus" fill className="object-contain p-2" sizes="(max-width: 1024px) 50vw, 25vw" />
    </div>
  );
}

function renderCombatPreview(): JSX.Element {
  return (
    <div className="relative grid h-full w-full grid-cols-[1fr_auto_1fr] overflow-hidden bg-[#04111d]">
      <div className="relative">
        <Image src="/assets/story/player/intro-Jugador.png" alt="Jugador" fill className="object-contain object-bottom" sizes="(max-width: 1024px) 40vw, 20vw" />
      </div>
      <div className="z-10 flex items-center justify-center px-2 text-xl font-black tracking-[0.14em] text-cyan-100 sm:text-2xl">VS</div>
      <div className="relative">
        <Image src="/assets/story/opponents/opp-ch1-biglog/intro-BigLog.png" alt="BigLog" fill className="object-contain object-bottom" sizes="(max-width: 1024px) 40vw, 20vw" />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,rgba(2,11,22,0.48)_0%,rgba(2,11,22,0.08)_60%)]" />
    </div>
  );
}

function renderRewardPreview(): JSX.Element {
  return (
    <div className="relative flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_35%,rgba(250,204,21,0.2),transparent_70%)]">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_18%,rgba(250,204,21,0.22)_50%,transparent_82%)]" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-amber-300/70 bg-amber-950/35 text-4xl font-black text-amber-200 shadow-[0_0_20px_rgba(251,191,36,0.38)]">
        ?
      </div>
      <div className="absolute right-[12%] top-[20%] text-2xl text-amber-200/90">★</div>
      <div className="absolute left-[14%] bottom-[18%] text-xl text-amber-200/85">★</div>
    </div>
  );
}

/** Selecciona el arte de cabecera según el tipo de nodo. */
export function TutorialNodeCardMedia({ node }: ITutorialNodeCardMediaProps) {
  if (node.kind === "ARSENAL") return renderArsenalMosaic();
  if (node.kind === "MARKET") return renderMarketNexus();
  if (node.kind === "COMBAT") return renderCombatPreview();
  return renderRewardPreview();
}
