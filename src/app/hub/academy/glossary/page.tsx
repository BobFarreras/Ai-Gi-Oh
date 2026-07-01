// src/app/hub/academy/glossary/page.tsx - Placeholder del Glosario/Códex (contenido real = Fase 6).
// Existe para que el pilar holográfico de Documentación navegue sin 404 mientras se redacta el contenido.
import { AcademyBackButton } from "@/components/hub/academy/AcademyBackButton";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { ACADEMY_HOME_ROUTE } from "@/core/constants/routes/academy-routes";

export default function AcademyGlossaryPage() {
  return (
    <main className="hub-control-room-bg relative flex h-dvh flex-col items-center justify-center overflow-hidden px-4 text-center">
      <HubSectionEntryBurst />
      <div className="pointer-events-none absolute inset-0 bg-slate-950/45" />
      <div className="pointer-events-none absolute inset-0 hub-control-scan opacity-80" />

      <div className="relative z-10 flex flex-col items-center gap-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/45 bg-cyan-400/10 px-3 py-1">
          <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.85)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100">CÓDEX</span>
        </div>
        <h1 className="text-3xl font-black uppercase tracking-[0.06em] text-white sm:text-5xl">Glosario del Juego</h1>
        <p className="max-w-[46ch] text-sm font-semibold leading-relaxed text-cyan-100/80 sm:text-base">
          La documentación interactiva para novatos (tipos de carta, efectos, versiones V1–V5 y pasivas de
          maestría) está en construcción.
        </p>
        <AcademyBackButton label="Volver a Academy" href={ACADEMY_HOME_ROUTE} />
      </div>
    </main>
  );
}
