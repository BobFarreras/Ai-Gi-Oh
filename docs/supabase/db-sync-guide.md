<!-- docs/supabase/db-sync-guide.md - Método profesional para mantener la BD local de contribuidores sincronizada con producción. -->
# Sincronizar la BD (producción ↔ contribuidores)

Guía del **método profesional** para que la base de datos local de cualquier
contribuidor quede idéntica a producción en cuanto a **contenido del juego**, sin
copiar datos de jugadores y sin acumular archivos SQL propensos a error.

---

## 1. El malentendido de raíz: esquema ≠ contenido

Una BD tiene dos cosas muy distintas y se versionan de forma diferente:

| | Qué es | Cómo cambia | Dónde vive la verdad |
|---|---|---|---|
| **Esquema (estructura)** | tablas, columnas, índices, RLS, funciones | con `ALTER/CREATE` (DDL) | **migraciones** (`docs/supabase/sql/`) |
| **Contenido (datos)** | precios, oponentes, decks, dificultades, eventos, misiones, calendario de login | con `INSERT/UPDATE` (DML), normalmente **desde el panel admin** | **seed** (`supabase/seed.sql`) |

> **Por eso tus cambios de admin “no quedan en las migraciones”.** El panel admin
> hace `UPDATE`/`INSERT` de **filas** en producción. Eso es *dato*, no *estructura*:
> no genera —ni debe generar— un archivo de migración. Si intentaras capturar cada
> ajuste de balance como una nueva migración, tendrías cientos de archivos y sería
> justo lo frágil que temes.

La solución no es “más migraciones”, es **separar las capas**: el esquema en
migraciones (historial inmutable, append-only) y el contenido en un **seed
regenerable** (un solo archivo que se sobreescribe).

---

## 2. Las dos capas que ya tienes

1. **Migraciones** — `docs/supabase/sql/NNN_*.sql`
   - Fuente de verdad de la **estructura** + contenido *histórico/fundacional*.
   - `pnpm supabase:prepare:migrations` las copia a `supabase/migrations/`.
   - Son **inmutables y ordenadas**: nunca edites una ya publicada, añade otra.
     (Tener muchas es **normal y sano** para el esquema; no es deuda.)

2. **Seed** — `supabase/seed.sql`
   - Contenido **editable** del juego como **UPSERTs idempotentes**
     (`INSERT ... ON CONFLICT DO UPDATE`).
   - Corre **después** de las migraciones, así que es la **“capa que gana”**.
   - Se **regenera** con `pnpm db:seed:dump` desde una BD fuente (prod o local).
   - **Nunca** incluye datos de jugador (`player_*`, `auth.*`, wallets, colección…).

Aplicación de ambas capas sobre una BD limpia:

```
pnpm db:reset      # = prepare:migrations + supabase db reset --local (migraciones + seed)
```

---

## 3. Cobertura del dump (qué se sincroniza)

`pnpm db:seed:dump` (lista `TABLES` en
[`scripts/supabase/dump-seed.mjs`](../../scripts/supabase/dump-seed.mjs)) vuelca en un
solo comando **todo el contenido editable** del juego:

- **Mercado / economía:** `market_card_listings`, `market_pack_definitions`,
  `market_pack_pool_entries`.
- **Live-ops:** `events`, `event_point_rules`, `event_shop_items`,
  `mission_definitions`, `featured_promotions`, `login_reward_calendar`.
- **Onboarding:** `starter_deck_template_slots`.
- **Story (admin):** `story_opponents`, `story_deck_lists`, `story_deck_list_cards`,
  `story_duels`, `story_duel_reward_cards`, `story_duel_ai_profiles`,
  `story_duel_deck_overrides`, `story_duel_fusion_cards`.
- **Arena (admin):** `arena_opponents`, `arena_opponent_deck_variants`,
  `arena_deck_variant_cards`, `arena_tiers`.

Detalles de implementación (por si añades tablas nuevas):

- **Orden FK-safe:** los padres van antes que los hijos (`story_opponents →
  story_deck_lists → story_deck_list_cards`; `arena_opponents → variants → cards`).
- **jsonb:** columnas marcadas en `json:[...]` se serializan con `::jsonb`
  (`story_opponents.ai_profile`, `story_duel_ai_profiles.ai_profile`,
  `story_duel_deck_overrides.effect_override`).
- **`reload`:** tablas sin clave natural (PK de identidad, p. ej.
  `arena_deck_variant_cards`) se vacían (`DELETE`) y reinsertan en vez de UPSERT.
- **`story_duels`** se ordena por `(chapter, duel_index)` para satisfacer su auto-FK
  `unlock_requirement_duel_id` dentro del mismo `INSERT`.
- Se **omiten** `updated_at`/`created_at` (ruido, no contenido) y `cards_catalog`
  (lo gobiernan las migraciones).

---

## 4. Flujo del **mantenedor** (tú), tras tocar contenido en prod

Editas por el panel admin en producción (dificultad de un duelo, un mazo, un
precio, la carta del día 7…). Luego, para propagarlo al repo:

```
# 1) Apunta el dump a PRODUCCIÓN (no a tu local) y regenera el seed:
SEED_SOURCE_URL=<prod_url> SEED_SOURCE_KEY=<prod_service_role_key> pnpm db:seed:dump

# 2) Valida referencias de cartas (evita FK 23503 en instalaciones limpias):
pnpm db:validate

# 3) Revisa el diff y commitea:
git add supabase/seed.sql
git commit -m "chore(db): sync seed de contenido desde prod"
```

- Usa la **service_role key** solo en tu máquina/CI seguro; **nunca** la commitees.
- El seed es idempotente: puedes **re-aplicarlo a prod** sin duplicar nada.

---

## 5. Flujo del **contribuidor**, tras `git pull`

```
pnpm db:reset
```

Reaplica **todas** las migraciones + el `seed.sql` sobre una BD Docker limpia →
queda **idéntica al repo**. (Borra datos locales; en local solo hay pruebas.)

Primera vez en una máquina:

```
pnpm supabase:bootstrap:local   # genera migraciones, levanta Docker, aplica esquema, crea keys locales
pnpm supabase:env:apply         # apunta la app a la BD local (backup de tu .env.local)
# ...trabajar...
pnpm supabase:env:restore       # volver a tu entorno anterior
```

---

## 6. Sobre tu idea del “backup diario de prod”

Sí se puede, y es una buena idea **si se acota bien**. Pero hay que distinguir dos
cosas que suelen confundirse:

- **Backup de recuperación ante desastres** (todo, incluidos usuarios): eso ya lo da
  Supabase con sus *backups*/PITR del proyecto. **No** es para contribuidores y
  **no** debe entrar en git (contiene PII).
- **Sync de contenido para contribuidores**: es un **volcado content-only** de las
  tablas de juego a `seed.sql`. Esto es exactamente lo que hace `db:seed:dump`.

**Recomendado: automatizarlo como job diario/semanal**, con guardarraíles:

1. Un workflow programado (GitHub Actions `schedule`) corre
   `SEED_SOURCE_URL/KEY=<prod> pnpm db:seed:dump` con las credenciales en *secrets*.
2. Corre `pnpm db:validate` (y a poder ser un `db:reset` en CI) para probar que el
   seed aplica limpio.
3. **Abre un PR** con el diff del `seed.sql` (no commit directo a `main`): así ves
   qué cambió y lo revisas antes de fusionar. Un auto-commit ciego puede colar un
   cambio de balance a medio hacer que hiciste en prod “para probar”.

Reglas duras del volcado automático:
- **Solo tablas de contenido**; jamás `player_*`, `auth.*`, `market_transactions`,
  `match_*`, `admin_users`, `admin_audit_log`.
- **UPSERT idempotente** (ya lo es) para poder reaplicar sin romper.
- Credenciales de prod **solo** en secrets del CI, nunca en el repo.

Cadencia: no hace falta “diario” de verdad. Con dispararlo **manualmente tras una
sesión de balance en prod**, o **semanal**, sobra. Lo importante es que sea *un
comando* y que pase por PR.

---

## 7. Reglas de oro (no te saltes estas)

1. **Carta nueva ⇒ migración.** `cards_catalog` lo gobiernan **las migraciones**.
   Si creas una carta en prod (admin/SQL), añade su `INSERT` idempotente en una
   migración `docs/supabase/sql/` con los **valores reales de prod**. Si no, un
   `pnpm db:reset` limpio revienta con **FK 23503** al sembrar decks/mercado que la
   referencian. (El seed y los decks referencian cartas por FK, pero no las crean.)
2. **`pnpm db:validate` antes de commitear** cualquier cambio de `seed.sql`,
   migraciones de cartas o decks de oponentes (Story/Arena). Está en
   `pnpm quality:check` (gate de PR) y en `db:reset`.
3. **Migraciones = append-only.** Nunca edites una publicada; añade la siguiente.
   El “historial largo” de migraciones **es correcto**; el problema no es su número,
   es meter *contenido cambiante* en ellas en vez de en el seed.
4. **El seed nunca lleva datos de jugador.** Si algún día necesitas datos de prueba
   de jugador para reproducir un bug, van aparte y anonimizados, no en `seed.sql`.

---

## 8. Checklist rápida

**Cambié contenido en prod (admin) y quiero propagarlo:**
- [ ] `SEED_SOURCE_URL/KEY=<prod> pnpm db:seed:dump`
- [ ] ¿Creé cartas nuevas? → añade su migración en `docs/supabase/sql/`
- [ ] `pnpm db:validate`
- [ ] commit de `supabase/seed.sql` (+ migración de cartas si aplica) → PR

**Soy contribuidor y acabo de hacer pull:**
- [ ] `pnpm db:reset`

**Quiero automatizarlo:**
- [ ] workflow programado que corre el dump content-only con secrets → abre PR con el diff
