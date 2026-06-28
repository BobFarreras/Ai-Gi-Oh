-- docs/supabase/sql/076_fix_execution_effect_pricing.sql - Tarifar mágicas por efecto, no por carta.
-- Basado en §5.1 de auditoría de economía (docs/auditoria-economia-cartas.md).
-- Regla: mismo efecto + mismo coste → mismo precio (±0).
begin;

-- HEAL 700 c2: Recovery Patch 250 vs NotebookLLM 450 → unificar a 350 (promedio ponderado)
update public.market_card_listings
set price_nexus = 350, updated_at = now()
where card_id in ('exec-heal-700', 'exec-notebookllm-archive')
  and price_nexus != 350;

commit;
