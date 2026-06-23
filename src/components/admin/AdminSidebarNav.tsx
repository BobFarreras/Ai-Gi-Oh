// src/components/admin/AdminSidebarNav.tsx - Sidebar lateral admin con navegación por secciones y modo colapsado para ahorrar espacio.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface IAdminSidebarNavProps {
  portalSlug: string;
}

interface IAdminSidebarItem {
  href: string;
  icon: "catalog" | "market" | "starter" | "story" | "audit" | "analytics";
  label: string;
  description: string;
}

function buildItems(portalSlug: string): IAdminSidebarItem[] {
  const base = `/admin-portal/${portalSlug}`;
  return [
    { href: `${base}/catalog`, icon: "catalog", label: "Catálogo", description: "Card Catalog" },
    { href: `${base}/market`, icon: "market", label: "Market", description: "Listings & Packs" },
    { href: `${base}/starter-deck`, icon: "starter", label: "Starter Deck", description: "Plantilla inicial" },
    { href: `${base}/story-decks`, icon: "story", label: "Story Decks", description: "Oponentes & Duelos" },
    { href: `${base}/audit`, icon: "audit", label: "Auditoría", description: "Historial de cambios" },
    { href: `${base}/analytics`, icon: "analytics", label: "Analytics", description: "Dashboard de telemetría" },
  ];
}

function AdminNavIcon({ icon, isActive }: { icon: IAdminSidebarItem["icon"]; isActive: boolean }) {
  const cls = `h-5 w-5 fill-none stroke-current transition-all ${isActive ? "drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]" : ""}`;
  if (icon === "catalog")
    return (
      <svg viewBox="0 0 24 24" className={cls}>
        <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="1.6" />
        <line x1="9" y1="4" x2="9" y2="20" strokeWidth="1.6" />
        <line x1="12.5" y1="9" x2="18" y2="9" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="12.5" y1="13" x2="18" y2="13" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="12.5" y1="17" x2="16" y2="17" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  if (icon === "market")
    return (
      <svg viewBox="0 0 24 24" className={cls}>
        <path d="M3 9l1.5-5h15L21 9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="9" width="18" height="12" rx="1.5" strokeWidth="1.6" />
        <path d="M9 9v3a3 3 0 006 0V9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (icon === "starter")
    return (
      <svg viewBox="0 0 24 24" className={cls}>
        <rect x="5" y="3" width="14" height="18" rx="2" strokeWidth="1.6" />
        <line x1="8.5" y1="8" x2="15.5" y2="8" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="8.5" y1="12" x2="15.5" y2="12" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="8.5" y1="16" x2="12" y2="16" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    );
  if (icon === "story")
    return (
      <svg viewBox="0 0 24 24" className={cls}>
        <path d="M12 2L4 6v7c0 5 3.5 8.5 8 10 4.5-1.5 8-5 8-10V6L12 2z" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  if (icon === "analytics")
    return (
      <svg viewBox="0 0 24 24" className={cls}>
        <path d="M3 3v18h18" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M7 16l4-5 4 3 5-7" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className={cls}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeWidth="1.6" strokeLinejoin="round" />
      <polyline points="14 2 14 8 20 8" strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="16" y1="13" x2="8" y2="13" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16" y1="17" x2="8" y2="17" strokeWidth="1.6" strokeLinecap="round" />
      <line x1="10" y1="9" x2="8" y2="9" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function AdminSidebarNav({ portalSlug }: IAdminSidebarNavProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const items = buildItems(portalSlug);

  return (
    <aside
      className={`${isCollapsed ? "w-14" : "w-52"} relative flex h-full min-h-0 shrink-0 flex-col rounded-xl border border-cyan-900/50 bg-[linear-gradient(175deg,rgba(4,14,28,0.96),rgba(2,8,18,0.98))] p-2 shadow-[0_0_25px_rgba(6,182,212,0.12),inset_0_0_20px_rgba(0,0,0,0.5)] transition-all duration-200`}
    >
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(135deg,rgba(34,211,238,0.04),transparent_50%,rgba(59,130,246,0.03))]" />

      <button
        type="button"
        aria-label="Plegar o desplegar navegación admin"
        className="relative mb-3 flex h-8 w-full items-center justify-center rounded-lg border border-cyan-800/50 bg-[#020d1a]/80 text-cyan-400 transition-all hover:border-cyan-500 hover:bg-[#031525]/90 hover:text-cyan-300"
        onClick={() => setIsCollapsed((value) => !value)}
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round">
          {isCollapsed
            ? <><path d="M9 6l6 6-6 6" /></>
            : <><path d="M15 6l-6 6 6 6" /></>}
        </svg>
      </button>

      {!isCollapsed && (
        <p className="mb-2 px-2 text-[9px] font-black uppercase tracking-[0.22em] text-cyan-600/70">
          Admin Portal
        </p>
      )}

      <nav className="home-modern-scroll relative min-h-0 flex-1 space-y-1 overflow-y-auto pr-0.5">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`group relative flex h-11 items-center gap-2.5 overflow-hidden rounded-lg border px-2.5 transition-all duration-150 ${
                isActive
                  ? "border-cyan-400/60 bg-[linear-gradient(120deg,rgba(34,211,238,0.12),rgba(6,182,212,0.06))] text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.15)]"
                  : "border-cyan-900/30 bg-[#020c18]/60 text-slate-300 hover:border-cyan-700/50 hover:bg-[#031525]/80 hover:text-cyan-100"
              }`}
            >
              {isActive && (
                <span className="absolute inset-y-0 left-0 w-0.5 rounded-r-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
              )}
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-all ${isActive ? "border-cyan-500/50 bg-cyan-950/60 text-cyan-300" : "border-slate-700/60 bg-slate-900/50 text-slate-400 group-hover:border-cyan-800/60 group-hover:text-cyan-400"}`}>
                <AdminNavIcon icon={item.icon} isActive={isActive} />
              </span>
              {!isCollapsed && (
                <span className="min-w-0 flex-1 truncate">
                  <span className="block text-xs font-bold uppercase tracking-wider">{item.label}</span>
                  <span className={`block text-[10px] ${isActive ? "text-cyan-400/70" : "text-slate-500 group-hover:text-slate-400"}`}>{item.description}</span>
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {!isCollapsed && (
        <div className="mt-2 border-t border-cyan-900/30 pt-2">
          <p className="text-center text-[9px] text-slate-600 uppercase tracking-widest">Admin v2</p>
        </div>
      )}
    </aside>
  );
}
