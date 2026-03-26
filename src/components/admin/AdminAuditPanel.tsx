// src/components/admin/AdminAuditPanel.tsx - Panel read-only de auditoría admin con filtros y paginación navegable.
import { IAdminAuditLogPage, IAdminAuditLogPageQuery } from "@/core/entities/admin/IAdminAuditLog";

interface IAdminAuditCardVisual {
  cardId: string;
  cardName: string;
  renderUrl: string | null;
}

interface IAdminAuditPanelProps {
  portalSlug: string;
  page: IAdminAuditLogPage;
  query: IAdminAuditLogPageQuery;
  cardVisualById: Record<string, IAdminAuditCardVisual>;
}

function buildHref(portalSlug: string, query: IAdminAuditLogPageQuery): string {
  const search = new URLSearchParams();
  search.set("page", String(query.page));
  search.set("pageSize", String(query.pageSize));
  if (query.section) search.set("section", query.section);
  if (query.datePreset) search.set("datePreset", query.datePreset);
  if (query.action) search.set("action", query.action);
  if (query.entityType) search.set("entityType", query.entityType);
  if (query.actorUserId) search.set("actorUserId", query.actorUserId);
  if (query.fromIso) search.set("from", query.fromIso);
  if (query.toIso) search.set("to", query.toIso);
  return `/admin-portal/${portalSlug}/audit?${search.toString()}`;
}

function formatDate(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Intl.DateTimeFormat("es-ES", { dateStyle: "short", timeStyle: "medium" }).format(new Date(timestamp));
}

function toDateInputValue(value?: string): string {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function resolveActionTone(action: string): string {
  if (action.includes("DELETED")) return "border-rose-500/60 bg-rose-900/35 text-rose-100";
  if (action.includes("SAVED") || action.includes("UPSERTED")) return "border-emerald-500/60 bg-emerald-900/30 text-emerald-100";
  return "border-cyan-500/60 bg-cyan-900/25 text-cyan-100";
}

function resolveCardId(entityType: string, entityId: string, payload: Record<string, unknown>): string | null {
  if (entityType === "cards_catalog") return entityId;
  const payloadCardId = payload.cardId;
  return typeof payloadCardId === "string" ? payloadCardId : null;
}

export function AdminAuditPanel({ portalSlug, page, query, cardVisualById }: IAdminAuditPanelProps) {
  const hasPrevious = page.page > 1;
  const hasNext = page.page * page.pageSize < page.total;
  const previousHref = buildHref(portalSlug, { ...query, page: Math.max(1, page.page - 1) });
  const nextHref = buildHref(portalSlug, { ...query, page: page.page + 1 });

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <form action={`/admin-portal/${portalSlug}/audit`} method="get" className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
        <div className="grid gap-2 md:grid-cols-7">
          <select name="section" aria-label="Filtrar por sección de auditoría" defaultValue={query.section ?? "ALL"} className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100">
            <option value="ALL">Sección: Todas</option>
            <option value="CATALOG">Card Catalog</option>
            <option value="MARKET">Market</option>
            <option value="STARTER">Starter Deck</option>
            <option value="STORY">Story Decks</option>
          </select>
          <select name="action" aria-label="Filtrar por acción de auditoría" defaultValue={query.action ?? ""} className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100">
            <option value="">Acción: Todas</option>
            <option value="ADMIN_CATALOG_CARD_UPSERTED">Card upsert</option>
            <option value="ADMIN_MARKET_LISTING_UPSERTED">Listing upsert</option>
            <option value="ADMIN_MARKET_PACK_UPSERTED">Pack upsert</option>
            <option value="ADMIN_MARKET_PACK_DELETED">Pack deleted</option>
            <option value="ADMIN_STARTER_TEMPLATE_SAVED">Starter template saved</option>
            <option value="ADMIN_STORY_DECK_SAVED">Story deck saved</option>
          </select>
          <input name="entityType" aria-label="Filtrar por entidad de auditoría" defaultValue={query.entityType ?? ""} placeholder="Entidad" className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" />
          <input name="actorUserId" aria-label="Filtrar por actor de auditoría" defaultValue={query.actorUserId ?? ""} placeholder="Actor user_id" className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" />
          <select name="datePreset" aria-label="Filtrar por rango de fechas" defaultValue={query.datePreset ?? "ALL"} className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100">
            <option value="ALL">Fecha: Todas</option>
            <option value="TODAY">Hoy</option>
            <option value="LAST_7_DAYS">Últimos 7 días</option>
            <option value="LAST_30_DAYS">Últimos 30 días</option>
            <option value="CUSTOM">Personalizado</option>
          </select>
          <input type="date" name="from" aria-label="Fecha desde" defaultValue={toDateInputValue(query.fromIso)} className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" />
          <input type="date" name="to" aria-label="Fecha hasta" defaultValue={toDateInputValue(query.toIso)} className="h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs text-slate-100" />
          <div className="flex items-center gap-2 md:col-span-2">
            <input type="hidden" name="page" value="1" />
            <input type="hidden" name="pageSize" value={String(query.pageSize)} />
            <button type="submit" aria-label="Aplicar filtros de auditoría" className="h-9 rounded-md border border-cyan-500 px-3 text-xs font-bold uppercase text-cyan-200">Filtrar</button>
            <a href={`/admin-portal/${portalSlug}/audit?page=1&pageSize=${query.pageSize}`} aria-label="Limpiar filtros de auditoría" className="h-9 rounded-md border border-slate-600 px-3 text-xs font-bold uppercase leading-9 text-slate-200">Limpiar</a>
          </div>
        </div>
      </form>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-slate-700 bg-slate-900/70">
        <table className="w-full min-w-[1080px] text-left text-xs text-slate-200">
          <thead className="sticky top-0 bg-slate-900/95 text-cyan-100">
            <tr>
              <th className="px-3 py-2">Fecha</th>
              <th className="px-3 py-2">Acción</th>
              <th className="px-3 py-2">Entidad</th>
              <th className="px-3 py-2">Entity ID</th>
              <th className="px-3 py-2">Carta</th>
              <th className="px-3 py-2">Actor</th>
              <th className="px-3 py-2">Payload</th>
            </tr>
          </thead>
          <tbody>
            {page.items.map((entry) => {
              const cardId = resolveCardId(entry.entityType, entry.entityId, entry.payload);
              const cardVisual = cardId ? cardVisualById[cardId] : undefined;
              return (
              <tr key={entry.id} className="border-t border-slate-800">
                <td className="px-3 py-2 whitespace-nowrap">{formatDate(entry.createdAtIso)}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-md border px-2 py-1 font-semibold ${resolveActionTone(entry.action)}`}>{entry.action}</span>
                </td>
                <td className="px-3 py-2">{entry.entityType}</td>
                <td className="px-3 py-2">{entry.entityId}</td>
                <td className="px-3 py-2">
                  {cardVisual ? (
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={cardVisual.renderUrl ?? "/assets/bgs/bg-tech.jpg"} alt={cardVisual.cardName} className="h-10 w-8 rounded border border-slate-600 object-cover" />
                      <div className="leading-tight">
                        <p className="font-semibold text-cyan-100">{cardVisual.cardName}</p>
                        <p className="text-[11px] text-slate-400">{cardVisual.cardId}</p>
                      </div>
                    </div>
                  ) : <span className="text-slate-500">-</span>}
                </td>
                <td className="px-3 py-2">{entry.actorUserId}</td>
                <td className="px-3 py-2">
                  <code className="line-clamp-2 block max-w-[300px] whitespace-pre-wrap text-[11px] text-slate-300">{JSON.stringify(entry.payload, null, 0)}</code>
                </td>
              </tr>
            );})}
            {page.items.length === 0 ? <tr><td colSpan={7} className="px-3 py-6 text-center text-slate-400">Sin eventos para los filtros actuales.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <footer className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-xs text-slate-200">
        <span>Total: {page.total} · Página {page.page}</span>
        <div className="flex items-center gap-2">
          <a href={previousHref} aria-label="Página anterior de auditoría" className={`rounded-md border px-2 py-1 font-bold uppercase ${hasPrevious ? "border-cyan-500 text-cyan-200" : "pointer-events-none border-slate-700 text-slate-500"}`}>Anterior</a>
          <a href={nextHref} aria-label="Página siguiente de auditoría" className={`rounded-md border px-2 py-1 font-bold uppercase ${hasNext ? "border-cyan-500 text-cyan-200" : "pointer-events-none border-slate-700 text-slate-500"}`}>Siguiente</a>
        </div>
      </footer>
    </section>
  );
}
