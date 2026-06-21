// src/app/hub/layout.tsx - Define un viewport fijo para todas las páginas del hub sin inyectar UI acoplada por layout.

export default function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="relative min-h-dvh overflow-hidden">{children}</div>;
}
