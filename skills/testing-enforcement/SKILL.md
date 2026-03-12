<!-- skills/testing-enforcement/SKILL.md - Protocolo para asegurar TDD, cobertura y calidad de pruebas en cambios de comportamiento. -->
---
name: testing-enforcement
description: Úsala cuando se implemente o refactorice comportamiento para garantizar TDD, cobertura mínima y gates de calidad.
---

# Ejecución estricta de testing

## Cuándo usar esta skill
Aplicar en cualquier cambio que altere comportamiento de dominio, casos de uso, servicios, componentes interactivos o contratos de datos.

## Flujo TDD esperado
1. Red: escribir test que falle por comportamiento esperado.
2. Green: implementar la mínima solución correcta.
3. Refactor: mejorar diseño sin romper el test.

## Reglas de calidad de pruebas
- Co-locación obligatoria: `*.test.ts` y `*.test.tsx` junto al archivo validado.
- Priorizar queries semánticas en UI: `getByRole`, `getByLabelText`, `getByText`.
- Prohibido cerrar tarea con comportamiento nuevo sin tests.
- Cobertura objetivo: mínimo 80% en casos de uso y servicios críticos.

## Comandos de verificación (bloqueantes)
```bash
pnpm lint
pnpm test
pnpm build
```

## Criterios de salida
- Sin warnings nuevos de ESLint.
- Test nuevos cubren escenario feliz y al menos un caso de error/regresión.
- Cambios de contratos o arquitectura reflejados en documentación.

## Integración con Engram
- Guardar memoria en bugfixes y decisiones de testing con `mem_save`.
- Incluir en la memoria qué test detectó el problema y cómo se validó la corrección.
