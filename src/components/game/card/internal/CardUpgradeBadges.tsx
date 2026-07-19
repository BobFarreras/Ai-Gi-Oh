// src/components/game/card/internal/CardUpgradeBadges.tsx - Marcas de "carta mejorada por objetos" (ATK/DEF).
// Fuente visual ÚNICA de los badges: los usan la carta grande (detalle/combate) y la miniatura (deck/almacén),
// así el icono es idéntico en todos lados. Dos variantes:
//   - variant "detail": sello con caja (fondo negro + borde oro, esquina biselada) e icono + ×N. Hay sitio.
//   - variant "compact": SOLO el icono suelto (sin caja ni borde ni fondo), con sombra para leerse sobre el
//     arte. En miniaturas la caja y el número tapaban la imagen.
import { Shield, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ICardUpgradeCounts } from "./card-frame-types";

type UpgradeStat = "ATTACK" | "DEFENSE";

// Bisel solo en la esquina EXTERNA (la que toca el borde de la carta), como los sellos del marco.
const SEAL_CLIP_LEFT = "polygon(3px 0, 100% 0, 100% 100%, 0 100%, 0 3px)";
const SEAL_CLIP_RIGHT = "polygon(0 0, calc(100% - 3px) 0, 100% 3px, 100% 100%, 0 100%)";

function UpgradeSeal({ stat, count, variant }: { stat: UpgradeStat; count: number; variant: "detail" | "compact" }) {
  const isAttack = stat === "ATTACK";
  const Icon = isAttack ? Swords : Shield;
  const isDetail = variant === "detail";
  const ariaLabel = `${count} mejora${count === 1 ? "" : "s"} de ${isAttack ? "ataque" : "defensa"}`;

  // Compact: icono desnudo, sin caja. Sombra fuerte para que se lea sobre cualquier arte.
  if (!isDetail) {
    return (
      <span aria-label={ariaLabel} className={cn("absolute top-0 z-20", isAttack ? "left-0" : "right-0")}>
        <Icon className="h-3 w-3 text-amber-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)]" aria-hidden />
      </span>
    );
  }

  // Detail: sello con caja e icono + ×N.
  return (
    <span
      aria-label={ariaLabel}
      className={cn(
        "absolute top-0 z-20 flex items-center gap-0.5 border border-amber-400/70 bg-black/85 px-1 py-0.5 text-[10px] font-black leading-none text-amber-300 shadow-[0_0_6px_rgba(251,191,36,0.4)]",
        isAttack ? "left-0" : "right-0",
      )}
      style={{ clipPath: isAttack ? SEAL_CLIP_LEFT : SEAL_CLIP_RIGHT }}
    >
      <Icon className="h-3 w-3" aria-hidden />
      <span>×{count}</span>
    </span>
  );
}

export function CardUpgradeBadges({ counts, variant }: { counts: ICardUpgradeCounts | null; variant: "detail" | "compact" }) {
  if (!counts) return null;
  return (
    <>
      {counts.attack > 0 ? <UpgradeSeal stat="ATTACK" count={counts.attack} variant={variant} /> : null}
      {counts.defense > 0 ? <UpgradeSeal stat="DEFENSE" count={counts.defense} variant={variant} /> : null}
    </>
  );
}
