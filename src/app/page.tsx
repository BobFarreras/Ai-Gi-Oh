// src/app/page.tsx - Landing (Server Component). Renderiza en servidor el contenido SEO (h1, descripción, CTAs)
// para que los crawlers lo indexen SIN ejecutar JS, y monta la isla interactiva (intro terminal → narrativa →
// showcase) que se hidrata en cliente. El <noscript> garantiza una landing usable sin JavaScript.
import type { Metadata } from "next";
import { LandingInteractive } from "@/components/landing/LandingInteractive";
import { SITE_NAME, SITE_TAGLINE, SITE_LONG_DESCRIPTION } from "@/core/constants/site";

export const metadata: Metadata = {
  // Canonical explícito de la home (se resuelve contra metadataBase del layout).
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      {/* Contenido SEO server-rendered: siempre presente en el HTML para los crawlers, oculto visualmente
          (la landing interactiva es la experiencia real). Es el ÚNICO h1 de la página. */}
      <section className="sr-only">
        <h1>{SITE_NAME} — {SITE_TAGLINE}</h1>
        <p>{SITE_LONG_DESCRIPTION}</p>
        <nav aria-label="Accesos principales">
          <a href="/register">Registrarse gratis</a>
          <a href="/login">Iniciar sesión</a>
        </nav>
      </section>

      {/* Isla interactiva (cliente). */}
      <LandingInteractive />

      {/* Fallback sin JavaScript: la isla no renderiza nada útil sin JS, así que damos una landing estática
          con los CTAs para usuarios/crawlers sin ejecución de scripts. */}
      <noscript>
        <div className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-[#010308] px-6 text-center text-white">
          <div>
            <p className="text-4xl font-black uppercase tracking-tighter text-cyan-400">{SITE_NAME}</p>
            <p className="mt-2 font-mono tracking-[0.3em] text-cyan-600">{SITE_TAGLINE.toUpperCase()}</p>
          </div>
          <p className="max-w-2xl text-lg text-cyan-100/80">{SITE_LONG_DESCRIPTION}</p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <a href="/register" className="bg-cyan-500 px-6 py-3 font-mono font-black uppercase tracking-widest text-black">Registrarse gratis</a>
            <a href="/login" className="border border-cyan-500/60 px-6 py-3 font-mono font-bold uppercase tracking-widest text-cyan-300">Iniciar sesión</a>
          </div>
        </div>
      </noscript>
    </>
  );
}
