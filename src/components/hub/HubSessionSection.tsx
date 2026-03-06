// src/components/hub/HubSessionSection.tsx - Widget HUD de sesión con acción de cierre para el hub.
"use client";

import { LogoutButton } from "@/components/auth/LogoutButton";

export function HubSessionSection() {
  return (
    <section className="relative flex items-center justify-center">
      <div className="absolute -left-6 top-1/2 hidden h-[1px] w-6 -translate-y-1/2 bg-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.8)] sm:block" />
      
      <LogoutButton iconOnly confirmBeforeLogout />
    </section>
  );
}
