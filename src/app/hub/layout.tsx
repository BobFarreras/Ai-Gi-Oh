// src/app/hub/layout.tsx - Define un viewport fijo para todas las páginas del hub y evita scroll global del navegador.
export default function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="h-dvh max-h-dvh overflow-hidden">{children}</div>;
}
