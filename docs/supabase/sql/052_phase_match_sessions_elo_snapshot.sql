-- docs/supabase/sql/052_phase_match_sessions_elo_snapshot.sql
-- Persiste el ELO antes/después de cada jugador en match_sessions al cerrar la
-- partida. Soluciona el bug "0 → 1185" en el overlay del perdedor: cuando el
-- ganador llama a /finish primero, el perdedor va por el path idempotente que
-- antes devolvía { old: currentElo, new: currentElo } (delta 0). Ahora lee el
-- snapshot guardado por el primer llamador y muestra el delta real (-15 → 1185).

alter table public.match_sessions
  add column if not exists elo_before_a int,
  add column if not exists elo_after_a  int,
  add column if not exists elo_before_b int,
  add column if not exists elo_after_b  int;
