<!-- docs/architecture/01-layers-and-dependencies.md - Define capas, límites y flujo permitido de dependencias. -->
# Capas y Dependencias

## Estructura principal (`src/`)

1. `app/`: rutas App Router y API routes.
2. `components/`: presentación y composición UI.
3. `core/`: dominio (entidades, errores, contratos, reglas y casos de uso).
4. `services/`: orquestación de aplicación y composición de flujos.
5. `infrastructure/`: adaptadores externos (Supabase/in-memory).

## Reglas de dependencia

1. `app/components -> services/use-cases -> core`.
2. `core` no depende de `app` ni de `components`.
3. `infrastructure` implementa interfaces definidas en `core`.
4. La UI no importa SDKs externos de persistencia/autenticación.

## Reglas de diseño activas

1. SRP estricto por módulo.
2. Extracción en subcarpetas internas cuando crece complejidad (`internal/*`).
3. Límite de tamaño por archivo para código productivo y tests.
4. Comentarios/JSDoc de intención en piezas no triviales.
