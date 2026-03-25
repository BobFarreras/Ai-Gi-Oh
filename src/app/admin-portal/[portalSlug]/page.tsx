// src/app/admin-portal/[portalSlug]/page.tsx - Renderiza landing inicial del panel administrativo para futuras herramientas de gestión.

interface AdminPortalPageProps {
  params: Promise<{ portalSlug: string }>;
}

export default async function AdminPortalPage({ params }: AdminPortalPageProps) {
  await params;
  return (
    <main className="min-h-dvh bg-slate-950 px-6 py-10 text-slate-100">
      <section className="mx-auto max-w-4xl rounded-xl border border-slate-700 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <p className="mt-2 text-sm text-slate-300">
          Acceso concedido. Desde aquí se habilitarán los módulos de cartas, mercado y decks.
        </p>
      </section>
    </main>
  );
}
