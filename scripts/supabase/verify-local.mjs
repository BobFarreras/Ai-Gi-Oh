// scripts/supabase/verify-local.mjs - Ejecuta smoke tests de economía e idempotencia contra Supabase local.
import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const ENV_PATH = path.join(process.cwd(), ".env.local.supabase");
const TEST_PASSWORD = "ContributorLocal123!";

/** Lee el entorno generado por el bootstrap sin cargar secretos externos. */
function readLocalEnv() {
  if (!fs.existsSync(ENV_PATH)) throw new Error("Falta .env.local.supabase. Ejecuta pnpm supabase:env:local.");
  return Object.fromEntries(
    fs
      .readFileSync(ENV_PATH, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        return [line.slice(0, separator), line.slice(separator + 1).replace(/^["']|["']$/g, "")];
      }),
  );
}

function assertLocalUrl(url) {
  const hostname = new URL(url).hostname;
  if (hostname !== "127.0.0.1" && hostname !== "localhost") {
    throw new Error("Verificación abortada: NEXT_PUBLIC_SUPABASE_URL no apunta a local.");
  }
}

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
}

/** Verifica compra BUY_ITEM, puntuación comercial e idempotencia del operationId. */
async function verifyBuyItem(apiUrl, anonKey, serviceRoleKey) {
  const admin = createClient(apiUrl, serviceRoleKey, { auth: { persistSession: false } });
  const email = `contributor-${randomUUID()}@local.test`;
  const operationId = randomUUID();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: true,
  });
  if (createError || !created.user) throw createError ?? new Error("No se pudo crear el usuario local.");

  try {
    const userId = created.user.id;
    const { error: walletError } = await admin.from("player_wallets").update({ nexus: 10_000 }).eq("player_id", userId);
    if (walletError) throw walletError;
    const { data: candy, error: candyError } = await admin
      .from("level_candies")
      .select("id, price_nexus")
      .eq("is_active", true)
      .order("levels")
      .limit(1)
      .single();
    if (candyError) throw candyError;

    const player = createClient(apiUrl, anonKey, { auth: { persistSession: false } });
    const { error: signInError } = await player.auth.signInWithPassword({ email, password: TEST_PASSWORD });
    if (signInError) throw signInError;
    const command = { p_candy_id: candy.id, p_operation_id: operationId };
    const firstPurchase = await player.rpc("buy_level_candy", command);
    const repeatedPurchase = await player.rpc("buy_level_candy", command);
    if (firstPurchase.error) throw firstPurchase.error;
    if (repeatedPurchase.error) throw repeatedPurchase.error;

    const [{ data: wallet }, { data: inventory }, { data: rankingRule }, { data: ranking }] = await Promise.all([
      admin.from("player_wallets").select("nexus").eq("player_id", userId).single(),
      admin.from("player_inventory_items").select("quantity").eq("player_id", userId).eq("item_id", candy.id).single(),
      admin.from("weekly_leaderboard_point_rules").select("points").eq("board", "COMMERCIAL").eq("action_type", "BUY_ITEM").single(),
      admin.from("weekly_leaderboard_points").select("points").eq("player_id", userId).eq("board", "COMMERCIAL").single(),
    ]);
    const expectedNexus = 10_000 - candy.price_nexus;
    assertCondition(firstPurchase.data === expectedNexus, "La primera compra no devolvió el saldo esperado.");
    assertCondition(repeatedPurchase.data === expectedNexus, "El reintento idempotente alteró el saldo.");
    assertCondition(wallet?.nexus === expectedNexus, "El reintento cobró Nexus dos veces.");
    assertCondition(inventory?.quantity === 1, "El reintento duplicó el inventario.");
    assertCondition(rankingRule?.points === 10, "BUY_ITEM no tiene la regla comercial esperada.");
    assertCondition(ranking?.points === 10, "El reintento duplicó los puntos comerciales.");
  } finally {
    await admin.auth.admin.deleteUser(created.user.id);
  }
}

async function main() {
  const env = readLocalEnv();
  const apiUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!apiUrl || !anonKey || !serviceRoleKey) throw new Error("El entorno local no contiene las claves requeridas.");
  assertLocalUrl(apiUrl);
  await verifyBuyItem(apiUrl, anonKey, serviceRoleKey);
  console.log("OK: Supabase local valida BUY_ITEM, ranking comercial e idempotencia.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
