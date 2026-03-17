// src/components/game/board/ui/layout/internal/BoardMobilePhaseButton.tsx - Botón reutilizable de fase móvil con variante estática o animada.
"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IBoardMobilePhaseButtonProps {
  ariaLabel: string;
  disabled: boolean;
  onClick?: () => void;
  icon: LucideIcon;
  text?: string;
  className: string;
  heightPx: number;
  widthPx: number;
  fontSizePx: number;
  withMotion: boolean;
  isActive: boolean;
}

const buttonClass =
  "relative flex items-center justify-center border-b-[2px] px-1 font-black uppercase tracking-wider [clip-path:polygon(6%_0,100%_0,94%_100%,0_100%)]";

/**
 * Renderiza un botón de fase con estilos unificados y animación opcional.
 */
export function BoardMobilePhaseButton({
  ariaLabel,
  disabled,
  onClick,
  icon: Icon,
  text,
  className,
  heightPx,
  widthPx,
  fontSizePx,
  withMotion,
  isActive,
}: IBoardMobilePhaseButtonProps) {
  const content = (
    <span className="flex items-center justify-center gap-1">
      <Icon size={12} />
      {text ? <span>{text}</span> : null}
    </span>
  );
  const style = { height: `${heightPx}px`, width: `${widthPx}px`, fontSize: `${fontSizePx}px` };
  const resolvedClassName = cn(buttonClass, className);
  if (!withMotion) {
    return (
      <button aria-label={ariaLabel} disabled={disabled} onClick={onClick} className={resolvedClassName} style={style}>
        {content}
      </button>
    );
  }
  return (
    <motion.button
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      className={resolvedClassName}
      style={style}
      animate={{ scale: isActive ? 1.03 : 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
    >
      {content}
    </motion.button>
  );
}
