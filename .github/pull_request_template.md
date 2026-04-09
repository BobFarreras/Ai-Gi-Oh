<!-- .github/pull_request_template.md - Plantilla obligatoria de PR con gates de calidad y evidencia de memoria Engram. -->
## Objetivo de la PR

Describe brevemente objetivo, alcance y resultado técnico.

## Cambios principales

1. ...
2. ...
3. ...

## Qué valida el workflow `quality-gates`

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test` (con cobertura)
4. `pnpm build`
5. `gitleaks` (detección de secretos)

Si alguno falla, la PR queda bloqueada por ruleset.

## Checklist técnico obligatorio

- [ ] SRP respetado (sin módulos GOD).
- [ ] Ningún archivo nuevo supera 150 líneas (o excepción justificada).
- [ ] `pnpm lint` en verde.
- [ ] `pnpm typecheck` en verde.
- [ ] `pnpm test` / cobertura relevante en verde.
- [ ] `pnpm build` en verde.
- [ ] `gitleaks` en verde (sin secretos detectados).
- [ ] Documentación actualizada en español (si aplica).
- [ ] `engram context` ejecutado al iniciar.
- [ ] `engram search` ejecutado para recuperar contexto.
- [ ] `engram save` ejecutado para guardar decisiones/hallazgos.

## Checklist de merge seguro (rulesets)

- [ ] La rama está actualizada con base (`up-to-date`) antes del merge.
- [ ] Checks requeridos en ruleset verificados (`quality / quality` y checks de Vercel definidos por el equipo).

## Si falla `quality`, dónde mirar

1. Abre la pestaña **Checks** de la PR.
2. Entra en el job `quality`.
3. Localiza el paso fallido (`Install dependencies`, `gitleaks` o `Run quality gates`).
4. Corrige en local y valida con `pnpm quality:check`.
5. Haz push de la corrección y espera check verde.

## Evidencia Engram

Rellena los datos para trazabilidad:

- `topic_key`:
- resumen guardado:
- referencia (id/título de memoria):

