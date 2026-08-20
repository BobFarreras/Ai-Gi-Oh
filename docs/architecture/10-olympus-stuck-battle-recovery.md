<!-- docs/architecture/10-olympus-stuck-battle-recovery.md - Decisión de recuperación autoritativa ante divergencias de replay en Olimpo. -->
# ADR 10 — Recuperación de combates bloqueados en Olimpo

## Problema

Un journal final puede ser rechazado si el cliente y el replay autoritativo divergen. Mientras la batalla siga `ISSUED`, reentrar recupera el último checkpoint y puede encerrar al jugador en el mismo combate hasta que caduque.

El caso observado en producción conserva 36 acciones. Ese checkpoint se reproduce correctamente con el snapshot y el perfil MYTHIC de Loki; la divergencia pertenece a la cola final rechazada, que no se persiste. Por ello se conoce la categoría del fallo —un `ATTACK` referencia una entidad ausente en el estado autoritativo—, pero no su primera secuencia exacta.

## Opciones consideradas

1. Ignorar ataques inválidos durante el replay. Se descarta porque permitiría alterar una prueba y obtener una liquidación no reproducible.
2. Borrar estado desde el cliente. Se descarta porque rompería las capas y permitiría manipular intentos.
3. Cerrar mediante un caso de uso autoritativo y la RPC transaccional existente. Es la opción elegida.

## Decisión

`ResetOlympusBattleUseCase` busca exclusivamente la batalla `ISSUED` del jugador y la cierra con `forfeitIssuedBattle`. El intento ya consumido se conserva y no se crea otra batalla automáticamente. La UI vuelve al selector y recarga el allowance desde el servidor.

La ruta aplica autenticación, control de origen y rate limit. El banner explica la consecuencia y bloquea dobles clics mientras se restaura.

## Consecuencias

- El jugador dispone de salida inmediata sin esperar la caducidad.
- No se debilita la validación del journal ni se conceden recompensas inválidas.
- Para identificar la causa determinista restante será necesario conservar telemetría segura de la primera acción rechazada en futuros incidentes.
