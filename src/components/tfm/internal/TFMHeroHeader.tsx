// src/components/tfm/internal/TFMHeroHeader.tsx - Hero principal de la defensa con datos académicos y claim del proyecto.
import Image from "next/image";

/**
 * Presenta contexto del TFM y personajes principales del modo historia.
 */
export function TFMHeroHeader() {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-cyan-500/45 bg-black/70 p-6 sm:p-10">
      <Image src="/assets/bgs/bg-tech.jpg" alt="Fondo tecnológico" fill priority className="object-cover opacity-20" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-blue-500/20" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="font-mono text-sm uppercase tracking-[0.22em] text-cyan-200">Máster Big School · Desarrollo con IA</p>
          <p className="mt-1 text-lg font-semibold text-cyan-50">Director: Brais Moure</p>
          <h1 className="mt-4 text-4xl font-black uppercase leading-tight text-white sm:text-6xl">AI-GI-OH</h1>
          <p className="mt-3 max-w-3xl text-lg leading-relaxed text-cyan-100 sm:text-2xl">
            Juego de cartas táctico en web donde una superIA intenta controlar la red. Este TFM demuestra producto jugable y criterio de ingeniería real.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Image src="/assets/story/opponents/opp-ch1-biglog/avatar-BigLog.png" alt="BigLog" width={164} height={164} className="h-28 w-28 rounded-xl border border-cyan-300/50 bg-black/45 object-cover sm:h-36 sm:w-36" priority />
          <Image src="/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.png" alt="GenNvim" width={164} height={164} className="h-28 w-28 rounded-xl border border-cyan-300/50 bg-black/45 object-cover sm:h-36 sm:w-36" priority />
        </div>
      </div>
    </header>
  );
}
