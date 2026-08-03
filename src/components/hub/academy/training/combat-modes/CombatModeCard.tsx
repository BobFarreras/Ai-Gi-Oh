// src/components/hub/academy/training/combat-modes/CombatModeCard.tsx - Presenta una modalidad disponible o futura.
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole } from "lucide-react";
import { ICombatModeOption } from "./internal/combat-mode.types";

interface ICombatModeCardProps {
  option: ICombatModeOption;
}

const TONE_STYLES: Record<ICombatModeOption["id"], { border: string; glow: string; label: string }> = {
  classic: {
    border: "border-cyan-300/35 hover:border-cyan-200/70",
    glow: "from-cyan-400/30 via-blue-600/10",
    label: "text-cyan-100",
  },
  survival: {
    border: "border-amber-300/25",
    glow: "from-orange-500/25 via-red-700/10",
    label: "text-amber-100",
  },
  olympus: {
    border: "border-violet-200/25",
    glow: "from-violet-400/25 via-amber-300/10",
    label: "text-violet-100",
  },
};

/** Renderiza una tarjeta semántica sin activar navegación para modos aún no publicados. */
export function CombatModeCard({ option }: ICombatModeCardProps) {
  const tone = TONE_STYLES[option.id];
  const content = (
    <>
      <div className="absolute inset-0">
        <Image src={option.imageUrl} alt={option.imageAlt} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover opacity-60 transition duration-500 group-hover:scale-[1.03] group-hover:opacity-75" />
        <div className={`absolute inset-0 bg-gradient-to-b ${tone.glow} to-zinc-950`} />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-transparent" />
      </div>
      <div className="relative flex min-h-[25rem] flex-col justify-end p-6 sm:min-h-[28rem]">
        <p className={`text-xs font-black uppercase tracking-[0.22em] ${tone.label}`}>{option.eyebrow}</p>
        <h2 className="mt-2 text-3xl font-black uppercase tracking-tight text-white">{option.title}</h2>
        <p className="mt-3 max-w-sm text-sm leading-6 text-zinc-300">{option.description}</p>
        <span className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/35 px-4 text-sm font-bold text-white backdrop-blur-sm">
          {option.href ? <ArrowUpRight aria-hidden size={18} /> : <LockKeyhole aria-hidden size={17} />}
          {option.availabilityLabel}
        </span>
      </div>
    </>
  );

  const classes = `group relative isolate overflow-hidden rounded-3xl border bg-zinc-950 shadow-2xl transition ${tone.border}`;
  if (option.href) return <Link href={option.href} aria-label={option.availabilityLabel} className={classes}>{content}</Link>;
  return <article data-availability="unavailable" className={`${classes} cursor-not-allowed opacity-80`}>{content}</article>;
}
