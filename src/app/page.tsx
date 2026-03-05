// src/app/page.tsx - Landing pública principal con acceso a login/registro y redirección al hub si hay sesión.
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export default async function HomePage() {
  const session = await getCurrentUserSession();
  if (session) {
    redirect("/hub");
  }

  return (
    <main className="hub-control-room-bg relative flex min-h-dvh items-center justify-center overflow-hidden px-6 py-12">
      <section className="relative z-10 w-full max-w-5xl rounded-3xl border border-cyan-500/30 bg-[#030a16]/82 p-8 shadow-[0_26px_66px_rgba(0,0,0,0.55)] backdrop-blur-xl md:p-12">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <article>
            <p className="inline-flex items-center border border-cyan-400/35 bg-cyan-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.22em] text-cyan-100">
              Nexus Protocol
            </p>
            <h1 className="mt-5 text-4xl font-black uppercase tracking-[0.05em] text-cyan-50 md:text-6xl">AI-GI-OH</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-cyan-100/82 md:text-lg">
              Construye tu deck, domina el tablero y desbloquea nuevas rutas tácticas en el hub cibernético.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className="border border-cyan-300/60 bg-cyan-500/20 px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-50 transition hover:bg-cyan-400/30"
              >
                Crear cuenta
              </Link>
              <Link
                href="/login"
                className="border border-cyan-700/70 bg-[#030f1f] px-6 py-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-200 transition hover:border-cyan-400/70 hover:text-cyan-100"
              >
                Iniciar sesión
              </Link>
            </div>
          </article>

          <aside className="hub-control-panel-frame relative overflow-hidden rounded-2xl bg-[#020d1a]/70 p-6">
            <div className="hub-control-panel-glow pointer-events-none absolute inset-0" />
            <h2 className="relative z-10 text-lg font-black uppercase tracking-[0.14em] text-cyan-100">Estado del sistema</h2>
            <ul className="relative z-10 mt-5 space-y-3 text-sm text-cyan-100/85">
              <li className="border border-cyan-900/55 bg-[#031527]/70 px-3 py-2">Mercado Nexus: Activo</li>
              <li className="border border-cyan-900/55 bg-[#031527]/70 px-3 py-2">Simulador de Combate: Activo</li>
              <li className="border border-cyan-900/55 bg-[#031527]/70 px-3 py-2">Seguridad de Cuenta: Habilitada</li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
