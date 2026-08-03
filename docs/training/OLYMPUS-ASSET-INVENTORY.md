<!-- docs/training/OLYMPUS-ASSET-INVENTORY.md - Inventario canónico de arte para rivales legendarios de Olimpo. -->
# Inventario de assets de Olimpo

Los rivales exclusivos de Olimpo viven fuera de `story/opponents` para evitar acoplar su ciclo de contenido al modo Story.

## Estructura

```text
public/assets/combat/olympus/opponents/
├── hefes/
├── loki/
└── zeus/
```

Cada rival contiene:

- `avatar.webp`: retrato compacto para selectores y HUD.
- `intro.webp`: presentación previa al combate.
- `victoria.webp`: reacción cuando vence el rival.
- `derrota.webp`: reacción cuando el jugador vence.

Las rutas se incorporarán al catálogo persistente `olympus_opponents` durante la fase de dominio/admin de Olimpo. Hasta entonces son assets versionados, pero no se exponen mediante lógica provisional.
