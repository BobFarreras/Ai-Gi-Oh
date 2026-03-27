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
  icon: "catalog" | "market" | "starter" | "story" | "audit";
  label: string;
}

function buildItems(portalSlug: string): IAdminSidebarItem[] {
  const base = `/admin-portal/${portalSlug}`;
  return [
    { href: `${base}/catalog`, icon: "catalog", label: "Card Catalog" },
    { href: `${base}/market`, icon: "market", label: "Market" },
    { href: `${base}/starter-deck`, icon: "starter", label: "Starter Deck" },
    { href: `${base}/story-decks`, icon: "story", label: "Story Decks" },
    { href: `${base}/audit`, icon: "audit", label: "Audit Log" },
  ];
}

function AdminNavIcon({ icon }: { icon: IAdminSidebarItem["icon"] }) {
  if (icon === "catalog") return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current"><path d="M4 5h16v14H4zM8 5v14M12 9h6M12 13h6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (icon === "market") return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current"><path d="M4 7h16M7 7l1 11h8l1-11M9 7V5h6v2M10 12h4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (icon === "starter") return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current"><path d="M6 4h12v16H6zM9 8h6M9 12h6M9 16h4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (icon === "story") return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current"><path d="M5 6h14M5 12h10M5 18h14M17 10l2 2-2 2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  return <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current"><path d="M4 6h16M4 12h16M4 18h10M16 18h4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export function AdminSidebarNav({ portalSlug }: IAdminSidebarNavProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const items = buildItems(portalSlug);

  return (
    <aside className={`${isCollapsed ? "w-16" : "w-56"} flex h-full min-h-0 shrink-0 flex-col rounded-xl border border-slate-700 bg-slate-900/70 p-2 transition-all`}>
      <button
        type="button"
        aria-label="Plegar o desplegar navegación admin"
        className="mb-2 h-9 rounded-md border border-slate-600 bg-slate-900 px-2 text-xs font-bold uppercase text-cyan-100"
        onClick={() => setIsCollapsed((value) => !value)}
      >
        {isCollapsed ? ">>" : "<<"}
      </button>
      <nav className="home-modern-scroll min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              className={`flex h-10 items-center rounded-md border px-2 text-xs font-bold uppercase tracking-wide ${
                isActive ? "border-cyan-300 bg-cyan-500/20 text-cyan-100" : "border-slate-600 bg-slate-900 text-slate-200 hover:border-cyan-500"
              }`}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-slate-800 text-[10px]"><AdminNavIcon icon={item.icon} /></span>
              {isCollapsed ? null : <span className="ml-2 truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
