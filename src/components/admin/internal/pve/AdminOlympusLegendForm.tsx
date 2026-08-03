// src/components/admin/internal/pve/AdminOlympusLegendForm.tsx - Identidad, arte, ventana de disponibilidad y recompensas de una leyenda.
"use client";

import { ICard } from "@/core/entities/ICard";
import { IAdminPveArenaOpponentRef, IUpsertOlympusLegendCommand } from "@/core/entities/admin/IAdminPveModes";
import { OLYMPUS_AI_PROFILES } from "@/core/entities/admin/IAdminPveModes.types";
import { PVE_FIELD, PVE_LABEL, PVE_SECTION, PVE_TITLE } from "@/components/admin/internal/pve/admin-pve-styles";

interface IAdminOlympusLegendFormProps {
  legend: IUpsertOlympusLegendCommand;
  arenaOpponents: IAdminPveArenaOpponentRef[];
  /** Catálogo real: la carta de botín se elige de una lista, no se teclea un id a ciegas. */
  validCards: ICard[];
  onEdit: (patch: Partial<IUpsertOlympusLegendCommand>) => void;
}

const ASSET_FIELDS: { key: "avatarPath" | "introPath" | "victoryPath" | "defeatPath"; label: string }[] = [
  { key: "avatarPath", label: "Avatar" },
  { key: "introPath", label: "Intro" },
  { key: "victoryPath", label: "Victoria" },
  { key: "defeatPath", label: "Derrota" },
];

const REWARD_FIELDS: { key: "baseFragmentReward" | "firstVictoryFragmentBonus" | "defeatFragmentReward"; label: string; hint: string }[] = [
  { key: "baseFragmentReward", label: "Victoria", hint: "Éter por cada victoria." },
  { key: "firstVictoryFragmentBonus", label: "Primera victoria", hint: "Bonus único por leyenda." },
  { key: "defeatFragmentReward", label: "Derrota", hint: "Compensación explícita, nunca premium." },
];

/** Corta el ISO a `datetime-local`; una ventana vacía significa "siempre disponible". */
const toLocalInput = (iso: string | null): string => (iso ? new Date(iso).toISOString().slice(0, 16) : "");
const fromLocalInput = (value: string): string | null => (value ? new Date(value).toISOString() : null);

export function AdminOlympusLegendForm({ legend, arenaOpponents, validCards, onEdit }: IAdminOlympusLegendFormProps) {
  return (
    <div className="space-y-3">
      <section className={PVE_SECTION}>
        <h3 className={`${PVE_TITLE} mb-2`}>Identidad</h3>
        <div className="flex flex-wrap items-center gap-2">
          <label className={PVE_LABEL}>Nombre
            <input aria-label="Nombre visible de la leyenda" className={`${PVE_FIELD} w-36`} value={legend.displayName}
              onChange={(event) => onEdit({ displayName: event.target.value })} />
          </label>
          <label className={PVE_LABEL}>Código
            <input aria-label="Código de la leyenda" className={`${PVE_FIELD} w-28`} value={legend.code}
              onChange={(event) => onEdit({ code: event.target.value })} />
          </label>
          <label className={PVE_LABEL}>IA
            <select aria-label="Perfil de IA de la leyenda" className={`${PVE_FIELD} w-24`} value={legend.aiProfile}
              onChange={(event) => onEdit({ aiProfile: event.target.value as IUpsertOlympusLegendCommand["aiProfile"] })}>
              {OLYMPUS_AI_PROFILES.map((profile) => <option key={profile} value={profile}>{profile}</option>)}
            </select>
          </label>
          <label className={PVE_LABEL}>LP iniciales
            <input aria-label="LP iniciales de la leyenda" className={`${PVE_FIELD} w-20`} inputMode="numeric" value={legend.startingLp}
              onChange={(event) => onEdit({ startingLp: Number(event.target.value) || 0 })} />
          </label>
          <label className={PVE_LABEL} title="Energía por encima del máximo compartido del motor">Energía +
            <input aria-label="Bonus de energía de la leyenda" className={`${PVE_FIELD} w-12`} inputMode="numeric" value={legend.energyBonus}
              onChange={(event) => onEdit({ energyBonus: Number(event.target.value) || 0 })} />
          </label>
          {/* Referencia de plantilla: el deck real se edita abajo, esta variante solo documenta de dónde salió. */}
          <label className={PVE_LABEL} title="Variante de Arena que sirvió de plantilla; el deck real se edita más abajo">Plantilla
            <select aria-label="Variante de mazo de referencia" className={`${PVE_FIELD} w-52`} value={legend.deckTemplateId}
              onChange={(event) => onEdit({ deckTemplateId: event.target.value })}>
              <option value="">— elige plantilla —</option>
              {arenaOpponents.map((opponent) => (
                <optgroup key={opponent.id} label={opponent.displayName}>
                  {opponent.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.label ?? variant.id} · {variant.deckCount} cartas
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1 text-[11px] text-slate-300">
            <input type="checkbox" aria-label="Leyenda activa" checked={legend.isActive} onChange={(event) => onEdit({ isActive: event.target.checked })} />
            Activa
          </label>
          <label className={PVE_LABEL}>Orden
            <input aria-label="Orden de la leyenda" className={`${PVE_FIELD} w-12`} inputMode="numeric" value={legend.sortOrder}
              onChange={(event) => onEdit({ sortOrder: Number(event.target.value) || 0 })} />
          </label>
        </div>
      </section>

      <section className={PVE_SECTION}>
        <h3 className={`${PVE_TITLE} mb-2`}>Arte y reglas visibles</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {ASSET_FIELDS.map((field) => (
            <label key={field.key} className={PVE_LABEL}>
              {field.label}
              <input aria-label={`Ruta de ${field.label.toLowerCase()}`} className={`${PVE_FIELD} min-w-0 flex-1`} placeholder="/assets/combat/olympus/…"
                value={legend[field.key] ?? ""} onChange={(event) => onEdit({ [field.key]: event.target.value || null })} />
            </label>
          ))}
        </div>
        <label className="mt-2 block text-[10px] text-slate-400">
          Lore
          <input aria-label="Lore de la leyenda" className={`${PVE_FIELD} mt-1 w-full`} value={legend.lore ?? ""}
            onChange={(event) => onEdit({ lore: event.target.value || null })} />
        </label>
        <label className="mt-2 block text-[10px] text-slate-400">
          Reglas especiales (una por línea; el jugador las ve antes de gastar intento)
          <textarea
            aria-label="Reglas especiales de la leyenda"
            rows={3}
            className="mt-1 w-full rounded border border-slate-600 bg-slate-950/70 p-2 text-[11px] text-slate-100 focus:border-cyan-600 focus:outline-none"
            value={legend.specialRules.join("\n")}
            onChange={(event) => onEdit({ specialRules: event.target.value.split("\n").map((rule) => rule.trim()).filter(Boolean) })}
          />
        </label>
      </section>

      <section className={PVE_SECTION}>
        <h3 className={`${PVE_TITLE} mb-2`}>Recompensas y disponibilidad</h3>
        <div className="flex flex-wrap items-center gap-2">
          {REWARD_FIELDS.map((field) => (
            <label key={field.key} className={PVE_LABEL} title={field.hint}>
              {field.label}
              <input aria-label={`Éter por ${field.label.toLowerCase()}`} className={`${PVE_FIELD} w-20`} inputMode="numeric" value={legend[field.key]}
                onChange={(event) => onEdit({ [field.key]: Number(event.target.value) || 0 })} />
            </label>
          ))}
          <label className={PVE_LABEL}>Reward id
            <input aria-label="Identificador de recompensa" className={`${PVE_FIELD} w-40`} value={legend.rewardDefinitionId}
              onChange={(event) => onEdit({ rewardDefinitionId: event.target.value })} />
          </label>
        </div>

        {/* Éter arriba, botín que sale del modo abajo: son dos economías distintas. */}
        <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-slate-700/60 pt-2">
          <label className={PVE_LABEL} title="Nexus acreditado en cada victoria contra esta leyenda">Nexus
            <input aria-label="Nexus por victoria" className={`${PVE_FIELD} w-24`} inputMode="numeric" value={legend.nexusReward}
              onChange={(event) => onEdit({ nexusReward: Number(event.target.value) || 0 })} />
          </label>
          <label className={PVE_LABEL} title="Carta que entra en la colección al ganar">Carta de botín
            <select
              aria-label="Carta de botín de la leyenda"
              className={`${PVE_FIELD} w-56`}
              value={legend.cardRewardId ?? ""}
              onChange={(event) => onEdit({ cardRewardId: event.target.value || null })}
            >
              <option value="">— sin carta —</option>
              {validCards.map((card) => (
                <option key={card.id} value={card.id}>{card.name} · {card.type}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1 text-[11px] text-slate-300"
            title="Con tres intentos al día, repartirla en cada victoria convierte el modo en una fábrica de copias">
            <input
              type="checkbox"
              aria-label="La carta solo cae en la primera victoria"
              checked={legend.cardRewardFirstVictoryOnly}
              onChange={(event) => onEdit({ cardRewardFirstVictoryOnly: event.target.checked })}
            />
            Solo 1ª victoria
          </label>
          <span className="text-[9.5px] text-slate-500">
            Sin carta seleccionada, esta leyenda solo reparte Éter y Nexus.
          </span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <label className={PVE_LABEL}>Desde
            <input aria-label="Disponible desde" type="datetime-local" className={`${PVE_FIELD} w-44`} value={toLocalInput(legend.availableFromIso)}
              onChange={(event) => onEdit({ availableFromIso: fromLocalInput(event.target.value) })} />
          </label>
          <label className={PVE_LABEL}>Hasta
            <input aria-label="Disponible hasta" type="datetime-local" className={`${PVE_FIELD} w-44`} value={toLocalInput(legend.availableUntilIso)}
              onChange={(event) => onEdit({ availableUntilIso: fromLocalInput(event.target.value) })} />
          </label>
          <span className="text-[9.5px] text-slate-500">Sin fechas = disponible siempre mientras esté activa.</span>
        </div>
      </section>
    </div>
  );
}
