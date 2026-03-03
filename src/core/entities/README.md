# Entities Module

Tipos de dominio puros del juego, sin dependencias de UI.

## Entidades clave

1. `ICard`
   - Tipos soportados: `ENTITY`, `EXECUTION`, `TRAP`, `FUSION`, `ENVIRONMENT`.
   - Trigger de trampas:
     - `ON_OPPONENT_ATTACK_DECLARED`
     - `ON_OPPONENT_EXECUTION_ACTIVATED`
   - Metadatos de fusión preparados:
     - `fusionRecipeId`
     - `fusionMaterials`
     - `fusionEnergyRequirement`
     - `archetype`

2. `IPlayer` / `IBoardEntity`
   - Estado de jugador, mano, mazo, cementerio y slots en campo.

3. `ICombatLog`
   - Estructura de trazabilidad en memoria para eventos de turno/combate.
   - Campos: `id`, `turn`, `phase`, `actorPlayerId`, `eventType`, `payload`, `timestamp`.
   - Eventos actuales:
     - `TURN_STARTED`
     - `PHASE_CHANGED`
     - `ENERGY_GAINED`
     - `CARD_PLAYED`
     - `ATTACK_DECLARED`
     - `BATTLE_RESOLVED`
     - `DIRECT_DAMAGE`
     - `HEAL_APPLIED`
     - `STAT_BUFF_APPLIED`
     - `TRAP_TRIGGERED`
     - `CARD_TO_GRAVEYARD`
     - `MANDATORY_ACTION_RESOLVED`
     - `FUSION_SUMMONED`
