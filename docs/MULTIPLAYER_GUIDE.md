# Guía de Implementación de Multijugador

**Versión del documento:** 1.0  
**Branch de referencia:** `features/multiplayer-guide`  
**Estado actual del modo:** `MULTIPLAYER` bloqueado en `HubAccessPolicy` — placeholder en `/hub/multiplayer`

---

## Índice

1. [Visión General y Filosofía de Diseño](#1-visión-general-y-filosofía-de-diseño)
2. [Estado Actual del Proyecto](#2-estado-actual-del-proyecto)
3. [Tecnología Elegida: Supabase Realtime](#3-tecnología-elegida-supabase-realtime)
4. [Arquitectura del Sistema](#4-arquitectura-del-sistema)
5. [Fase 1 — Infraestructura de Base de Datos](#5-fase-1--infraestructura-de-base-de-datos)
6. [Fase 2 — Presencia y Jugadores Conectados](#6-fase-2--presencia-y-jugadores-conectados)
7. [Fase 3 — Lobby e Invitaciones](#7-fase-3--lobby-e-invitaciones)
8. [Fase 4 — Motor de Sincronización en Tiempo Real](#8-fase-4--motor-de-sincronización-en-tiempo-real)
9. [Fase 5 — Validación Server-Side y Anti-Cheat](#9-fase-5--validación-server-side-y-anti-cheat)
10. [Fase 6 — Reconexión y Resiliencia](#10-fase-6--reconexión-y-resiliencia)
11. [Recompensas y Clasificación](#11-recompensas-y-clasificación)
12. [Plan de Implementación por Sprints](#12-plan-de-implementación-por-sprints)
13. [Consideraciones de Seguridad](#13-consideraciones-de-seguridad)
14. [Referencia de Archivos Clave](#14-referencia-de-archivos-clave)

---

## 1. Visión General y Filosofía de Diseño

### El insight fundamental

El motor de juego ya está preparado para multijugador. La arquitectura existente define `IOpponentStrategy` como una interfaz que el oponente CPU implementa. Un jugador real simplemente es otra implementación de esa misma interfaz — en lugar de calcular una jugada localmente, escucha un canal de Supabase Realtime.

```
CPU actual:                 Jugador remoto (nuevo):
┌─────────────────────┐    ┌──────────────────────────────┐
│ HeuristicStrategy   │    │ RemotePlayerStrategy         │
│ .choosePlay()       │    │ .choosePlay()                │
│   → score cards     │    │   → await channel.receive()  │
│   → return decision │    │   → return decision          │
└─────────────────────┘    └──────────────────────────────┘
         ↓                             ↓
    useBoard(mode="TRAINING",     useBoard(mode="MULTIPLAYER",
     opponentStrategyOverride?)    opponentStrategyOverride=RemotePlayerStrategy)
```

Esto significa que el 90% de la lógica de juego no cambia. El multijugador solo añade capas de red y coordinación alrededor de un core inmutable.

### Principios de diseño

| Principio | Razón |
|-----------|-------|
| **Game engine permanece en cliente** | No se necesita un game server; el estado se calcula localmente y se sincroniza |
| **Acciones, no estados** | Solo se transmiten las acciones del jugador (no el `GameState` completo) para minimizar ancho de banda y simplificar validación |
| **Server como árbitro** | Una Edge Function valida cada acción antes de retransmitirla al rival |
| **Supabase Realtime como bus** | Evita infraestructura WebSocket propia; usa la misma plataforma ya integrada |
| **Graceful degradation** | Desconexiones temporales no destruyen la partida; se recupera al reconectar |

---

## 2. Estado Actual del Proyecto

### Qué ya existe (listo para multijugador)

```
✅ src/core/entities/match/IMatchMode.ts
   → "MULTIPLAYER" ya es un valor válido del tipo

✅ src/components/game/board/hooks/useBoard.ts
   → acepta opponentStrategyOverride?: IOpponentStrategy
   → mode: IMatchMode ya soporta "MULTIPLAYER"

✅ src/core/services/opponent/types.ts
   → IOpponentStrategy: choosePlay / chooseAttack / chooseModeChange
   → Es el contrato exacto que necesita implementar un jugador remoto

✅ src/core/use-cases/GameEngine.ts
   → Pure functions: playCard, executeAttack, fuseCards, nextPhase, etc.
   → Idempotentes y testables — base perfecta para validación server-side

✅ src/core/services/match/rewards/match-reward-policy.ts
   → rewardForMultiplayer() ya implementado: WIN=90 Nexus, LOSE=18, DRAW=45

✅ src/core/services/hub/HubAccessPolicy.ts
   → La sección MULTIPLAYER existe y tiene lock con mensaje de "próximamente"
   → Desbloquear = cambiar isLocked a false

✅ @supabase/supabase-js@2.98.0 + @supabase/ssr@0.9.0
   → Cliente Supabase instalado; Realtime está incluido en supabase-js v2
   → NO necesita instalar @supabase/realtime-js por separado
```

### Qué falta construir

```
❌ Tablas DB: match_sessions, match_actions, player_invitations, player_presence
❌ Supabase Realtime: REPLICA IDENTITY FULL en las tablas de partida
❌ RemotePlayerStrategy: implementación de IOpponentStrategy que escucha Realtime
❌ Edge Function: validador de acciones server-side
❌ Lobby UI: /hub/multiplayer → ver jugadores, enviar invitación, aceptar
❌ Matchmaking UI: sala de espera, estado de la conexión
❌ Reconexión: manejo de desconexiones y recuperación de estado
```

---

## 3. Tecnología Elegida: Supabase Realtime

### ¿Por qué Supabase Realtime y no Socket.io / WebSockets propios?

| Criterio | Supabase Realtime | Socket.io / WS propio |
|----------|-------------------|-----------------------|
| Infraestructura | Ya instalada, zero config | Requiere servidor dedicado (Fly.io, Railway, etc.) |
| Auth | Integrada con Supabase Auth (JWT automático) | Manual |
| Persistencia | Opcional via DB Broadcast | Requiere implementación |
| Presencia | `channel.track()` nativo | Implementar desde cero |
| Coste | Incluido en plan Supabase | +$5-20/mes infraestructura |
| Latencia típica | 50-150ms (suficiente para turn-based) | 10-50ms (mejor para real-time continuo) |

**Conclusión:** Para un juego por turnos (no requiere reacciones en milisegundos), Supabase Realtime es la elección correcta. La latencia de 50-150ms es imperceptible cuando los turnos duran varios segundos.

### Modos de Supabase Realtime que usaremos

```
Presence    → ¿Quién está online? (canal "hub:presence")
Broadcast   → Transmitir acciones de juego (canal "match:{matchId}")
Postgres    → Escuchar cambios en tablas (invitaciones, inicio de partida)
```

---

## 4. Arquitectura del Sistema

### Diagrama de flujo completo

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTE JUGADOR A                        │
│                                                                  │
│  HubMultiplayerPage                                              │
│    → useOnlinePlayers (Presence channel)                         │
│    → usePendingInvitations (Postgres changes)                    │
│                    │                                             │
│  MatchLobby        │ invita a B                                  │
│    → INSERT invitation → DB                                      │
│                    │                                             │
│  MatchRoom         │ B acepta                                    │
│    → JOIN channel "match:{matchId}"                              │
│    → useBoard(mode="MULTIPLAYER",                                │
│               opponentStrategyOverride=RemotePlayerStrategy)     │
│                    │                                             │
│  RemotePlayerStrategy                                            │
│    → channel.subscribe() → recibe acción de B                   │
│    → retorna IOpponentPlayDecision a useBoard                    │
│                    │                                             │
│  Al jugar:         │                                             │
│    → POST /api/match/action (Edge Function)                      │
│      → valida acción en servidor                                 │
│      → BROADCAST al canal → B la recibe                         │
└──────────────────────────────┬──────────────────────────────────┘
                               │ Supabase Realtime
┌──────────────────────────────▼──────────────────────────────────┐
│                         CLIENTE JUGADOR B                        │
│  (arquitectura simétrica — B es "A" en su propio cliente)       │
└─────────────────────────────────────────────────────────────────┘
```

### Invariante clave: la partida es simétrica

Ambos clientes ejecutan el mismo `GameEngine` con el mismo estado. El `playerA` de A es el local; el `playerA` de B es el remoto. Ambos calculan el mismo resultado determinista dado las mismas acciones.

---

## 5. Fase 1 — Infraestructura de Base de Datos

### 5.1 Nuevas tablas requeridas

Crear migración `supabase/migrations/043_multiplayer_infrastructure.sql`:

```sql
-- ─────────────────────────────────────────────
-- MATCH SESSIONS
-- ─────────────────────────────────────────────
CREATE TABLE public.match_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_a_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_b_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'WAITING'
                CHECK (status IN ('WAITING', 'ACTIVE', 'FINISHED', 'ABANDONED')),
  winner_id     UUID REFERENCES auth.users(id),
  outcome       TEXT CHECK (outcome IN ('WIN', 'LOSE', 'DRAW', 'ABANDONED')),
  deck_a_ids    TEXT[] NOT NULL,   -- IDs de cartas del mazo de A
  deck_b_ids    TEXT[] NOT NULL,   -- IDs de cartas del mazo de B
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- MATCH ACTIONS (log inmutable de acciones)
-- ─────────────────────────────────────────────
CREATE TABLE public.match_actions (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id      UUID NOT NULL REFERENCES public.match_sessions(id) ON DELETE CASCADE,
  player_id     UUID NOT NULL REFERENCES auth.users(id),
  sequence      INT NOT NULL,       -- orden garantizado de la acción
  action_type   TEXT NOT NULL,      -- "PLAY_CARD" | "ATTACK" | "NEXT_PHASE" | etc.
  payload       JSONB NOT NULL,     -- datos de la acción (cardId, targetId, etc.)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, sequence)
);

-- ─────────────────────────────────────────────
-- INVITACIONES
-- ─────────────────────────────────────────────
CREATE TABLE public.player_invitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'CANCELLED')),
  match_id      UUID REFERENCES public.match_sessions(id),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '2 minutes'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- CLASIFICACIÓN (rankings)
-- ─────────────────────────────────────────────
CREATE TABLE public.player_pvp_stats (
  player_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  wins          INT NOT NULL DEFAULT 0,
  losses        INT NOT NULL DEFAULT 0,
  draws         INT NOT NULL DEFAULT 0,
  elo           INT NOT NULL DEFAULT 1000,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 5.2 Row Level Security

```sql
-- match_sessions: solo participantes pueden ver/modificar su partida
ALTER TABLE public.match_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_see_own_matches" ON public.match_sessions
  FOR SELECT USING (auth.uid() = player_a_id OR auth.uid() = player_b_id);

-- match_actions: solo participantes pueden insertar/ver acciones
ALTER TABLE public.match_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants_insert_actions" ON public.match_actions
  FOR INSERT WITH CHECK (
    auth.uid() = player_id AND
    EXISTS (
      SELECT 1 FROM public.match_sessions
      WHERE id = match_id
      AND (player_a_id = auth.uid() OR player_b_id = auth.uid())
    )
  );
CREATE POLICY "participants_select_actions" ON public.match_actions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.match_sessions
      WHERE id = match_id
      AND (player_a_id = auth.uid() OR player_b_id = auth.uid())
    )
  );

-- invitaciones: el destinatario puede ver y actualizar las suyas
ALTER TABLE public.player_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "see_own_invitations" ON public.player_invitations
  FOR SELECT USING (auth.uid() = from_id OR auth.uid() = to_id);
CREATE POLICY "accept_or_decline" ON public.player_invitations
  FOR UPDATE USING (auth.uid() = to_id);
CREATE POLICY "send_invitation" ON public.player_invitations
  FOR INSERT WITH CHECK (auth.uid() = from_id);
```

### 5.3 Habilitar Realtime en tablas

```sql
-- Necesario para que Supabase Realtime retransmita cambios
ALTER TABLE public.match_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.player_invitations REPLICA IDENTITY FULL;
ALTER TABLE public.match_actions REPLICA IDENTITY FULL;

-- Añadir tablas al publication de Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_actions;
```

---

## 6. Fase 2 — Presencia y Jugadores Conectados

### 6.1 Cómo funciona la Presencia en Supabase

Supabase Presence usa un canal compartido donde cada cliente "track" su estado. Cuando un cliente desconecta, su presencia desaparece automáticamente (sin timeouts manuales).

### 6.2 Hook `useOnlinePlayers`

```typescript
// src/core/hooks/multiplayer/useOnlinePlayers.ts
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

export interface IOnlinePlayer {
  playerId: string;
  nickname: string;
  avatarUrl?: string;
  status: "IDLE" | "IN_LOBBY" | "IN_MATCH";
}

export function useOnlinePlayers(currentPlayer: IOnlinePlayer) {
  const [onlinePlayers, setOnlinePlayers] = useState<IOnlinePlayer[]>([]);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const channel = supabase.channel("hub:presence", {
      config: { presence: { key: currentPlayer.playerId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<IOnlinePlayer>();
        const players = Object.values(state)
          .flat()
          .filter((p) => p.playerId !== currentPlayer.playerId);
        setOnlinePlayers(players);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track(currentPlayer);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentPlayer.playerId]);

  return { onlinePlayers };
}
```

### 6.3 UI: Vista de jugadores conectados

```
┌─────────────────────────────────────┐
│  JUGADORES EN LÍNEA (3)             │
├─────────────────────────────────────┤
│  ● DuelMaster_99      [IDLE]    [+] │
│  ● NexusKnight        [LOBBY]   [-] │
│  ● ShadowFusion       [DUELO]   [-] │
└─────────────────────────────────────┘
```

- `●` verde = IDLE (disponible para invitación)
- `●` amarillo = IN_LOBBY (en sala de espera)
- `●` rojo = IN_MATCH (en partida, no disponible)
- `[+]` = botón para invitar (solo para IDLE)

**Archivo a crear:** `src/components/hub/multiplayer/OnlinePlayersList.tsx`

---

## 7. Fase 3 — Lobby e Invitaciones

### 7.1 Flujo de invitación

```
A pulsa [Invitar] sobre B
        │
        ▼
INSERT player_invitations { from: A, to: B, status: 'PENDING' }
        │
        ▼ (Supabase Realtime: Postgres changes)
B recibe notificación en tiempo real
        │
   B acepta / rechaza
        │
   ┌────┴────┐
   │ ACEPTA  │ RECHAZA
   │         │
   ▼         ▼
UPDATE       UPDATE status='DECLINED'
status=      → A recibe notificación
'ACCEPTED'
   │
   ▼
INSERT match_sessions {
  player_a_id: A.id,
  player_b_id: B.id,
  deck_a_ids: A.selectedDeck,
  deck_b_ids: B.selectedDeck,
  status: 'WAITING'
}
   │
   ▼
UPDATE invitation { match_id: newMatch.id }
   │
   ▼
Ambos → redirect /hub/multiplayer/match/{matchId}
```

### 7.2 Hook `usePendingInvitations`

```typescript
// src/core/hooks/multiplayer/usePendingInvitations.ts
"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";

export function usePendingInvitations(playerId: string) {
  const [pendingInvitations, setPendingInvitations] = useState<IInvitation[]>([]);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    // Carga inicial
    supabase
      .from("player_invitations")
      .select("*, from:player_profiles!from_id(nickname, avatar_url)")
      .eq("to_id", playerId)
      .eq("status", "PENDING")
      .gt("expires_at", new Date().toISOString())
      .then(({ data }) => setPendingInvitations(data ?? []));

    // Escucha cambios en tiempo real
    const channel = supabase
      .channel(`invitations:${playerId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "player_invitations",
          filter: `to_id=eq.${playerId}`,
        },
        (payload) => {
          setPendingInvitations((prev) => [...prev, payload.new as IInvitation]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "player_invitations",
          filter: `to_id=eq.${playerId}`,
        },
        (payload) => {
          setPendingInvitations((prev) =>
            prev.filter((inv) => inv.id !== payload.new.id)
          );
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [playerId]);

  return { pendingInvitations };
}
```

### 7.3 Server Action: aceptar invitación

```typescript
// src/app/hub/multiplayer/actions/accept-invitation.ts
"use server";

import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export async function acceptInvitation(invitationId: string, selectedDeckIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Obtener la invitación
  const { data: invitation } = await supabase
    .from("player_invitations")
    .select("*")
    .eq("id", invitationId)
    .eq("to_id", user.id)
    .eq("status", "PENDING")
    .single();

  if (!invitation) throw new Error("Invitation not found or already handled");

  // Crear la sesión de partida
  const { data: match } = await supabase
    .from("match_sessions")
    .insert({
      player_a_id: invitation.from_id,
      player_b_id: user.id,
      deck_a_ids: [], // el invitador ya habrá enviado su deck en la invitación
      deck_b_ids: selectedDeckIds,
      status: "WAITING",
    })
    .select()
    .single();

  // Actualizar la invitación
  await supabase
    .from("player_invitations")
    .update({ status: "ACCEPTED", match_id: match.id })
    .eq("id", invitationId);

  return { matchId: match.id };
}
```

---

## 8. Fase 4 — Motor de Sincronización en Tiempo Real

### 8.1 El adaptador `RemotePlayerStrategy`

Este es el corazón del multijugador. Implementa `IOpponentStrategy` pero en lugar de calcular la jugada, espera recibirla del canal.

```typescript
// src/core/services/multiplayer/RemotePlayerStrategy.ts
import type { RealtimeChannel } from "@supabase/supabase-js";
import type {
  IOpponentStrategy,
  IOpponentPlayDecision,
  IOpponentAttackDecision,
  IOpponentModeChangeDecision,
} from "@/core/services/opponent/types";
import type { GameState } from "@/core/use-cases/game-engine/state/types";

type IncomingAction =
  | { type: "PLAY_CARD"; payload: IOpponentPlayDecision }
  | { type: "ATTACK"; payload: IOpponentAttackDecision }
  | { type: "CHANGE_MODE"; payload: IOpponentModeChangeDecision }
  | { type: "NEXT_PHASE" };

export class RemotePlayerStrategy implements IOpponentStrategy {
  private pendingResolvers: Map<string, (action: IncomingAction) => void> = new Map();
  private channel: RealtimeChannel;

  constructor(channel: RealtimeChannel) {
    this.channel = channel;
    this.setupListener();
  }

  private setupListener() {
    this.channel.on("broadcast", { event: "opponent_action" }, ({ payload }) => {
      const action = payload as IncomingAction;
      const resolver = this.pendingResolvers.get(action.type);
      if (resolver) {
        this.pendingResolvers.delete(action.type);
        resolver(action);
      }
    });
  }

  private waitForAction(type: string): Promise<IncomingAction> {
    return new Promise((resolve) => {
      this.pendingResolvers.set(type, resolve);
      // Timeout de seguridad: si el rival no juega en 60s, devuelve null
      setTimeout(() => {
        if (this.pendingResolvers.has(type)) {
          this.pendingResolvers.delete(type);
          resolve({ type: "NEXT_PHASE" } as IncomingAction); // skip turno
        }
      }, 60_000);
    });
  }

  async choosePlay(state: GameState, opponentId: string): Promise<IOpponentPlayDecision | null> {
    const action = await this.waitForAction("PLAY_CARD");
    if (action.type === "PLAY_CARD") return action.payload;
    return null;
  }

  async chooseAttack(state: GameState, opponentId: string): Promise<IOpponentAttackDecision | null> {
    const action = await this.waitForAction("ATTACK");
    if (action.type === "ATTACK") return action.payload;
    return null;
  }

  async chooseModeChange(state: GameState, opponentId: string): Promise<IOpponentModeChangeDecision | null> {
    const action = await this.waitForAction("CHANGE_MODE");
    if (action.type === "CHANGE_MODE") return action.payload;
    return null;
  }
}
```

### 8.2 Hook `useMultiplayerMatch`

```typescript
// src/core/hooks/multiplayer/useMultiplayerMatch.ts
"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-browser-client";
import { RemotePlayerStrategy } from "@/core/services/multiplayer/RemotePlayerStrategy";

export function useMultiplayerMatch(matchId: string, localPlayerId: string) {
  const supabase = createSupabaseBrowserClient();
  const strategyRef = useRef<RemotePlayerStrategy | null>(null);

  useEffect(() => {
    const channel = supabase.channel(`match:${matchId}`, {
      config: { broadcast: { self: false } },
    });

    strategyRef.current = new RemotePlayerStrategy(channel);
    channel.subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  // Enviar la propia acción al canal (y al servidor para validación)
  async function broadcastAction(actionType: string, payload: unknown) {
    // 1. Validar en servidor antes de retransmitir
    const response = await fetch("/api/match/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, actionType, payload }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    // 2. Broadcast al canal (el servidor lo hace desde la Edge Function)
    // El cliente NO hace broadcast directo — el servidor lo hace tras validar
  }

  return {
    opponentStrategy: strategyRef.current,
    broadcastAction,
  };
}
```

### 8.3 Integración con `useBoard`

```typescript
// En src/app/hub/multiplayer/match/[matchId]/MatchRoom.tsx

const { opponentStrategy, broadcastAction } = useMultiplayerMatch(matchId, localPlayerId);

const boardApi = useBoard(
  localPlayerDeck,
  "MULTIPLAYER",
  undefined,           // initialConfig
  false,               // isMatchStartLocked
  false,               // disableBaseSoundtrack
  true,                // disableOpponentAutomation (el "oponente" es el RemotePlayerStrategy)
  opponentStrategy ?? undefined
);

// Interceptar acciones del jugador local para transmitirlas
function handlePlayCard(card: ICard, mode: IBoardEntityMode) {
  broadcastAction("PLAY_CARD", { cardId: card.id, mode });
  boardApi.onPlayCard(card, mode); // ejecutar localmente
}
```

### 8.4 Secuencia de sincronización de un turno

```
Jugador A (su turno)               Servidor                Jugador B (espera)
       │                               │                          │
       │─── POST /api/match/action ───▶│                          │
       │    { type: "PLAY_CARD",       │                          │
       │      cardId: "X", mode: ATK } │                          │
       │                               │── valida acción ────────▶│
       │                               │   (GameEngine.playCard)  │
       │                               │                          │
       │                               │── INSERT match_actions ──│
       │                               │                          │
       │                               │── BROADCAST ────────────▶│
       │                               │   { event: "opp_action", │
       │◀─── 200 OK ──────────────────│     payload: decision }  │
       │                               │                          │
       │ aplica acción localmente      │          │ RemotePlayerStrategy
       │ GameEngine.playCard(...)      │          │ resuelve Promise
       │                               │          │ useBoard ejecuta acción
```

---

## 9. Fase 5 — Validación Server-Side y Anti-Cheat

### 9.1 Edge Function: `/api/match/action`

La validación server-side es crítica. Sin ella, cualquier jugador puede enviar acciones inválidas.

```typescript
// src/app/api/match/action/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseRouteClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-route-client";
import { GameEngine } from "@/core/use-cases/GameEngine";

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  const { matchId, actionType, payload } = await request.json();

  // 1. Obtener el estado actual de la partida
  const { data: match } = await supabase
    .from("match_sessions")
    .select("*")
    .eq("id", matchId)
    .single();

  if (!match || match.status !== "ACTIVE") {
    return NextResponse.json({ message: "Match not active" }, { status: 400 });
  }

  // 2. Verificar que es el turno del jugador
  // (reconstruir GameState desde match_actions)
  const { data: actions } = await supabase
    .from("match_actions")
    .select("*")
    .eq("match_id", matchId)
    .order("sequence", { ascending: true });

  const gameState = replayActionsToState(match, actions ?? []);

  if (gameState.activePlayerId !== user.id) {
    return NextResponse.json({ message: "Not your turn" }, { status: 403 });
  }

  // 3. Validar que la acción es legal
  try {
    const engine = new GameEngine();
    validateAction(engine, gameState, actionType, payload); // lanza si inválido
  } catch (err) {
    return NextResponse.json({ message: `Illegal action: ${err}` }, { status: 422 });
  }

  // 4. Persistir la acción
  const nextSequence = (actions?.length ?? 0) + 1;
  await supabase.from("match_actions").insert({
    match_id: matchId,
    player_id: user.id,
    sequence: nextSequence,
    action_type: actionType,
    payload,
  });

  // 5. Retransmitir al oponente via Broadcast
  const opponentId = match.player_a_id === user.id ? match.player_b_id : match.player_a_id;
  await supabase.channel(`match:${matchId}`).send({
    type: "broadcast",
    event: "opponent_action",
    payload: { type: actionType, payload },
  });

  return NextResponse.json({ ok: true });
}
```

### 9.2 Función `replayActionsToState`

Para validar server-side, el servidor reconstruye el estado del juego aplicando todas las acciones registradas en orden:

```typescript
function replayActionsToState(match: IMatchSession, actions: IMatchAction[]): GameState {
  const engine = new GameEngine();
  let state = createInitialGameState({
    playerAId: match.player_a_id,
    playerBId: match.player_b_id,
    deckAIds: match.deck_a_ids,
    deckBIds: match.deck_b_ids,
  });

  for (const action of actions) {
    state = applyAction(engine, state, action.action_type, action.payload);
  }

  return state;
}
```

Esto garantiza que el servidor siempre tiene la verdad canónica del estado.

### 9.3 Protecciones anti-cheat implementadas

| Protección | Implementación |
|------------|----------------|
| Solo el jugador activo puede actuar | Verificar `gameState.activePlayerId === user.id` |
| No se pueden jugar cartas que no están en la mano | `GameEngine.playCard()` lanza si la carta no existe en `hand` |
| No se puede atacar fuera de fase | `GameEngine.executeAttack()` lanza si `phase !== "BATTLE"` |
| No se puede invocar la misma carta dos veces por turno | `hasNormalSummonedThisTurn` en GameState |
| Rate limiting en `/api/match/action` | Middleware de rate limit existente (ya implementado en el proyecto) |
| Validación de mazo en inicio | Verificar que `deck_*_ids` son cartas que el jugador posee |

---

## 10. Fase 6 — Reconexión y Resiliencia

### 10.1 Escenarios de desconexión

```
Tipo               Duración    Estrategia
─────────────────────────────────────────────────────
Pérdida momentánea  < 10s     Reconectar automáticamente, replay desde match_actions
Desconexión media   10-60s    Mostrar indicador "rival desconectado", pausar temporizador
Abandono            > 60s     Otorgar victoria al rival, actualizar stats
```

### 10.2 Hook `useConnectionStatus`

```typescript
// src/core/hooks/multiplayer/useConnectionStatus.ts
"use client";

import { useEffect, useState } from "react";

type ConnectionStatus = "CONNECTED" | "RECONNECTING" | "DISCONNECTED";

export function useConnectionStatus(channel: RealtimeChannel | null) {
  const [status, setStatus] = useState<ConnectionStatus>("CONNECTED");
  const [opponentConnected, setOpponentConnected] = useState(true);

  useEffect(() => {
    if (!channel) return;

    channel.on("presence", { event: "leave" }, ({ leftPresences }) => {
      // Si el oponente desconecta, actualizar UI
      setOpponentConnected(false);
    });

    channel.on("presence", { event: "join" }, ({ newPresences }) => {
      setOpponentConnected(true);
    });

    // Detectar desconexión propia
    const handleOffline = () => setStatus("RECONNECTING");
    const handleOnline = () => setStatus("CONNECTED");
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [channel]);

  return { status, opponentConnected };
}
```

### 10.3 Recuperación de estado al reconectar

Al reconectar, el cliente puede reconstruir el estado actual de la partida desde `match_actions` sin depender de lo que tenía en memoria:

```typescript
async function recoverMatchState(matchId: string): Promise<GameState> {
  const { data: match } = await supabase
    .from("match_sessions").select("*").eq("id", matchId).single();
  const { data: actions } = await supabase
    .from("match_actions").select("*")
    .eq("match_id", matchId).order("sequence");

  return replayActionsToState(match, actions ?? []);
}
```

---

## 11. Recompensas y Clasificación

### 11.1 La política de recompensas ya está implementada

```typescript
// src/core/services/match/rewards/match-reward-policy.ts
// → rewardForMultiplayer() ya devuelve:
//   WIN:  { nexus: 90, playerExperience: 140 }
//   LOSE: { nexus: 18, playerExperience: 40 }
//   DRAW: { nexus: 45, playerExperience: 80 }
```

Solo hay que llamarla desde el endpoint de fin de partida.

### 11.2 Sistema ELO (opcional, Fase 2+)

Formula K=32 estándar para calcular cambios de ELO:

```typescript
function calculateEloChange(winnerElo: number, loserElo: number, K = 32): number {
  const expectedScore = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  return Math.round(K * (1 - expectedScore));
}
```

La tabla `player_pvp_stats` ya incluye el campo `elo` inicializado en 1000.

---

## 12. Plan de Implementación por Sprints

### Sprint 1 — Infraestructura (2-3 días)
- [ ] Crear migración `043_multiplayer_infrastructure.sql` con las 4 tablas
- [ ] Aplicar migración en local con `pnpm supabase:db:reset:local`
- [ ] Habilitar Realtime en las tablas nuevas
- [ ] Crear cliente Supabase de browser: `create-supabase-browser-client.ts`
- [ ] Verificar que los tipos TypeScript se generan correctamente

### Sprint 2 — Presencia y Lobby (3-4 días)
- [ ] Hook `useOnlinePlayers` con Supabase Presence
- [ ] Componente `OnlinePlayersList` en `/hub/multiplayer`
- [ ] Hook `usePendingInvitations` con Postgres changes
- [ ] Server Actions: `send-invitation`, `accept-invitation`, `decline-invitation`
- [ ] UI de invitación (modal de recepción + sala de espera)
- [ ] Desbloquear MULTIPLAYER en `HubAccessPolicy`

### Sprint 3 — Motor de Partida (4-5 días)
- [ ] `RemotePlayerStrategy` implementando `IOpponentStrategy`
- [ ] Hook `useMultiplayerMatch` (canal, broadcast, reconexión)
- [ ] Route Handler `/api/match/action` (validación + broadcast)
- [ ] Función `replayActionsToState` (verdad canónica del servidor)
- [ ] Página `/hub/multiplayer/match/[matchId]/page.tsx`
- [ ] Integrar con `useBoard(mode="MULTIPLAYER", opponentStrategyOverride=...)`
- [ ] Tests unitarios de `RemotePlayerStrategy`

### Sprint 4 — Resiliencia y Finalización (2-3 días)
- [ ] Hook `useConnectionStatus` con indicadores en UI
- [ ] Temporizador de turno (60s) con forfeit automático
- [ ] Lógica de abandono y forfeit (detectar rival desconectado > 60s)
- [ ] Endpoint `/api/match/finish` (recompensas + stats ELO)
- [ ] Pantalla de resultado final con recompensas obtenidas
- [ ] Tests E2E básicos (dos instancias de browser con Playwright)

### Sprint 5 — Pulido (1-2 días)
- [ ] Indicadores de latencia en UI
- [ ] Historial de partidas en perfil
- [ ] Ranking/leaderboard básico
- [ ] Notificaciones push de invitación (si el hub está abierto en background)

---

## 13. Consideraciones de Seguridad

### 13.1 Nunca confiar en el cliente

El cliente puede estar modificado. Toda acción pasa por `/api/match/action`:

1. **Autenticación JWT** verificada en cada request (Supabase middleware)
2. **El servidor reconstruye el estado** desde `match_actions` — nunca acepta un `GameState` del cliente
3. **`GameEngine` valida** la acción antes de persistirla

### 13.2 Protección contra replay attacks

Cada acción tiene un `sequence` único por partida. El servidor rechaza cualquier acción con un sequence ya registrado:

```typescript
// En /api/match/action:
if (actions.some(a => a.sequence === nextSequence)) {
  return NextResponse.json({ message: "Duplicate action" }, { status: 409 });
}
```

### 13.3 Rate limiting en acciones de partida

El middleware de rate limiting existente (`src/middleware.ts`) ya protege rutas de API. Añadir la ruta `/api/match/action` al conjunto de rutas limitadas con un límite apropiado (ej. 30 req/min por usuario).

### 13.4 Validación del mazo al inicio

Al crear `match_sessions`, verificar que las cartas del mazo pertenecen al jugador:

```typescript
// En accept-invitation.ts, antes de crear la sesión:
const { data: ownedCards } = await supabase
  .from("player_cards")  // tabla de posesión de cartas
  .select("card_id")
  .eq("player_id", user.id)
  .in("card_id", selectedDeckIds);

if (ownedCards.length !== selectedDeckIds.length) {
  throw new Error("Deck contains cards you don't own");
}
```

---

## 14. Referencia de Archivos Clave

### Archivos existentes (no modificar sin cuidado)

| Archivo | Rol en multijugador |
|---------|---------------------|
| `src/core/services/opponent/types.ts` | Interfaz que `RemotePlayerStrategy` implementa |
| `src/core/use-cases/GameEngine.ts` | Motor puro que valida acciones server-side |
| `src/core/use-cases/game-engine/state/types.ts` | Tipo `GameState` — fuente de verdad |
| `src/components/game/board/hooks/useBoard.ts` | Hook de partida — acepta `opponentStrategyOverride` |
| `src/core/services/hub/HubAccessPolicy.ts` | Desbloquear cambiando `isLocked: false` |
| `src/core/services/match/rewards/match-reward-policy.ts` | Ya implementado para MULTIPLAYER |

### Archivos nuevos a crear

| Archivo | Descripción |
|---------|-------------|
| `supabase/migrations/043_multiplayer_infrastructure.sql` | Tablas, RLS, Realtime |
| `src/infrastructure/persistence/supabase/internal/create-supabase-browser-client.ts` | Cliente Supabase para componentes client |
| `src/core/services/multiplayer/RemotePlayerStrategy.ts` | Adaptador IOpponentStrategy → Realtime |
| `src/core/hooks/multiplayer/useOnlinePlayers.ts` | Presencia en el hub |
| `src/core/hooks/multiplayer/usePendingInvitations.ts` | Escuchar invitaciones entrantes |
| `src/core/hooks/multiplayer/useMultiplayerMatch.ts` | Orquestar canal y acciones de partida |
| `src/core/hooks/multiplayer/useConnectionStatus.ts` | Detectar desconexiones |
| `src/app/hub/multiplayer/actions/send-invitation.ts` | Server Action: invitar |
| `src/app/hub/multiplayer/actions/accept-invitation.ts` | Server Action: aceptar |
| `src/app/api/match/action/route.ts` | Route Handler: validar y retransmitir acción |
| `src/app/api/match/finish/route.ts` | Route Handler: finalizar partida y recompensas |
| `src/app/hub/multiplayer/match/[matchId]/page.tsx` | Página de partida en curso |
| `src/components/hub/multiplayer/OnlinePlayersList.tsx` | UI jugadores online |
| `src/components/hub/multiplayer/InvitationModal.tsx` | UI invitación recibida |
| `src/components/hub/multiplayer/MatchLobby.tsx` | UI sala de espera |

---

*Documento generado en branch `features/multiplayer-guide` — v1.2.0*
