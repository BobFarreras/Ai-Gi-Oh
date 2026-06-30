// src/components/admin/internal/arena/AdminArenaStructurePanel.tsx - Gestión estructural de arena: alta/edición de tiers y perfiles de oponentes (variantes).
"use client";

import { useAdminArena } from "@/components/admin/internal/arena/use-admin-arena";
import { AdminArenaTierRow } from "@/components/admin/internal/arena/AdminArenaTierRow";
import { AdminArenaOpponentEditor } from "@/components/admin/internal/arena/AdminArenaOpponentEditor";

export function AdminArenaStructurePanel() {
  const arena = useAdminArena();
  const isBusy = arena.status === "saving" || arena.status === "loading";

  const addTier = () => {
    const nextTier = arena.tiers.reduce((max, tier) => Math.max(max, tier.tier), 0) + 1;
    arena.saveTier({ tier: nextTier, code: "NUEVO", requiredWinsInPreviousTier: 5, aiDifficulty: "NORMAL", opponentId: arena.opponents[0]?.id ?? "", rewardMultiplier: 1, isActive: false, defaultVersionTier: null, defaultLevel: null, defaultXp: null });
  };
  const addOpponent = () => {
    const id = `arena-opp-${Math.random().toString(36).slice(2, 7)}`;
    // Avatar/intro por defecto reutilizan assets existentes; el admin los cambia antes de activar el oponente.
    arena.saveOpponent({ id, codeName: id, displayName: "Nuevo oponente", avatarUrl: "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp", introUrl: "/assets/story/opponents/opp-ch1-apprentice/intro-GenNvim.webp", storyOpponentId: "opp-nuevo", isActive: false, sortOrder: arena.opponents.length + 1 });
  };

  return (
    <div className="home-modern-scroll min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
      {arena.feedback ? <p className={`text-[11px] font-semibold ${arena.status === "error" ? "text-rose-300" : "text-emerald-300"}`}>{arena.feedback}</p> : null}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-fuchsia-300">Tiers ({arena.tiers.length})</h2>
          <button type="button" aria-label="Añadir tier" disabled={isBusy} className="h-7 rounded border border-cyan-600/50 px-3 text-[10px] font-bold uppercase text-cyan-200 hover:bg-cyan-900/40 disabled:opacity-50" onClick={addTier}>+ Tier</button>
        </div>
        <div className="space-y-1.5">
          {arena.tiers.map((tier) => (
            <AdminArenaTierRow key={tier.tier} tier={tier} opponents={arena.opponents} isBusy={isBusy} onSave={arena.saveTier} onDelete={(value) => arena.remove("tier", value)} />
          ))}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-black uppercase tracking-wider text-fuchsia-300">Oponentes ({arena.opponents.length})</h2>
          <button type="button" aria-label="Añadir oponente" disabled={isBusy} className="h-7 rounded border border-cyan-600/50 px-3 text-[10px] font-bold uppercase text-cyan-200 hover:bg-cyan-900/40 disabled:opacity-50" onClick={addOpponent}>+ Oponente</button>
        </div>
        <div className="space-y-2">
          {arena.opponents.map((opponent) => (
            <AdminArenaOpponentEditor
              key={opponent.id}
              opponent={opponent}
              validCards={arena.validCards}
              isBusy={isBusy}
              onSaveOpponent={arena.saveOpponent}
              onDeleteOpponent={(id) => arena.remove("opponent", id)}
              onSaveVariant={arena.saveVariant}
              onDeleteVariant={(id) => arena.remove("variant", id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
