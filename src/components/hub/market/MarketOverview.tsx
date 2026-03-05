// src/components/hub/market/MarketOverview.tsx - Renderiza una vista inicial del mercado conectada a catálogo y saldo Nexus.
import Link from "next/link";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";

interface MarketOverviewProps {
  catalog: IMarketCatalog;
}

export function MarketOverview({ catalog }: MarketOverviewProps) {
  return (
    <main className="hub-control-room-bg h-full overflow-hidden px-4 py-8 text-slate-100 sm:px-6">
      <section className="mx-auto w-full max-w-6xl rounded-3xl border border-cyan-800/40 bg-[#03101b]/88 p-6 shadow-[0_24px_42px_rgba(2,5,12,0.8)]">
        <header className="mb-5 flex items-end justify-between border-b border-cyan-900/40 pb-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-cyan-300/85">Módulo Market</p>
            <h1 className="text-3xl font-black uppercase tracking-wide text-cyan-100">Mercado Nexus</h1>
          </div>
          <p className="text-lg font-black uppercase text-cyan-200">Saldo: {catalog.wallet.nexus} Nexus</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          <article className="rounded-2xl border border-cyan-900/45 bg-[#081727] p-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Catálogo de Cartas</h2>
            <p className="mt-2 text-sm text-slate-300">Cartas disponibles: {catalog.listings.length}</p>
            <ul className="mt-3 space-y-1 text-xs text-cyan-100/90">
              {catalog.listings.slice(0, 5).map((listing) => (
                <li key={listing.id}>
                  {listing.card.name} · {listing.priceNexus} Nexus · {listing.rarity}
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-cyan-900/45 bg-[#081727] p-4">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Sobres</h2>
            <p className="mt-2 text-sm text-slate-300">Packs disponibles: {catalog.packs.length}</p>
            <ul className="mt-3 space-y-1 text-xs text-cyan-100/90">
              {catalog.packs.map((pack) => (
                <li key={pack.id}>
                  {pack.name} · {pack.cardsPerPack} cartas · {pack.priceNexus} Nexus
                </li>
              ))}
            </ul>
          </article>
        </div>

        <Link
          href="/hub"
          aria-label="Volver a sala de control"
          className="mt-6 inline-block rounded-lg border border-cyan-500/40 px-4 py-2 text-sm font-bold uppercase tracking-wide text-cyan-200 hover:bg-cyan-400/10"
        >
          Volver a Sala de Control
        </Link>
      </section>
    </main>
  );
}
