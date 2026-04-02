<!-- docs/audits/2026-04-02-guia-hardening-final-tfm.md - Guía de ejecución final para cerrar seguridad, rendimiento y deuda técnica antes del TFM. -->
# Guía de Hardening Final para TFM (2026-04-02)

## Objetivo

1. Cerrar riesgos de seguridad y calidad detectados en la auditoría técnica.
2. Reducir deuda técnica estructural sin modificar diseño ni UX.
3. Llegar a defensa TFM con evidencia objetiva de robustez (`lint`, `test`, `coverage`, `build`, `audit`).

## Estado base (snapshot de partida)

1. `pnpm lint`: verde.
2. `pnpm typecheck`: verde.
3. `pnpm test`: verde.
4. `pnpm build`: verde.
5. `pnpm audit --prod`: sin vulnerabilidades conocidas.
6. `pnpm test:coverage`: rojo (test inestable en `TutorialMarketClient`).

## Reglas de ejecución obligatorias

1. No tocar diseño visual ni copy UI salvo para testabilidad/accesibilidad.
2. Mantener arquitectura `components -> services/use-cases -> core`.
3. Cero `any`.
4. Mantener cabecera de ruta + descripción en primera línea.
5. Todo cambio de comportamiento con tests co-localizados.

## Fase 0 - Preparación y baseline reproducible (bloqueante)

1. Crear rama técnica de hardening (`chore/hardening-final-tfm`).
2. Congelar baseline con:
3. `pnpm lint`
4. `pnpm typecheck`
5. `pnpm test`
6. `pnpm test:coverage`
7. `pnpm build`
8. `pnpm audit --prod`
9. Registrar en `docs/audits/` resultados y tiempos de ejecución.

Criterio de salida:
1. Baseline documentado y reproducible por cualquier miembro del tribunal/equipo.

## Fase 1 - Estabilizar gates de calidad (prioridad máxima)

Problema actual:
1. `pnpm test:coverage` falla por flakiness en `src/components/hub/academy/tutorial/nodes/market/TutorialMarketClient.test.tsx`.

Acciones:
1. Eliminar `waitFor` con aserción global booleana (`expect(isCompleted).toBe(true)`).
2. Sustituir por aserciones por estado observable y sincronización determinista.
3. Aislar transiciones asíncronas del flujo de compra pack.
4. Corregir warning de test por `styled-jsx` en `HubSectionEntryBurst` (mock del componente o refactor de estilo encapsulado test-friendly).

Criterio de salida:
1. `pnpm test:coverage` en verde en 3 ejecuciones consecutivas.
2. Sin warnings ruidosos en salida de tests.

## Fase 2 - Seguridad API (CSRF + rate limiting)

Problemas actuales:
1. `validate-request-origin` permite requests sin `Origin`.
2. `security-rate-limiter` degrada a memoria local si no hay backend distribuido.

Acciones:
1. Endurecer política CSRF para mutaciones:
2. exigir `Origin` válido para tráfico browser;
3. documentar excepción explícita solo para integraciones internas firmadas.
4. Añadir validación complementaria de `Referer` cuando aplique.
5. Configurar Upstash (o backend equivalente) en todos los entornos de despliegue.
6. Añadir modo `fail-closed` opcional para rutas críticas (`/api/admin/*`, `/api/auth/*`) cuando falle el limitador distribuido.
7. Extender tests de seguridad para cubrir:
8. `Origin` ausente,
9. `Origin` malicioso,
10. rate limit excedido en modo distribuido y fallback.

Criterio de salida:
1. Todas las mutaciones críticas protegidas por política homogénea.
2. Límite de intentos consistente en entorno multi-instancia.

### Avance implementado (2026-04-02)

1. Política CSRF endurecida:
2. `Origin` ausente ahora se rechaza por defecto en `hasTrustedRequestOrigin`.
3. Se mantiene compatibilidad controlada con `allowMissingOrigin: true` solo cuando se pasa de forma explícita.
4. Rate limiting con modo estricto opcional:
5. `consumeSecurityRateLimit` soporta:
6. `requireDistributedBackend` (rechaza si falta Upstash),
7. `failClosedOnDistributedError` (rechaza si Upstash falla en runtime).
8. Endpoints críticos ya pueden activarlo por entorno:
9. Auth: `AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED`, `AUTH_RATE_LIMIT_FAIL_CLOSED`.
10. Admin: `ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED`, `ADMIN_RATE_LIMIT_FAIL_CLOSED`.
11. Tests ampliados para cubrir:
12. `Origin` ausente (estricto) y excepción explícita.
13. falta de backend distribuido en modo estricto.
14. fallo de backend distribuido con comportamiento fail-closed y fallback.

## Fase 3 - Arquitectura y composición de rutas

Problema actual:
1. Rutas API que instancian infraestructura directamente (acoplamiento alto).

Acciones:
1. Mover composición de repositorios a factories de servicio (`services/*/create-*-route-context.ts`).
2. Dejar handlers de `route.ts` como orquestadores finos (parseo, guardias, respuesta).
3. Mantener contratos en `core` y adaptadores en `infrastructure`.
4. Priorizar refactor en:
5. `src/app/api/story/duels/complete/route.ts`
6. `src/app/api/story/world/interact/route.ts`
7. `src/app/api/admin/audit/route.ts`

Criterio de salida:
1. `route.ts` sin conocimiento de detalles de persistencia concreta.
2. Menor acoplamiento y mejor test unitario de orquestación.

## Fase 4 - Deuda SRP y límite de 150 líneas

Problema actual:
1. 18 archivos críticos superan 150 líneas (componentes/hooks/services/use-cases).

Acciones:
1. Particionar por submódulos (`internal/actions`, `internal/hooks`, `internal/view`, `internal/types`).
2. Empezar por hotspots:
3. `useMatchRuntime.ts`
4. `execution-effect-registry.ts`
5. `SidePanels.tsx`
6. `EffectTargetedOverlay.tsx`
7. `useExecutePlayAction.ts`
8. Mantener una responsabilidad por archivo.

Criterio de salida:
1. Cero archivos nuevos >150 líneas en dominios restringidos.
2. Legacy >150 reducido por tandas con evidencia en PR.

## Fase 5 - Rendimiento sin tocar diseño/UI

Objetivo:
1. Reducir coste de render y trabajo en cliente manteniendo la misma experiencia visual.

Acciones:
1. Revisar `use client` en rutas y mover lo posible a Server Components.
2. Reducir renders innecesarios en `board`, `market` y `story` (memoización selectiva y separación de estado).
3. Auditar overlays/VFX para evitar efectos simultáneos no visibles.
4. Repetir baseline móvil:
5. `pnpm perf:baseline:mobile`
6. `pnpm perf:baseline:mobile:auto:prod`
7. Guardar reporte en `docs/performance/results/` con comparación antes/después.

Criterio de salida:
1. Mejora medible en baseline (TTI, scripting, frames dropped) o justificación técnica documentada si no procede.

## Fase 6 - Cierre de seguridad operacional

1. Rotar `SUPABASE_SERVICE_ROLE_KEY` si hubo exposición fuera de entorno local.
2. Verificar que `.env.local` sigue fuera de Git.
3. Añadir checklist de secretos en PR final (sin claves en logs/docs/capturas).
4. Revisar políticas RLS y permisos admin en Supabase según `docs/security/auth-hardening.md`.

Criterio de salida:
1. Sin secretos expuestos ni permisos sobredimensionados.

## Checklist de cierre (Definition of Done TFM)

1. `pnpm lint` verde.
2. `pnpm typecheck` verde.
3. `pnpm test` verde.
4. `pnpm test:coverage` verde.
5. `pnpm build` verde.
6. `pnpm audit --prod` verde.
7. Cobertura mínima de casos de uso/servicios críticos >= 80%.
8. Sin warnings nuevos.
9. Documentación de cambios actualizada en español.
10. Evidencia Engram (`context`, `search`, `save`, `session summary`) incluida.

## Orden recomendado de ejecución

1. Fase 1 (estabilidad gates).
2. Fase 2 (seguridad API).
3. Fase 3 (arquitectura en rutas).
4. Fase 4 (SRP y tamaño de archivos).
5. Fase 5 (rendimiento).
6. Fase 6 (seguridad operacional y cierre).
