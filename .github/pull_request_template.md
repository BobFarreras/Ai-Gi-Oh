<!-- .github/pull_request_template.md - Plantilla obligatoria de PR con gates de calidad y evidencia de memoria Engram. -->
## Resumen

Describe brevemente objetivo, alcance y resultado técnico.

## Cambios principales

1. ...
2. ...
3. ...

## Checklist obligatorio

- [ ] SRP respetado (sin módulos GOD).
- [ ] Ningún archivo nuevo supera 150 líneas (o excepción justificada).
- [ ] `pnpm lint` en verde.
- [ ] `pnpm typecheck` en verde.
- [ ] `pnpm test` / cobertura relevante en verde.
- [ ] `pnpm build` en verde.
- [ ] `gitleaks` en verde (sin secretos detectados).
- [ ] Documentación actualizada en español (si aplica).
- [ ] Engram usado en este PR:
  - [ ] `engram context` ejecutado al iniciar.
  - [ ] `engram search` ejecutado para recuperar contexto.
  - [ ] `engram save` ejecutado para guardar decisiones/hallazgos.

## Checklist de merge seguro (rulesets)

- [ ] La rama está actualizada con base (`up-to-date`) antes del merge.
- [ ] Checks requeridos en ruleset verificados (`quality / quality` y checks de Vercel definidos por el equipo).

## Evidencia Engram

Rellena los datos para trazabilidad:

- `topic_key`:
- resumen guardado:
- referencia (id/título de memoria):

