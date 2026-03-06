# AI-GI-OH!

Juego de cartas táctico en Next.js con motor de reglas desacoplado, errores tipados de dominio y loop automático de turno para oponente heurístico.

## Stack

1. Next.js (App Router)
2. React
3. TypeScript estricto
4. Vitest + Testing Library
5. ESLint

## Comandos

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:coverage
pnpm build
pnpm quality:check
```

## Arquitectura

1. `src/components`: UI y hooks de interacción.
2. `src/core/entities`: contratos de dominio.
3. `src/core/errors`: jerarquía de errores tipados.
4. `src/core/use-cases`: motor del juego y servicios de combate.
5. `src/core/services/opponent`: estrategia del oponente y stepper de turno.
6. `src/infrastructure`: adaptadores externos (reservado para integración real).

## Calidad mínima para merge

1. `pnpm lint` en verde.
2. `pnpm typecheck` en verde (incluye tests TS).
3. `pnpm test:coverage` en verde.
4. `pnpm build` en verde.
5. Cobertura mínima en lógica de negocio (`core/use-cases`): 80% líneas/funciones/statements y 70% ramas.

## Documentación relacionada

1. `Architecture.md`: estructura y dependencias por capas.
2. `MOTOR_JUEGO.md`: reglas funcionales del motor y ciclo de turnos.
3. `Agents.md`: normas obligatorias de calidad y contribución.
4. `src/core/use-cases/game-engine/README.md`: invariantes y contratos del motor.
5. `src/core/services/opponent/README.md`: estrategia heurística y extensión futura.
6. `src/components/game/board/hooks/internal/README.md`: responsabilidades de hooks internos del tablero.
