<!-- src/core/config/README.md - Catálogo de configuración estática compartida por core y UI. -->
# Módulo de Configuración Core

Configuraciones estáticas de dominio/aplicación.

## Archivos

1. `audio-catalog.ts`
   - Catálogo central de rutas de audio y volumen por evento.
   - Separa canales (`music` y `sfx`).
   - Permite ajustar mezcla sin tocar componentes.

## Reglas

1. Solo datos/configuración, sin efectos secundarios.
2. No meter lógica de negocio compleja.
3. Cambios de claves de evento deben mantenerse compatibles con `useGameAudio`.



