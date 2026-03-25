<!-- docs/admin/GUIA_IMPLEMENTACION_ADMIN.md - Guía profesional para diseñar e implementar el módulo de administración seguro. -->
# Guía de Implementación del Módulo Admin

## 1. Auditoría rápida del estado actual

### 1.1 Hallazgos de arquitectura
1. El proyecto respeta separación por capas (`app/components -> services/use-cases -> core -> infrastructure`) y patrón repositorio.
2. No existe módulo admin en `src/app`, `src/core` ni `src/services`.
3. Las API routes actuales están delegando en servicios/casos de uso; esto es un buen punto de extensión para admin.

### 1.2 Hallazgos de auth y seguridad
1. `middleware.ts` solo protege `/hub/*`.
2. Auth tiene hardening base (validación de origen + rate limit en login/register).
3. No existe tabla/claim/rol de administrador actualmente en `schema.sql`.
4. No existe política RLS de escritura para administrar `cards_catalog`, `market_card_listings`, `starter_deck_template_slots` ni `story_deck_*`.

### 1.3 Hallazgos de datos (Supabase)
1. Ya existe modelo fuerte para cartas y mercado:
   - `cards_catalog`
   - `market_card_listings`
   - `market_pack_definitions`
   - `market_pack_pool_entries`
2. Ya existe modelo para deck inicial:
   - `starter_deck_template_slots`
3. Ya existe modelo para decks de oponentes:
   - `story_deck_lists`
   - `story_deck_list_cards`
4. El sistema actual es mayoritariamente de solo lectura autenticada para catálogos mediante RLS.

## 2. Decisión de seguridad para acceso admin

No usar solo “ruta secreta” ni credenciales hardcodeadas.

Una URL no obvia puede reducir ruido, pero no es control de seguridad real. La autorización debe basarse en identidad + rol.

### Recomendación obligatoria
1. Reutilizar el login estándar de Supabase (`/login`) con cuentas reales de admin.
2. Introducir tabla de autorización explícita `public.admin_users` (whitelist por `auth.users.id`).
3. Validar rol admin en servidor en todas las rutas `/api/admin/*`.
4. Mantener panel admin fuera de indexación y fuera de navegación pública, pero sin depender de eso como defensa principal.

## 3. Diseño objetivo del módulo admin

### 3.1 Casos de uso solicitados
1. Gestión de cartas y lógica de mercado:
   - Crear/editar/desactivar cartas.
   - Crear/editar/desactivar listings.
   - Crear/editar packs y pool de probabilidades.
2. Gestión de deck inicial onboarding:
   - Leer plantilla activa.
   - Editar slots 0..19.
   - Publicar nueva versión de plantilla.
3. Gestión de decks de oponentes:
   - Listar `story_deck_lists` por oponente.
   - Editar composición de `story_deck_list_cards`.
   - Publicar versión de deck sin romper duelos activos.

### 3.2 Estructura recomendada (sin romper arquitectura actual)
1. `src/app/admin-<slug>/page.tsx` (Server Component).
2. `src/app/api/admin/*` para endpoints finos.
3. `src/core/repositories/admin/*` para contratos admin.
4. `src/core/use-cases/admin/*` para reglas de negocio.
5. `src/infrastructure/persistence/supabase/admin/*` para implementaciones de repositorio.
6. `src/services/admin/*` para orquestación y guards reutilizables.

### 3.3 Convención de URL
1. Usar una ruta privada no evidente, por ejemplo `admin-portal-<slug-configurable>`.
2. Definir slug por variable de entorno (`ADMIN_PORTAL_SLUG`) y no hardcodearlo en cliente.
3. Devolver 404 si el slug no coincide para reducir enumeración automatizada.

## 4. Diseño de autenticación y autorización

### 4.1 Tabla mínima de autorización

```sql
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'ADMIN' check (role in ('ADMIN','SUPER_ADMIN')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

### Políticas RLS recomendadas
1. `SELECT` solo para el propio usuario (`auth.uid() = user_id`) si necesitas autoinspección.
2. Escritura de `admin_users` únicamente por `service_role` o proceso SQL controlado.
3. No exponer endpoint público para elevar privilegios.

### 4.2 Guard server-side de admin
1. Crear `assertAdminAccess(supabaseClient)`:
   - obtiene `auth.getUser()`.
   - valida existencia en `admin_users` con `is_active = true`.
   - lanza `AuthorizationError` si falla.
2. Llamar este guard en:
   - `src/app/admin-<slug>/layout.tsx`
   - cada `src/app/api/admin/*/route.ts`

### 4.3 Protección extra recomendada
1. Rate limit específico para `/api/admin/*`.
2. Auditoría obligatoria (`admin_audit_log`) por operación sensible.
3. Si es viable: MFA obligatoria para cuentas admin en Supabase Auth.

## 5. Diseño de datos para operaciones admin

### 5.1 Cartas + mercado
1. Operar en transacciones atómicas cuando se creen carta + listing + pack/pool.
2. Reutilizar la filosofía de `docs/supabase/sql/templates/*`.
3. Añadir validadores de dominio para:
   - coherencia `type` vs `attack/defense/trigger`.
   - pesos de pack (`weight > 0`).
   - ids estables y únicos.

### 5.2 Deck inicial
1. No mutar en caliente la plantilla activa si hay riesgo de inconsistencia.
2. Usar versionado por `template_key` (`academy-starter-v2`, `v3`, ...).
3. Activar nueva versión con operación explícita de “publicar”.

### 5.3 Decks de oponentes
1. Versionar decks en `story_deck_lists.version`.
2. Editar en borrador y luego activar.
3. Validar límites:
   - slot `0..59`
   - `copies <= 3`
4. Bloquear publicación si faltan cartas referenciadas en `cards_catalog`.

## 6. Contratos de repositorio/casos de uso propuestos

### 6.1 Repositorios
1. `IAdminCatalogRepository`
   - `listCards`, `createCard`, `updateCard`, `setCardActive`
   - `listCardListings`, `upsertCardListing`
   - `listPackDefinitions`, `upsertPackDefinition`, `replacePackPoolEntries`
2. `IAdminStarterDeckRepository`
   - `getTemplate`, `saveDraftTemplate`, `publishTemplateVersion`
3. `IAdminStoryDeckRepository`
   - `listOpponentDecks`, `getDeck`, `saveDeckDraft`, `publishDeckVersion`

### 6.2 Casos de uso
1. `UpsertCardCatalogEntryUseCase`
2. `UpsertMarketCardListingUseCase`
3. `UpsertMarketPackUseCase`
4. `PublishStarterDeckTemplateUseCase`
5. `PublishStoryDeckListUseCase`

Cada caso de uso debe validar reglas y nunca delegar decisiones de negocio a React.

## 7. UI admin (profesional y segura)

1. Server Component para shell y data fetching inicial.
2. Client Components solo para formularios interactivos.
3. Formularios con validación dual:
   - cliente: UX inmediata
   - servidor: validación autoritativa
4. Confirmación explícita para acciones destructivas (desactivar carta, publicar versión).
5. Mostrar `traceId` en errores API para soporte técnico.

## 8. Testing y quality gates

### 8.1 Unit tests obligatorios
1. Validadores de dominio admin (`*.test.ts`).
2. Casos de uso admin:
   - éxito
   - validación fallida
   - acceso no autorizado

### 8.2 Component tests
1. Formularios admin con React Testing Library.
2. Queries semánticas (`getByRole`, `getByLabelText`, `getByText`).

### 8.3 Integración API
1. Tests de rutas `/api/admin/*` con:
   - 401/403 sin rol
   - 200 con rol admin
   - errores de validación 400

### 8.4 Gates bloqueantes
1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`

## 9. Plan de implementación por fases

1. Fase A: Seguridad base
   - migración SQL de `admin_users` + `admin_audit_log`
   - guard `assertAdminAccess`
   - middleware/layout para zona admin
2. Fase B: Cartas y mercado
   - repositorios + casos de uso + API + UI
3. Fase C: Deck inicial
   - CRUD versionado de `starter_deck_template_slots`
4. Fase D: Decks de oponentes
   - CRUD versionado de `story_deck_lists` y `story_deck_list_cards`
5. Fase E: Hardening final
   - rate limit admin
   - auditoría completa
   - pruebas E2E críticas

## 10. Riesgos a evitar

1. Guardar contraseña admin hardcodeada en código o `.env` compartido.
2. Usar solo URL secreta como mecanismo de seguridad.
3. Saltarse patrón repositorio desde rutas API.
4. Editar datos de story/deck sin versionado y sin rollback.
5. Publicar cambios de mercado sin validación de consistencia entre catálogo/listings/packs.

## 11. Resultado esperado

Al finalizar, tendrás un panel admin con acceso seguro basado en rol real, operaciones trazables y sin romper la arquitectura limpia del proyecto.

## 12. Estado actual (2026-03-25)

1. Fase A completada: acceso admin por `admin_users`, guard server-side y portal privado por slug.
2. Fase B completada: CRUD admin de catálogo/market por endpoints dedicados.
3. Fase C (starter deck) completada en base:
   - lectura/guardado de plantilla starter desde `/api/admin/starter-deck/template`,
   - layout administrativo responsive con sidebar lateral plegable,
   - editor visual tipo Arsenal (detalle, deck 5x4, almacén con búsqueda/filtro por tipo y drag/drop).
4. Pendiente siguiente bloque funcional: Fase D (`story_decks` de oponentes).
