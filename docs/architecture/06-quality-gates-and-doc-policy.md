<!-- docs/architecture/06-quality-gates-and-doc-policy.md - Define gates de calidad y política de mantenimiento documental. -->
# Quality Gates y Política de Documentación

## Gates obligatorios

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm build`

Sin estos cuatro en verde no se considera listo para merge.

## Reglas de mantenibilidad

1. Sin “GOD files”: dividir por submódulos cohesivos.
2. Comentarios y JSDoc de intención en piezas no triviales.
3. Cabecera de ruta+descripción en primera línea de cada archivo.
4. Docs afectadas deben actualizarse en el mismo commit.

## Política para arquitectura

1. `Architecture.md` es índice corto.
2. El detalle vive en `docs/architecture/*`.
3. Cualquier cambio estructural debe reflejar:
   - bloque funcional afectado,
   - dependencias permitidas,
   - criterio de validación técnica.
