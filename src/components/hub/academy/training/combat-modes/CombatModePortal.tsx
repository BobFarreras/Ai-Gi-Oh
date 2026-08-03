// src/components/hub/academy/training/combat-modes/CombatModePortal.tsx - Compone el selector responsive de modalidades de combate.
import Link from "next/link";
import { ChevronLeft, Swords } from "lucide-react";
import { ACADEMY_HOME_ROUTE } from "@/core/constants/routes/academy-routes";
import { CombatModeCard } from "./CombatModeCard";
import { COMBAT_MODE_OPTIONS } from "./internal/combat-mode-options";

/** Presenta el portal sin estado cliente para evitar cargar el motor antes de elegir modo. */
export function CombatModePortal() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#05070c] px-4 py-8 text-white sm:px-6 lg:px-10 lg:py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.1),transparent_32%)]" />
      <div className="relative mx-auto max-w-7xl">
        <Link href={ACADEMY_HOME_ROUTE} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-zinc-200 transition hover:border-white/25 hover:text-white">
          <ChevronLeft aria-hidden size={18} />
          Volver a la Academia
        </Link>
        <header className="mx-auto mb-9 mt-9 max-w-3xl text-center lg:mb-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-100">
            <Swords aria-hidden size={25} />
          </div>
          <p className="mt-5 text-xs font-black uppercase tracking-[0.28em] text-cyan-200">Centro de combate</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl lg:text-6xl">Elige tu desafío</h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
            Perfecciona tu mazo en la Arena, resiste una cadena de rivales o prepara a tus campeones para el Olimpo.
          </p>
        </header>
        <section aria-label="Modos de combate" className="grid gap-5 md:grid-cols-3">
          {COMBAT_MODE_OPTIONS.map((option) => <CombatModeCard key={option.id} option={option} />)}
        </section>
      </div>
    </main>
  );
}
