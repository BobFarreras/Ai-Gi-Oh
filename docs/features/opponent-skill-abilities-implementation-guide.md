<!-- docs/features/opponent-skill-abilities-implementation-guide.md - Guía de implementación: sistema de habilidades de combate para oponentes (Arena + Story) editable desde admin panel. -->
# Habilidades de Combate para Oponentes — Guía de Implementación

> Compañero de [`skill-tree-design.md`](./skill-tree-design.md) y [`skill-tree-implementation-guide.md`](./skill-tree-implementation-guide.md). Este documento describe cómo otorgar habilidades del árbol de operador a los oponentes de Arena y Story, con soporte completo para edición desde el admin panel.

---

## 0. Resumen Ejecutivo

**Problema actual:** Los oponentes solo tienen 2 flags booleanos hardcodeados (`combos`, `baitReactiveTrap`) por tier de dificultad. Sin personalización por oponente, sin admin UI.

**Solución:** Reutilizar el catálogo existente de `character_skill_nodes`, filtrar solo efectos de **combate** (los de economía no aplican a oponentes), y crear una tabla `opponent_skill_ranks` para asignar habilidades específicas por oponente.

**Resultado:** Cada oponente puede tener habilidades únicas (LP extra, energía turno 1, rebarajar, etc.) editables desde el admin panel.

---

## 1. Estado Actual del Sistema de Oponentes

### 1.1 Habilidades actuales (mínimas)

**Archivo:** `src/core/services/opponent/difficulty/types.ts`

```typescript
export interface IOpponentSkillSet {
  combos: boolean;        // HARD+ — reconoce sinergias
  baitReactiveTrap: boolean;  // MASTER+ — retarda invocación para trampas
}
```

Estas flags están hardcodeadas en `difficultyProfiles.ts` por tier de dificultad:
- `EASY`/`NORMAL`: `combos=false`, `baitReactiveTrap=false`
- `HARD`/`BOSS`: `combos=true`, `baitReactiveTrap=false`
- `MASTER`/`MYTHIC`: `combos=true`, `baitReactiveTrap=true`

### 1.2 Dónde se usan

- `HeuristicOpponentStrategy.ts` línea 65: `if (this.profile.skill.baitReactiveTrap && shouldHoldToBaitReactiveTrap(...))`
- `opponent-tactical-context.ts` líneas 55-66: `shouldHoldToBaitReactiveTrap()`

### 1.3 Tipos de oponentes

| Tipo | Entidad | Admin UI actual |
|------|---------|-----------------|
| **Arena** | `IArenaOpponent` | CRUD completo (oponentes + variantes + tiers) |
| **Story** | `IStoryDuelDefinition` | Solo lectura de perfil, edición de mazos y config de duelos |

---

## 2. Efectos Aplicables a Oponentes

Del catálogo de `skill-effect-types.ts`, solo los efectos de **COMBATE** son útiles:

| Efecto (`kind`) | Aplica | Descripción |
|-----------------|--------|-------------|
| `STARTING_LP_BONUS` | ✅ | Vida extra al oponente |
| `MAX_ENERGY_BONUS` | ✅ | Techo de energía sube |
| `TURN1_ENERGY_BONUS` | ✅ | Energía extra turno 1 |
| `OPENING_HAND_BONUS` | ✅ | Cartas extra en mano inicial |
| `OPENING_MULLIGAN` | ✅ | Permite rebarajar mano |
| `EDIT_OPENING_DECK` | ✅ | Elige cartas iniciales |
| `NEXUS_REWARD_MULT` | ❌ | Economía del jugador |
| `XP_REWARD_MULT` | ❌ | Economía del jugador |
| `LOSS_CONSOLATION_MULT` | ❌ | Economía del jugador |
| `PASSIVE_NEXUS_CAP_BONUS` | ❌ | Economía del jugador |
| `FIRST_WIN_DOUBLE_NEXUS` | ❌ | Economía del jugador |
| `UNLOCK_SECOND_DECK` | ❌ | Permisos del jugador |
| `GRANT_RESPEC_TOKEN` | ❌ | Permisos del jugador |

---

## 3. Schema de Base de Datos

### 3.1 Tabla nueva: `opponent_skill_ranks`

```sql
-- docs/supabase/sql/XXX_opponent_skill_ranks.sql
create table public.opponent_skill_ranks (
  opponent_id text not null,
  opponent_type text not null check (opponent_type in ('arena', 'story')),
  node_id text not null references public.character_skill_nodes(id),
  rank int2 not null check (rank >= 1),
  created_at timestamptz not null default now(),
  primary key (opponent_id, opponent_type, node_id)
);

comment on table public.opponent_skill_ranks is 'Habilidades de combate asignadas a oponentes (Arena y Story). Reutiliza el catálogo de character_skill_nodes.';

-- RLS: solo service-role escribe, lectura pública
alter table public.opponent_skill_ranks enable row level security;

create policy "Service role full access"
  on public.opponent_skill_ranks
  for all
  using (auth.role() = 'service_role');

create policy "Public read"
  on public.opponent_skill_ranks
  for select
  using (true);

-- Índices para búsquedas frecuentes
create index idx_opponent_skill_ranks_opponent
  on public.opponent_skill_ranks (opponent_id, opponent_type);

create index idx_opponent_skill_ranks_node
  on public.opponent_skill_ranks (node_id);
```

### 3.2 Datos de ejemplo (seed)

```sql
-- Ejemplo: oponente de Arena con habilidades
insert into public.opponent_skill_ranks (opponent_id, opponent_type, node_id, rank) values
  ('arena-opp-gennvim', 'arena', 'node-cbt-blindaje', 3),   -- +300 LP
  ('arena-opp-gennvim', 'arena', 'node-cbt-arranque', 1),   -- +1 energía turno 1
  ('arena-opp-helena', 'arena', 'node-cbt-blindaje', 5),    -- +500 LP
  ('arena-opp-helena', 'arena', 'node-cbt-nucleo', 2),      -- +2 techo energía
  ('arena-opp-jaku', 'arena', 'node-cbt-blindaje', 2),      -- +200 LP
  ('arena-opp-jaku', 'arena', 'node-cbt-rebarajar', 1);     -- puede rebarajar
```

---

## 4. Entidades y Repository

### 4.1 Entidad

```typescript
// src/core/entities/progression/IOpponentSkillRank.ts
export interface IOpponentSkillRank {
  /** ID del oponente ('arena-opp-xxx' o 'story-xxx') */
  opponentId: string;
  /** Tipo de oponente */
  opponentType: 'arena' | 'story';
  /** ID del nodo del catálogo (character_skill_nodes) */
  nodeId: string;
  /** Rango asignado (1 a maxRank del nodo) */
  rank: number;
}
```

### 4.2 Repository Interface

```typescript
// src/core/repositories/IOpponentSkillRepository.ts
import { IOpponentSkillRank } from "@/core/entities/progression/IOpponentSkillRank";

export interface IOpponentSkillRepository {
  /** Obtiene todas las habilidades de un oponente específico */
  getOpponentRanks(
    opponentId: string,
    opponentType: 'arena' | 'story',
  ): Promise<IOpponentSkillRank[]>;

  /** Asigna o actualiza el rango de un nodo para un oponente */
  setOpponentRank(
    opponentId: string,
    opponentType: 'arena' | 'story',
    nodeId: string,
    rank: number,
  ): Promise<void>;

  /** Elimina una habilidad asignada a un oponente */
  removeOpponentRank(
    opponentId: string,
    opponentType: 'arena' | 'story',
    nodeId: string,
  ): Promise<void>;

  /** Obtiene todas las habilidades agrupadas por oponente (para batch loading) */
  getOpponentsWithSkills(
    opponentType: 'arena' | 'story',
  ): Promise<Map<string, IOpponentSkillRank[]>>;
}
```

### 4.3 Implementación Supabase

```typescript
// src/infrastructure/persistence/supabase/SupabaseOpponentSkillRepository.ts
import { SupabaseClient } from "@supabase/supabase-js";
import { IOpponentSkillRank } from "@/core/entities/progression/IOpponentSkillRank";
import { IOpponentSkillRepository } from "@/core/repositories/IOpponentSkillRepository";
import { ValidationError } from "@/core/errors/ValidationError";

interface IOpponentSkillRow {
  opponent_id: string;
  opponent_type: string;
  node_id: string;
  rank: number;
}

function mapRow(row: IOpponentSkillRow): IOpponentSkillRank {
  return {
    opponentId: row.opponent_id,
    opponentType: row.opponent_type as 'arena' | 'story',
    nodeId: row.node_id,
    rank: row.rank,
  };
}

export class SupabaseOpponentSkillRepository implements IOpponentSkillRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getOpponentRanks(
    opponentId: string,
    opponentType: 'arena' | 'story',
  ): Promise<IOpponentSkillRank[]> {
    const { data, error } = await this.client
      .from('opponent_skill_ranks')
      .select('opponent_id, opponent_type, node_id, rank')
      .eq('opponent_id', opponentId)
      .eq('opponent_type', opponentType);

    if (error) throw new ValidationError('No se pudieron cargar las habilidades del oponente.');
    return (data as IOpponentSkillRow[]).map(mapRow);
  }

  async setOpponentRank(
    opponentId: string,
    opponentType: 'arena' | 'story',
    nodeId: string,
    rank: number,
  ): Promise<void> {
    const { error } = await this.client
      .from('opponent_skill_ranks')
      .upsert(
        { opponent_id: opponentId, opponent_type: opponentType, node_id: nodeId, rank },
        { onConflict: 'opponent_id,opponent_type,node_id' },
      );

    if (error) throw new ValidationError('No se pudo guardar la habilidad del oponente.');
  }

  async removeOpponentRank(
    opponentId: string,
    opponentType: 'arena' | 'story',
    nodeId: string,
  ): Promise<void> {
    const { error } = await this.client
      .from('opponent_skill_ranks')
      .delete()
      .eq('opponent_id', opponentId)
      .eq('opponent_type', opponentType)
      .eq('node_id', nodeId);

    if (error) throw new ValidationError('No se pudo eliminar la habilidad del oponente.');
  }

  async getOpponentsWithSkills(
    opponentType: 'arena' | 'story',
  ): Promise<Map<string, IOpponentSkillRank[]>> {
    const { data, error } = await this.client
      .from('opponent_skill_ranks')
      .select('opponent_id, opponent_type, node_id, rank')
      .eq('opponent_type', opponentType);

    if (error) throw new ValidationError('No se pudieron cargar las habilidades de los oponentes.');

    const map = new Map<string, IOpponentSkillRank[]>();
    for (const row of data as IOpponentSkillRow[]) {
      const existing = map.get(row.opponent_id) ?? [];
      existing.push(mapRow(row));
      map.set(row.opponent_id, existing);
    }
    return map;
  }
}
```

---

## 5. Resolver de Modificadores

### 5.1 Filtro de efectos de combate

```typescript
// src/core/services/progression/skill-tree/resolve-opponent-skill-modifiers.ts
import { ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";
import { IOpponentSkillRank } from "@/core/entities/progression/IOpponentSkillRank";
import { IPlayerSkillModifiers } from "@/core/services/progression/skill-tree/skill-effect-types";

/** Solo efectos de COMBATE aplicables a oponentes */
const COMBAT_EFFECT_KINDS = new Set([
  'STARTING_LP_BONUS',
  'MAX_ENERGY_BONUS',
  'TURN1_ENERGY_BONUS',
  'OPENING_HAND_BONUS',
  'OPENING_MULLIGAN',
  'EDIT_OPENING_DECK',
]);

/**
 * Resuelve los modificadores de combate de un oponente a partir del catálogo activo y sus rangos asignados.
 * Filtra efectos de economía/permisos (no aplican a oponentes).
 */
export function resolveOpponentSkillModifiers(
  catalog: readonly ISkillTreeNode[],
  ranks: readonly IOpponentSkillRank[],
): Pick<IPlayerSkillModifiers, 'combat'> {
  const rankMap = new Map(ranks.map((r) => [r.nodeId, r.rank]));

  const result: IPlayerSkillModifiers['combat'] = {
    startingLpBonus: 0,
    maxEnergyBonus: 0,
    turn1EnergyBonus: 0,
    openingHandBonus: 0,
    openingMulligan: false,
    editOpeningDeckCount: 0,
  };

  for (const node of catalog) {
    if (!COMBAT_EFFECT_KINDS.has(node.effect.kind)) continue;
    const rank = rankMap.get(node.id) ?? 0;
    if (rank < 1) continue;

    const effect = node.effect;
    switch (effect.kind) {
      case 'STARTING_LP_BONUS':
        result.startingLpBonus += effect.valuePerRank * rank;
        break;
      case 'MAX_ENERGY_BONUS':
        result.maxEnergyBonus += effect.valuePerRank * rank;
        break;
      case 'TURN1_ENERGY_BONUS':
        result.turn1EnergyBonus += effect.value;
        break;
      case 'OPENING_HAND_BONUS':
        result.openingHandBonus += effect.value;
        break;
      case 'OPENING_MULLIGAN':
        result.openingMulligan = true;
        break;
      case 'EDIT_OPENING_DECK':
        result.editOpeningDeckCount = Math.max(result.editOpeningDeckCount, effect.count);
        break;
    }
  }

  return { combat: result };
}
```

---

## 6. Integración con el Motor de Oponentes

### 6.1 Extender `IOpponentDifficultyProfile`

```typescript
// src/core/services/opponent/difficulty/types.ts
import { IPlayerSkillModifiers } from "@/core/services/progression/skill-tree/skill-effect-types";

export interface IOpponentDifficultyProfile {
  // ... campos existentes ...
  skill?: IOpponentSkillSet;           // flags actuales (mantener por backward compat)
  skillModifiers?: IPlayerSkillModifiers['combat'];  // NUEVO: modifiers del árbol
}
```

### 6.2 Modificar `resolveOpponentDifficultyProfile`

```typescript
// src/core/services/opponent/difficulty/resolve-opponent-difficulty-profile.ts
export function resolveOpponentDifficultyProfile(
  difficulty: OpponentDifficulty,
  aiProfile?: IStoryAiProfile,
  skillModifiers?: IPlayerSkillModifiers['combat'],  // NUEVO parámetro
): IOpponentDifficultyProfile {
  const base = DIFFICULTY_PROFILES[difficulty];
  // ... lógica existente de style tuning ...

  return {
    ...base,
    skillModifiers,  // NUEVO: se pasa al strategy
  };
}
```

### 6.3 Modificar `HeuristicOpponentStrategy`

```typescript
// src/core/services/opponent/HeuristicOpponentStrategy.ts
export class HeuristicOpponentStrategy implements IOpponentStrategy {
  private readonly profile: IOpponentDifficultyProfile;
  private readonly skillModifiers?: IPlayerSkillModifiers['combat'];

  constructor(options: {
    difficulty?: OpponentDifficulty;
    aiProfile?: unknown;
    skillModifiers?: IPlayerSkillModifiers['combat'];  // NUEVO
  }) {
    this.skillModifiers = options.skillModifiers;
    this.profile = resolveOpponentDifficultyProfile(
      options.difficulty ?? 'NORMAL',
      options.aiProfile as IStoryAiProfile | undefined,
      options.skillModifiers,  // NUEVO
    );
    // ... resto del constructor
  }

  // Usar this.skillModifiers en choosePlay() para:
  // - deciding opening hand size
  // - energy calculations
  // - mulligan decisions
}
```

### 6.4 Aplicar en preparación de combate

```typescript
// src/services/match/prepare-match.ts
export function applyOpponentSkills(
  initialState: IGameState,
  opponentSkills: IPlayerSkillModifiers['combat'],
): IGameState {
  const opponentIndex = 1; // oponente siempre es índice 1

  return {
    ...initialState,
    healthPoints: [
      initialState.healthPoints[0],
      initialState.healthPoints[opponentIndex] + (opponentSkills.startingLpBonus ?? 0),
    ],
    maxEnergy: [
      initialState.maxEnergy[0],
      initialState.maxEnergy[opponentIndex] + (opponentSkills.maxEnergyBonus ?? 0),
    ],
    // openingHandBonus, openingMulligan, editOpeningDeckCount
    // se manejan en el flujo de creación de mano inicial
  };
}
```

---

## 7. API Routes

### 7.1 Arena Opponent Skills

```typescript
// src/app/api/admin/arena/opponent-skills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createAdminRouteContext } from "@/app/api/admin/_lib/create-admin-route-context";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";
import { SupabaseOpponentSkillRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentSkillRepository";

export async function GET(request: NextRequest) {
  const { session } = await createAdminRouteContext(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const opponentId = request.nextUrl.searchParams.get("opponentId");
  if (!opponentId) return NextResponse.json({ error: "Missing opponentId" }, { status: 400 });

  const client = createSupabaseServiceRoleClient();
  const repo = new SupabaseOpponentSkillRepository(client);
  const skills = await repo.getOpponentRanks(opponentId, "arena");

  return NextResponse.json({ skills });
}

export async function POST(request: NextRequest) {
  const { session } = await createAdminRouteContext(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { opponentId, nodeId, rank } = body;

  if (!opponentId || !nodeId || typeof rank !== "number") {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const client = createSupabaseServiceRoleClient();
  const repo = new SupabaseOpponentSkillRepository(client);
  await repo.setOpponentRank(opponentId, "arena", nodeId, rank);

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const { session } = await createAdminRouteContext(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { opponentId, nodeId } = body;

  if (!opponentId || !nodeId) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const client = createSupabaseServiceRoleClient();
  const repo = new SupabaseOpponentSkillRepository(client);
  await repo.removeOpponentRank(opponentId, "arena", nodeId);

  return NextResponse.json({ ok: true });
}
```

### 7.2 Story Opponent Skills

```typescript
// src/app/api/admin/story-decks/opponent-skills/route.ts
// MISMO patrón que Arena, pero usando opponentType = 'story'
```

---

## 8. Admin UI

### 8.1 Componente compartido: `CombatSkillEditor`

```typescript
// src/components/admin/internal/shared/CombatSkillEditor.tsx
"use client";

import { useState } from "react";
import { ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";

interface CombatSkillEditorProps {
  opponentId: string;
  opponentType: 'arena' | 'story';
  availableNodes: ISkillTreeNode[];
  currentSkills: Map<string, number>;  // nodeId -> rank
  onSave: (nodeId: string, rank: number) => Promise<void>;
  onRemove: (nodeId: string) => Promise<void>;
}

export function CombatSkillEditor({
  opponentId,
  opponentType,
  availableNodes,
  currentSkills,
  onSave,
  onRemove,
}: CombatSkillEditorProps) {
  const [editingNode, setEditingNode] = useState<string | null>(null);

  return (
    <div className="combat-skill-editor">
      <h3 className="text-lg font-semibold mb-4">Habilidades de Combate</h3>
      <p className="text-sm text-zinc-400 mb-6">
        Asigna habilidades del árbol de operador al oponente.
        Solo los efectos de combate están disponibles.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {availableNodes.map((node) => {
          const currentRank = currentSkills.get(node.id) ?? 0;
          const isEditing = editingNode === node.id;

          return (
            <div
              key={node.id}
              className={`skill-card p-4 rounded-lg border ${
                currentRank > 0
                  ? 'border-emerald-500/50 bg-emerald-500/10'
                  : 'border-zinc-700 bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{node.display.name}</span>
                <span className="text-sm text-zinc-400">
                  {currentRank > 0 ? `R${currentRank}/${node.maxRank}` : 'Sin asignar'}
                </span>
              </div>

              <p className="text-sm text-zinc-400 mb-3">{node.display.blurb}</p>

              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={node.maxRank}
                    value={currentRank}
                    onChange={(e) => {
                      const rank = Number(e.target.value);
                      if (rank === 0) {
                        onRemove(node.id);
                      } else {
                        onSave(node.id, rank);
                      }
                    }}
                    className="flex-1"
                  />
                  <button
                    onClick={() => setEditingNode(null)}
                    className="text-sm text-zinc-400 hover:text-white"
                  >
                    Cerrar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingNode(node.id)}
                  className="text-sm text-emerald-400 hover:text-emerald-300"
                >
                  {currentRank > 0 ? 'Editar' : 'Asignar'}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

### 8.2 Hook compartido: `useOpponentSkills`

```typescript
// src/components/admin/internal/shared/use-opponent-skills.ts
"use client";

import { useState, useEffect, useCallback } from "react";

export function useOpponentSkills(opponentId: string, opponentType: 'arena' | 'story') {
  const [skills, setSkills] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);

  const loadSkills = useCallback(async () => {
    const res = await fetch(
      `/api/admin/${opponentType === 'arena' ? 'arena' : 'story-decks'}/opponent-skills?opponentId=${opponentId}`
    );
    if (res.ok) {
      const data = await res.json();
      const map = new Map<string, number>();
      for (const skill of data.skills) {
        map.set(skill.nodeId, skill.rank);
      }
      setSkills(map);
    }
    setLoading(false);
  }, [opponentId, opponentType]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  const saveSkill = useCallback(async (nodeId: string, rank: number) => {
    await fetch(
      `/api/admin/${opponentType === 'arena' ? 'arena' : 'story-decks'}/opponent-skills`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponentId, nodeId, rank }),
      }
    );
    setSkills((prev) => new Map(prev).set(nodeId, rank));
  }, [opponentId, opponentType]);

  const removeSkill = useCallback(async (nodeId: string) => {
    await fetch(
      `/api/admin/${opponentType === 'arena' ? 'arena' : 'story-decks'}/opponent-skills`,
      {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponentId, nodeId }),
      }
    );
    setSkills((prev) => {
      const next = new Map(prev);
      next.delete(nodeId);
      return next;
    });
  }, [opponentId, opponentType]);

  return { skills, loading, saveSkill, removeSkill };
}
```

### 8.3 Integración en Arena Editor

```typescript
// src/components/admin/internal/arena/AdminArenaOpponentEditor.tsx
// AGREGAR después del editor de variantes

import { CombatSkillEditor } from "@/components/admin/internal/shared/CombatSkillEditor";
import { useOpponentSkills } from "@/components/admin/internal/shared/use-opponent-skills";

// En el componente:
const { skills, saveSkill, removeSkill } = useOpponentSkills(opponent.id, 'arena');

// En el JSX:
<section className="mt-6 border-t border-zinc-700 pt-6">
  <CombatSkillEditor
    opponentId={opponent.id}
    opponentType="arena"
    availableNodes={combatNodes}  // filtrado de catálogo
    currentSkills={skills}
    onSave={saveSkill}
    onRemove={removeSkill}
  />
</section>
```

### 8.4 Integración en Story Catalog

```typescript
// src/components/admin/internal/AdminStoryOpponentCatalog.tsx
// AGREGAR en el panel de detalle del oponente seleccionado

import { CombatSkillEditor } from "@/components/admin/internal/shared/CombatSkillEditor";
import { useOpponentSkills } from "@/components/admin/internal/shared/use-opponent-skills";

// Cuando se selecciona un oponente:
const { skills, saveSkill, removeSkill } = useOpponentSkills(
  selectedOpponent.opponentId,
  'story',
);

// En el JSX del panel de detalle:
<div className="opponent-detail-panel">
  {/* ... info del oponente ... */}

  <CombatSkillEditor
    opponentId={selectedOpponent.opponentId}
    opponentType="story"
    availableNodes={combatNodes}
    currentSkills={skills}
    onSave={saveSkill}
    onRemove={removeSkill}
  />
</div>
```

---

## 9. Flujo de Datos Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN PANEL                                │
│  ┌─────────────────────┐    ┌─────────────────────┐            │
│  │ Arena Opponent      │    │ Story Opponent      │            │
│  │ Editor              │    │ Catalog             │            │
│  └──────────┬──────────┘    └──────────┬──────────┘            │
│             │                          │                        │
│             ▼                          ▼                        │
│  ┌─────────────────────────────────────────────────────┐       │
│  │           CombatSkillEditor (compartido)             │       │
│  │  - Grid de nodos de combate                          │       │
│  │  - Selectores de rango por nodo                      │       │
│  │  - Guardar/eliminar por nodo individual              │       │
│  └──────────────────────┬──────────────────────────────┘       │
└─────────────────────────┼───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API ROUTES                                  │
│  GET/POST/DELETE /api/admin/arena/opponent-skills               │
│  GET/POST/DELETE /api/admin/story-decks/opponent-skills         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 SUPABASE (opponent_skill_ranks)                  │
│  opponent_id │ opponent_type │ node_id │ rank                   │
│  arena-opp-1 │ arena         │ node-cbt-blindaje │ 3           │
│  arena-opp-1 │ arena         │ node-cbt-arranque │ 1           │
│  story-opp-2 │ story         │ node-cbt-nucleo   │ 2           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                 RESOLUCIÓN DE COMBATE                            │
│                                                                 │
│  SupabaseOpponentSkillRepository.getOpponentRanks()             │
│    → resolveOpponentSkillModifiers(catalog, ranks)              │
│      → IPlayerSkillModifiers.combat                             │
│        → resolveOpponentDifficultyProfile(difficulty, profile, mods) │
│          → IOpponentDifficultyProfile { skillModifiers }        │
│            → HeuristicOpponentStrategy({ skillModifiers })      │
│              → applyOpponentSkills(initialState, skillModifiers)│
└─────────────────────────────────────────────────────────────────┘
```

---

## 10. Archivos a Crear/Modificar

| # | Archivo | Tipo | Descripción |
|---|---------|------|-------------|
| 1 | `docs/supabase/sql/XXX_opponent_skill_ranks.sql` | NUEVO | Tabla + RLS + seed |
| 2 | `src/core/entities/progression/IOpponentSkillRank.ts` | NUEVO | Entidad |
| 3 | `src/core/repositories/IOpponentSkillRepository.ts` | NUEVO | Interface |
| 4 | `src/infrastructure/persistence/supabase/SupabaseOpponentSkillRepository.ts` | NUEVO | Implementación |
| 5 | `src/core/services/progression/skill-tree/resolve-opponent-skill-modifiers.ts` | NUEVO | Filtro + resolver |
| 6 | `src/core/services/opponent/difficulty/types.ts` | MODIFICAR | Agregar `skillModifiers` |
| 7 | `src/core/services/opponent/difficulty/resolve-opponent-difficulty-profile.ts` | MODIFICAR | Merge modifiers |
| 8 | `src/core/services/opponent/HeuristicOpponentStrategy.ts` | MODIFICAR | Usar modifiers |
| 9 | `src/services/match/prepare-match.ts` | MODIFICAR | Aplicar a oponente |
| 10 | `src/components/admin/internal/shared/CombatSkillEditor.tsx` | NUEVO | Componente compartido |
| 11 | `src/components/admin/internal/shared/use-opponent-skills.ts` | NUEVO | Hook de datos |
| 12 | `src/components/admin/internal/arena/AdminArenaOpponentEditor.tsx` | MODIFICAR | Agregar sección skills |
| 13 | `src/components/admin/internal/AdminStoryOpponentCatalog.tsx` | MODIFICAR | Agregar sección skills |
| 14 | `src/app/api/admin/arena/opponent-skills/route.ts` | NUEVO | API Arena |
| 15 | `src/app/api/admin/story-decks/opponent-skills/route.ts` | NUEVO | API Story |
| 16 | `src/core/services/progression/skill-tree/resolve-opponent-skill-modifiers.test.ts` | NUEVO | Tests unitarios |

---

## 11. Orden de Implementación

| Fase | Contenido | Dependencias | Archivos |
|------|-----------|--------------|----------|
| **F1** | Tabla DB + entity + repository interface | Ninguna | #1, #2, #3 |
| **F2** | Repository Supabase + resolver de modificadores | F1 | #4, #5 |
| **F3** | Integración con difficulty profile + strategy | F2 | #6, #7, #8 |
| **F4** | Aplicación en prepare-match | F3 | #9 |
| **F5** | API routes (Arena + Story) | F2 | #14, #15 |
| **F6** | Admin UI: CombatSkillEditor + useOpponentSkills | F5 | #10, #11 |
| **F7** | Integrar en Arena/Story editors | F6 | #12, #13 |
| **F8** | Tests unitarios + integración | F2, F3, F4 | #16 |

---

## 12. Decisiones de Diseño

1. **Reusar catálogo existente:** No duplicamos nodos. Los mismos `character_skill_nodes` sirven para jugador y oponentes, filtrados por tipo de efecto.

2. **Solo efectos de combate:** Economía y permisos no aplican a oponentes. El filtro es explícito en `resolveOpponentSkillModifiers`.

3. **Granularidad por nodo:** Cada oponente puede tener rangos diferentes por nodo. No es "todas las habilidades de nivel X", sino asignación manual.

4. **Backward compatible:** Los flags actuales (`combos`, `baitReactiveTrap`) se mantienen. Los nuevos `skillModifiers` son aditivos.

5. **Admin-first:** La UI está diseñada para ser rápida de usar: grid visual, sliders por nodo, guardado inmediato.

---

## 13. Testing

### Tests unitarios para `resolveOpponentSkillModifiers`

```typescript
// src/core/services/progression/skill-tree/resolve-opponent-skill-modifiers.test.ts
import { describe, expect, it } from "vitest";
import { resolveOpponentSkillModifiers } from "./resolve-opponent-skill-modifiers";
import { ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";

function combatNode(id: string, kind: string, valuePerRank: number): ISkillTreeNode {
  return {
    id,
    branch: "COMBAT",
    tier: 1,
    maxRank: 5,
    costPerRank: 1,
    effect: { kind: kind as any, valuePerRank },
    prerequisites: [],
    display: { name: id, blurb: "" },
  };
}

describe("resolveOpponentSkillModifiers", () => {
  it("filtra efectos de economía y solo aplica combate", () => {
    const catalog = [
      combatNode("cbt-lp", "STARTING_LP_BONUS", 100),
      { id: "econ-nexus", branch: "ECONOMY", tier: 1, maxRank: 5, costPerRank: 1,
        effect: { kind: "NEXUS_REWARD_MULT", valuePerRank: 0.02 }, prerequisites: [],
        display: { name: "econ", blurb: "" } } as ISkillTreeNode,
    ];
    const ranks = [
      { opponentId: "opp-1", opponentType: "arena" as const, nodeId: "cbt-lp", rank: 3 },
      { opponentId: "opp-1", opponentType: "arena" as const, nodeId: "econ-nexus", rank: 5 },
    ];

    const result = resolveOpponentSkillModifiers(catalog, ranks);
    expect(result.combat.startingLpBonus).toBe(300);
    // NEXUS_REWARD_MULT no se aplica a oponentes
  });

  it("acumula múltiples efectos de combate", () => {
    const catalog = [
      combatNode("cbt-lp", "STARTING_LP_BONUS", 100),
      combatNode("cbt-energy", "MAX_ENERGY_BONUS", 1),
    ];
    const ranks = [
      { opponentId: "opp-1", opponentType: "arena" as const, nodeId: "cbt-lp", rank: 2 },
      { opponentId: "opp-1", opponentType: "arena" as const, nodeId: "cbt-energy", rank: 1 },
    ];

    const result = resolveOpponentSkillModifiers(catalog, ranks);
    expect(result.combat.startingLpBonus).toBe(200);
    expect(result.combat.maxEnergyBonus).toBe(1);
  });

  it("retorna ceros cuando no hay rangos", () => {
    const catalog = [combatNode("cbt-lp", "STARTING_LP_BONUS", 100)];
    const result = resolveOpponentSkillModifiers(catalog, []);
    expect(result.combat.startingLpBonus).toBe(0);
  });
});
```

---

## 14. Notas para Otros Agentes

- **No duplicar lógica de resolver:** Usar `resolveOpponentSkillModifiers` (no implementar inline en el strategy).
- **Filtrar por `COMBAT_EFFECT_KINDS`:** Si se agrega un nuevo efecto de combate al catálogo, agregarlo al Set.
- **Admin UI es compartida:** `CombatSkillEditor` y `useOpponentSkills` sirven para Arena y Story.
- **Los oponentes NO ganan Nexus/XP:** Solo efectos de combate. Nunca agregar efectos de economía.
- **Backward compatible:** Mantener `IOpponentSkillSet` existente. Los nuevos `skillModifiers` son aditivos.
