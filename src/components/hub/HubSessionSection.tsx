// src/components/hub/HubSessionSection.tsx - Nodo flotante de sesión con control de cierre seguro.
import { LogoutButton } from "@/components/auth/LogoutButton";

export function HubSessionSection() {
  return (
    <section className="relative flex min-w-[132px] items-center justify-center border border-cyan-400/45 bg-[#040f1e]/85 px-3 py-3 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
      <div className="absolute -left-5 top-1/2 h-0.5 w-5 -translate-y-1/2 bg-cyan-300/45" />
      <LogoutButton />
    </section>
  );
}
