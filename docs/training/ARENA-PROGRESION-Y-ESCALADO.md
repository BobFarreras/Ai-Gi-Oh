<!-- docs/training/ARENA-PROGRESION-Y-ESCALADO.md - Resume la lógica real de desbloqueo, dificultad y recompensas del modo Arena. -->
# Arena: Progresión y Escalado

## Fuente de verdad

1. Catálogo de tiers: `src/core/services/training/resolve-training-tier-catalog.ts`.
2. Reglas de desbloqueo: `src/core/services/training/resolve-training-tier-access.ts`.
3. Actualización de progreso por duelo: `src/core/services/training/apply-training-match-result.ts`.
4. Recompensas por tier: `src/core/services/training/resolve-training-tier-reward.ts`.
5. Persistencia: `player_training_progress` mediante `SupabaseTrainingProgressRepository`.

## Cómo se desbloquean niveles

1. Nivel 1 (`BOOT`) empieza desbloqueado.
2. Cada nivel `N>1` se desbloquea con victorias en el nivel anterior:
   - Nivel 2 requiere 5 victorias en nivel 1.
   - Nivel 3 requiere 5 victorias en nivel 2.
   - Nivel 4 requiere 5 victorias en nivel 3.
   - Nivel 5 requiere 5 victorias en nivel 4.
3. El contador puede superar el mínimo (ejemplo: `9/5`); no es error de progreso.

## Dificultad

1. Dificultad base por tier (catálogo):
   - Tier 1: `EASY`
   - Tier 2: `NORMAL`
   - Tier 3: `NORMAL`
   - Tier 4: `HARD`
   - Tier 5: `BOSS`
2. Además, el oponente aplica ajuste adaptativo por rendimiento en el tier (`resolve-training-opponent-loadout.ts`).

## Rotación de oponentes

1. Tier 1 usa roster ampliado de showcase para variedad:
   - GenNvim, Helena, Jaku, BigLog y Soldado.
2. En tiers superiores, la rotación prioriza el preset del tier actual y mezcla presets anteriores válidos.

## Recompensas

1. Se calculan por tier con `rewardMultiplier`.
2. En derrota se entrega la mitad de la recompensa base de victoria del tier.
3. Se acredita Nexus y experiencia de jugador al cerrar duelo (`CompleteTrainingMatchUseCase`).

## Nota UX actual

1. El header de Arena muestra nivel actual y selector de niveles desbloqueados.
2. El texto de progreso usa “victorias restantes para desbloquear Nivel N”.
