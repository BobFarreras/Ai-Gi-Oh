// src/app/hub/layout.tsx - Define un viewport fijo para todas las páginas del hub y evita scroll global del navegador.
import { LogoutButton } from "@/components/auth/LogoutButton";

export default function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative h-dvh max-h-dvh overflow-hidden">
      <div className="absolute right-3 top-3 z-[300]">
        <LogoutButton />
      </div>
      {children}
    </div>
  );
}
