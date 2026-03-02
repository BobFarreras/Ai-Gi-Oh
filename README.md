# AI-GI-OH!

Juego de cartas táctico en Next.js con un motor de reglas desacoplado en TypeScript.

## Stack

1. Next.js (App Router)
2. React
3. TypeScript estricto
4. Vitest + Testing Library

## Comandos

```bash
pnpm dev
pnpm lint
pnpm test
pnpm test:coverage
pnpm build
pnpm quality:check
```

## Arquitectura

1. `src/components`: UI y composición visual.
2. `src/core/entities`: contratos y tipos de dominio.
3. `src/core/use-cases`: reglas del juego y casos de uso (`GameEngine`, `CombatService`).
4. `src/infrastructure`: adaptadores externos (pendiente de implementación funcional).

Documentación relacionada:

1. `Architecture.md`: estructura y dependencias por capas.
2. `MOTOR_JUEGO.md`: reglas funcionales del motor.
3. `Agents.md`: normas obligatorias de calidad y contribución.

## Calidad mínima para merge

1. `pnpm lint` en verde.
2. `pnpm test` en verde.
3. `pnpm build` en verde.
4. Tests co-localizados junto al código que validan.
5. Cobertura mínima en lógica de negocio (`core/use-cases`): 80% líneas/funciones/statements y 70% ramas.

## Convenciones clave

1. Código en inglés.
2. Documentación, comentarios y UI en español.
3. Sin `any`.
4. Sin componentes/servicios GOD y límite de 150 líneas por archivo funcional.
