-- docs/supabase/sql/075_clean_card_stats_to_grid.sql - Redondear stats de entidades a múltiplos de 50/100.
-- Basado en §7.6 de auditoría de economía (docs/auditoria-economia-cartas.md).
-- Grid de presupuesto ATK+DEF por coste (§4.2):
--   c2=2000, c3=2400, c4=2800, c5=3200, c6=3600, c7(fusión)=~5200
-- Regla: múltiplos de 50/100, sin 1205/1210/1230.
begin;

-- Coste 3 (budget 2400) — 13 cartas
update public.cards_catalog set attack = 1200, defense = 1300, updated_at = now() where id = 'entity-windows92';    -- muro: 1180/1320 → 1200/1300
update public.cards_catalog set attack = 1200, defense = 1200, updated_at = now() where id = 'entity-safari';       -- vanilla: 1200/1140 → 1200/1200
update public.cards_catalog set attack = 1200, defense = 1200, updated_at = now() where id = 'entity-sqlite';      -- vanilla: 1210/1160 → 1200/1200
update public.cards_catalog set attack = 1200, defense = 1200, updated_at = now() where id = 'entity-brave';       -- vanilla: 1210/1120 → 1200/1200
update public.cards_catalog set attack = 1200, defense = 1200, updated_at = now() where id = 'entity-tor';         -- vanilla: 1220/1220 → 1200/1200
update public.cards_catalog set attack = 1200, defense = 1200, updated_at = now() where id = 'entity-javascript';  -- vanilla: 1220/1090 → 1200/1200
update public.cards_catalog set attack = 1250, defense = 1150, updated_at = now() where id = 'entity-firefox';     -- mid: 1230/1130 → 1250/1150
update public.cards_catalog set attack = 1250, defense = 1150, updated_at = now() where id = 'entity-figma';       -- mid: 1240/1120 → 1250/1150
update public.cards_catalog set attack = 1250, defense = 1150, updated_at = now() where id = 'entity-digitalocean';-- mid: 1240/1090 → 1250/1150
update public.cards_catalog set attack = 1250, defense = 1150, updated_at = now() where id = 'entity-strapi';      -- mid: 1240/1100 → 1250/1150
update public.cards_catalog set attack = 1250, defense = 1150, updated_at = now() where id = 'entity-hostinger';  -- mid: 1250/1070 → 1250/1150
update public.cards_catalog set attack = 1250, defense = 1150, updated_at = now() where id = 'entity-edge';        -- mid: 1260/1080 → 1250/1150
update public.cards_catalog set attack = 1250, defense = 1150, updated_at = now() where id = 'entity-svelte';      -- mid: 1270/1060 → 1250/1150

-- Coste 4 (budget 2800) — 19 cartas
update public.cards_catalog set attack = 1450, defense = 1350, updated_at = now() where id = 'entity-avast';       -- muro: 1460/1320 → 1450/1350
update public.cards_catalog set attack = 1500, defense = 1300, updated_at = now() where id = 'entity-mariadb';     -- vanilla: 1470/1260 → 1500/1300
update public.cards_catalog set attack = 1500, defense = 1300, updated_at = now() where id = 'entity-cloudflare';  -- vanilla: 1480/1240 → 1500/1300
update public.cards_catalog set attack = 1500, defense = 1300, updated_at = now() where id = 'entity-windows11';   -- vanilla: 1490/1210 → 1500/1300
update public.cards_catalog set attack = 1500, defense = 1300, updated_at = now() where id = 'entity-docker';      -- vanilla: 1490/1200 → 1500/1300
update public.cards_catalog set attack = 1500, defense = 1300, updated_at = now() where id = 'entity-midjourney';  -- vanilla: 1490/1160 → 1500/1300
update public.cards_catalog set attack = 1500, defense = 1300, updated_at = now() where id = 'entity-nuxtjs';      -- vanilla: 1500/1120 → 1500/1300
update public.cards_catalog set attack = 1500, defense = 1300, updated_at = now() where id = 'entity-nexus';       -- vanilla: 1500/1220 → 1500/1300
update public.cards_catalog set attack = 1500, defense = 1300, updated_at = now() where id = 'entity-vue';         -- vanilla: 1510/1140 → 1500/1300
update public.cards_catalog set attack = 1500, defense = 1300, updated_at = now() where id = 'entity-csharp';      -- vanilla: 1520/1180 → 1500/1300
update public.cards_catalog set attack = 1500, defense = 1300, updated_at = now() where id = 'entity-unity';       -- vanilla: 1520/1130 → 1500/1300
update public.cards_catalog set attack = 1500, defense = 1300, updated_at = now() where id = 'entity-mongodb';     -- vanilla: 1530/1150 → 1500/1300
update public.cards_catalog set attack = 1550, defense = 1250, updated_at = now() where id = 'entity-linux';       -- mid: 1540/1230 → 1550/1250
update public.cards_catalog set attack = 1550, defense = 1250, updated_at = now() where id = 'entity-typescript';  -- mid: 1540/1170 → 1550/1250
update public.cards_catalog set attack = 1550, defense = 1250, updated_at = now() where id = 'entity-kotlin';      -- mid: 1560/1160 → 1550/1250
update public.cards_catalog set attack = 1550, defense = 1250, updated_at = now() where id = 'entity-chrome';      -- mid: 1560/1110 → 1550/1250
update public.cards_catalog set attack = 1550, defense = 1250, updated_at = now() where id = 'entity-flutter';     -- mid: 1570/1130 → 1550/1250
update public.cards_catalog set attack = 1600, defense = 1200, updated_at = now() where id = 'entity-hydra';       -- aggro: 1580/1180 → 1600/1200

-- Coste 5 (budget 3200) — 5 cartas
update public.cards_catalog set attack = 1900, defense = 1300, updated_at = now() where id = 'entity-kubernetes';   -- 1860/1410 → 1900/1300
update public.cards_catalog set attack = 1900, defense = 1300, updated_at = now() where id = 'entity-unreal-engine';-- 1880/1280 → 1900/1300
update public.cards_catalog set attack = 1900, defense = 1300, updated_at = now() where id = 'entity-cpp';          -- 1890/1310 → 1900/1300
update public.cards_catalog set attack = 1900, defense = 1300, updated_at = now() where id = 'entity-apple';        -- 1900/1390 → 1900/1300
update public.cards_catalog set attack = 1900, defense = 1300, updated_at = now() where id = 'entity-rust';         -- 1900/1340 → 1900/1300

commit;
