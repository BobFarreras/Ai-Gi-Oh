<!-- src/core/errors/README.md - Contrato de errores tipados del dominio y aplicación. -->
# Módulo de Errores Core

Jerarquía de errores tipados para reglas de dominio y validaciones.

## Archivos

1. `AppError.ts`
   - Error base de la aplicación con `code` tipado.

2. `ErrorCode.ts`
   - Catálogo de códigos de error.

3. `ValidationError.ts`
   - Violaciones de validación de entrada/estado.

4. `GameRuleError.ts`
   - Violaciones de reglas del juego (fase, turno, acciones inválidas).

5. `NotFoundError.ts`
   - Recursos de dominio no encontrados (carta/entidad/objetivo).

6. `isAppError.ts`
   - Type guard para manejar errores de forma segura.

7. `AppError.test.ts`
   - Pruebas unitarias de contrato de errores base.

## Guía de uso

1. Casos de uso deben lanzar errores tipados (no `Error` genérico).
2. UI transforma esos errores a mensajes amigables.
3. Evitar `console.log` para manejo de errores funcionales.



