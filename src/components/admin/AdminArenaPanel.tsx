// src/components/admin/AdminArenaPanel.tsx - Panel admin de Arena: edita tiers y oponentes (perfil, variantes y cartas con overrides).
"use client";

import { useAdminArena } from "@/components/admin/internal/arena/use-admin-arena";
import { AdminArenaTierRow } from "@/components/admin/internal/arena/AdminArenaTierRow";
import { AdminArenaOpponentEditor } from "@/components/admin/internal/arena/AdminArenaOpponentEditor";

export function AdminArenaPanel() {
  const arena = useAdminArena();
  const isBusy = arena.status === "saving" || arena.status === "loading";

  const addTier = () => {
    const nextTier = arena.tiers.reduce((max, tier) => Math.max(max, tier.tier), 0) + 1;
    arena.saveTier({ tier: nextTier, code: "NUEVO", requiredWinsInPreviousTier: 5, aiDifficulty: "NORMAL", opponentId: arena.opponents[0]?.id ?? "", rewardMultiplier: 1, isActive: false });
  };
  const addOpponent = () => {
    const id = `arena-opp-${Math.random().toString(36).slice(2, 7)}`;
    // Avatar/intro por defecto reutilizan assets existentes; el admin los cambia antes de activar el oponente.
    arena.saveOpponent({ id, codeName: id, displayName: "Nuevo oponente", avatarUrl: "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.webp", introUrl: "/assets/story/opponents/opp-ch1-apprentice/intro-GenNvim.webp", storyOpponentId: "opp-nuevo", isActive: false, sortOrder: arena.opponents.length + 1 });
  };

  return (
    <section className="flex h-full min-h-0 flex-1 flex-col gap-3">
      <div className="rounded-xl border border-cyan-800/50 bg-[linear-gradient(120deg,rgba(4,14,30,0.96),rgba(2,9,20,0.98))] px-4 py-3">
        <h1 className="text-sm font-black uppercase tracking-widest text-cyan-100">Arena</h1>
        <p className="text-[10px] text-slate-400">Edita tiers, oponentes y mazos (con versión/nivel/xp por carta). Los cambios se aplican sin redeploy.</p>
        {arena.feedback ? <p className={`mt-1.5 text-[11px] font-semibold ${arena.status === "error" ? "text-rose-300" : "text-emerald-300"}`}>{arena.feedback}</p> : null}
        {arena.status === "error" && !arena.feedback ? <p className="mt-1.5 text-[11px] font-semibold text-rose-300">No se pudo cargar el catálogo de arena.</p> : null}
      </div>

      <div className="home-modern-scroll min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
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
    </section>
  );
}
