<!-- docs/game-engine/03-combat-and-traps.md - Resolución de combate y cadena mínima de trampas en el motor. -->
# Combate y Trampas

## Reglas de ataque (`executeAttack` + `CombatService`)

1. Solo en `BATTLE` y con jugador activo.
2. Atacante válido: existe, está en `ATTACK` y no atacó aún.
3. Ataque directo permitido solo si rival no tiene entidades.

## Resolución de daño

1. `ATK vs ATK`: diferencia de ATQ daña al defensor.
2. `ATK vs DEF/SET`:
   - si ATQ atacante > DEF defensora, se destruye sin daño penetrante,
   - si no supera DEF, daño de rebote al atacante.
3. Cartas destruidas pasan a `graveyard`.

## Trampas (`TRAP`)

### Triggers soportados

1. `ON_OPPONENT_ATTACK_DECLARED`
2. `ON_OPPONENT_EXECUTION_ACTIVATED`

### Resolución mínima de cadena

1. Se activa la primera trampa `SET` compatible.
2. Aplica efecto.
3. Va a cementerio.

### Efectos soportados

1. `DAMAGE`.
2. `NEGATE_ATTACK_AND_DESTROY_ATTACKER`.
3. `REDUCE_OPPONENT_ATTACK`.
4. `REDUCE_OPPONENT_DEFENSE`.

Si la trampa destruye al atacante al declarar ataque, ese ataque termina sin batalla.
