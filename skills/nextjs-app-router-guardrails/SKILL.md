<!-- skills/nextjs-app-router-guardrails/SKILL.md - Guardrails para mantener App Router con Server Components y límites claros de cliente. -->
---
name: nextjs-app-router-guardrails
description: Úsala en cambios de páginas, layouts, rutas API o fetch para aplicar reglas estrictas de App Router y minimizar use client.
---

# Guardrails de App Router

## Cuándo usar esta skill
Aplicar en cambios de `app/`, layouts, páginas, rutas API, componentes de UI y flujos de datos de Next.js.

## Flujo de decisión
1. Verificar si la pantalla puede resolverse como Server Component.
2. Permitir `"use client"` solo para hooks de estado/efectos o eventos de DOM.
3. Mover data fetching al servidor siempre que sea posible.
4. Dejar la UI cliente como capa fina de interacción.

## Reglas obligatorias
- Server Components por defecto.
- Prohibido usar `"use client"` por conveniencia.
- Prohibido mezclar reglas de negocio en componentes React.
- Rutas API solo orquestan: no lógica de dominio compleja.

## Checklist rápido
- ¿El componente cliente es mínimo y aislado?
- ¿El fetch principal ocurre en servidor?
- ¿La lógica de negocio vive en `services/` o `core/`?
- ¿Se evitó acceso directo a infraestructura desde UI?

## Integración con Engram
- Buscar decisiones previas con `mem_search`.
- Guardar cambios de patrón con `mem_save` usando `architecture/*` o `pattern/*`.
