// src/components/hub/academy/AcademyBackButton.tsx - Botón reusable de retorno para Academy con estética roja estilo logout.
"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

interface IAcademyBackButtonProps {
  label: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Unifica botones de regreso de Academy para evitar duplicación visual y de copy.
 */
export function AcademyBackButton({ label, href, onClick, className }: IAcademyBackButtonProps) {
  const buttonClassName = cn(
    "group relative inline-flex items-center justify-center overflow-hidden border border-red-400/55 bg-[#12060a]/90 px-6 py-2.5",
    "font-mono text-[11px] font-black uppercase tracking-[0.18em] text-red-100 transition-all",
    "hover:border-red-300 hover:bg-[#1f070e] hover:shadow-[0_0_18px_rgba(248,113,113,0.35)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70",
    className,
  );

  const content = (
    <>
      <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(248,113,113,0.08)_50%)] bg-[length:100%_4px] opacity-50" />
      <span className="relative z-10">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-label={label}
        className={buttonClassName}
        style={{ clipPath: "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)" }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={buttonClassName}
      style={{ clipPath: "polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)" }}
    >
      {content}
    </button>
  );
}

