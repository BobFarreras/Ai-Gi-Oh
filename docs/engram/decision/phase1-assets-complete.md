---
topic_key: "phase1/assets-migration-complete"
date: "2026-06-10"
status: "completed"
---

# Fase 1.1 Completada: Migración de assets bg-tech y eliminación HUD obsoleto

## Contexto

La Fase 1.1 del Performance Masterplan requiere migrar imágenes JPG/PNG a WebP y eliminar assets no utilizados.

## Acciones completadas

1. **bg-tech.jpg → bg-tech.webp**: Migrado en todos los archivos de código fuente (8 archivos + cards_catalog.json). Ahorro: 219 KB por carga.
2. **bg-tech.jpg eliminado** del servidor (`public/assets/bgs/bg-tech.jpg`). La versión WebP (64 KB) ya existía.
3. **HUD PNGs eliminados**: `hud-container.png` (161 KB), `hud-header.png` (56 KB), `hud-section.png` (57 KB). Ninguno era referenciado en el código fuente. Ahorro: 275 KB eliminados.
4. **Test bgUrl corregido**: Tests que apuntaban a `/assets/backgrounds/card-bg-tech.webp` (archivo inexistente) corregidos a `/assets/bgs/bg-tech.webp`.

## Archivos modificados

- `src/core/data/mock-cards/entities.ts`
- `src/core/data/mock-cards/fusions.ts`
- `src/components/tfm/internal/TFMHeroHeader.tsx`
- `src/components/admin/internal/admin-card-catalog-draft.ts`
- `src/components/admin/AdminAuditPanel.tsx`
- `src/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card.test.ts`
- `src/components/hub/academy/tutorial/nodes/arsenal/internal/create-tutorial-arsenal-mock-data.ts`
- `src/components/hub/academy/training/modes/tutorial/internal/create-tutorial-combat-loadout.ts`
- `src/components/hub/market/vault/MarketVaultCollectionTab.test.tsx`
- `src/components/hub/market/listings/MarketListingsPanel.test.tsx`
- `cards_catalog.json`

## Archivos eliminados

- `public/assets/bgs/bg-tech.jpg`
- `public/assets/hud/hud-container.png`
- `public/assets/hud/hud-header.png`
- `public/assets/hud/hud-section.png`

## Pendiente de Fase 1.1 (requiere herramientas externas)

- Story opponent PNGs → WebP (16 archivos, ~3,5 MB)
- Story player PNGs → WebP (archivos con nombres `image-removebg-preview`, ~2,8 MB)
- Audio MP3 → AAC/Opus (requiere ffmpeg)
- Videos MP4 → streaming progresivo (requiere re-encoding)

## Verificación

- `pnpm typecheck` pasa sin errores
- No quedan referencias a `bg-tech.jpg` en el código fuente