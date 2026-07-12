# Ranking con selector de tableros (rediseño)

> Rama `feat/community-rankings-batch`. Rediseño de `/hub/ranking`: un único selector anima entre tres
> clasificaciones con transición de posiciones fila a fila.

## Qué cambia

Antes había una única tabla de ELO y un badge/enlace suelto a los rankings semanales. Ahora la página de
ranking tiene un **selector** en la cabecera (donde antes ponía "Ranking") que alterna entre **tres
tableros**, todos con la misma UI de lista de jugadores:

| Tablero | Métrica (valor de la fila) | Extra | Fuente |
|---|---|---|---|
| **Multijugador** | ELO | Liga (color), forma reciente (5), V/D y % | `getRankingData` (ELO de partidas 1v1) |
| **Actividad** | Puntos de la semana | — | tablero `ACTIVITY` de `getWeeklyLeaderboards` |
| **Comercio** | Puntos de la semana | **Nexus gastados** | tablero `COMMERCIAL` de `getWeeklyLeaderboards` |

Los rankings semanales no tienen rachas: en su lugar la fila muestra su **puntuación** (actividad =
combates + misiones/eventos/diarias; comercio = cartas + packs + evoluciones). El **ranking comercial**
añade además una columna con los **Nexus realmente gastados en el mercado esta semana**, calculada al
vuelo sumando `market_transactions.amount_nexus` desde el inicio de la semana (domingo 22:00 UTC) — no
necesita acumulador ni migración; es solo lectura. Ver
[community-rankings-batch-guide.md](community-rankings-batch-guide.md) para las reglas de puntos y el
cierre semanal (domingos 22:00 UTC).

## Arquitectura

- **`services/ranking/get-ranking-boards.ts`** — agrega ELO + semanales en un modelo unificado
  (`IRankingBoard` con filas `IRankingBoardEntry { rank, playerId, nickname, avatarUrl, value, wins?,
  losses?, recentForm? }`). El valor es ELO o puntos según el tablero. Se carga en la página server-side
  (una sola vez; los tres tableros viajan al cliente).
- **`components/hub/ranking/RankingHubClient.tsx`** — orquestador cliente: selector + búsqueda + lista.
  Mantiene el tablero activo en estado; **no remonta** al cambiar (clave para animar).
- **`components/hub/ranking/RankingBoardRow.tsx`** — **una sola fila** para los tres tableros. Al ser el
  mismo componente, framer-motion puede animar a cada jugador entre posiciones al cambiar de tablero. El
  top 3 recibe medalla + glow de podio (reusa `RankingTopAvatar`, `tier.ts`, `PlayerFormDots`).

### Animaciones

1. **Selector**: la píldora activa se desliza entre pestañas con `layoutId="ranking-selector-pill"`.
2. **Transición entre tableros**: la lista está envuelta en `AnimatePresence mode="popLayout"` y cada fila
   lleva `layout` con `key={playerId}`. Al cambiar de tablero:
   - los jugadores presentes en ambos tableros **se deslizan** a su nueva posición (layout),
   - los que solo estaban en el anterior hacen **fade-out** (`exit`),
   - los nuevos entran con **fade-in** (`initial`/`animate`).
   No se usa `layoutId` por fila (cada tablero tiene ids únicos y podría duplicarse durante la transición);
   basta `key` + `layout`.
3. La búsqueda filtra el tablero activo; el reordenado también anima (pop-in/out).

### Rendimiento

- Los tres datasets se cargan una vez (server-side) y se cambian en cliente sin ir al servidor.
- Las filas usan transform/opacity (GPU); el podio reusa glow **estático** (sin animar box-shadow en bucle).
- La cuenta atrás del cierre semanal solo se muestra en los tableros semanales.

## Notas / futuro

- Los componentes antiguos (`RankingClient`, `RankingList`, `RankingRow`, `RankingTopRow`,
  `RankingHeaderBar`, `ranking-equality`) y la página `/hub/ranking/weekly` se **eliminaron** (superseded).
- El CRUD admin de reglas/premios de los rankings semanales sigue pendiente.
- Posible mejora: contador animado del valor al entrar cada fila (count-up).
