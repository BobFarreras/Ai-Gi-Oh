// scripts/supabase/make-admin.mjs - Concede acceso admin a un usuario en la BD LOCAL (contribuidores).
//
// El panel admin exige que tu user_id esté en la tabla `admin_users` (whitelist). Por seguridad, la
// app NO deja que un usuario se auto-conceda ese acceso (RLS: solo el service_role escribe ahí). Este
// script usa la service-role key de tu entorno local para hacerlo por ti, sin SQL manual.
//
// Uso:
//   1) Regístrate primero en la app (/register) para crear tu usuario.
//   2) pnpm db:make-admin --email=tu@email.com     (o sin --email si solo hay un usuario)
//      Rol por defecto SUPER_ADMIN; cámbialo con --role=ADMIN.
//
// Seguridad: aborta si la URL no es local (127.0.0.1/localhost) salvo que pases --force.
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

// Carga de .env* (sin dependencias) para correr standalone. .env.local.supabase lo genera el bootstrap.
for (const envFile of [".env.local", ".env.local.supabase", ".env"]) {
  const envPath = path.join(process.cwd(), envFile);
  if (!fs.existsSync(envPath)) continue;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const value = match[2].replace(/^["']|["']$/g, "");
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}

const args = process.argv.slice(2);
const getArg = (name) => {
  const hit = args.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.split("=").slice(1).join("=").trim() : "";
};
const emailArg = getArg("email");
const role = (getArg("role") || "SUPER_ADMIN").toUpperCase();
const force = args.includes("--force");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const slug = process.env.ADMIN_PORTAL_SLUG || "control-room";

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

if (!url || !key) {
  fail(
    "Faltan credenciales locales (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).\n" +
      "   Corre el setup y aplica el env: pnpm supabase:bootstrap:local && pnpm supabase:env:apply",
  );
}
if (!["ADMIN", "SUPER_ADMIN"].includes(role)) fail(`Rol inválido: ${role}. Usa ADMIN o SUPER_ADMIN.`);
const isLocal = /127\.0\.0\.1|localhost/.test(url);
if (!isLocal && !force) {
  fail(`La URL de Supabase no parece local (${url}).\n   Este script es para desarrollo. Si es intencionado, repite con --force.`);
}

const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUser() {
  // El service_role puede listar usuarios de auth. Local tiene pocos: una página basta.
  const { data, error } = await client.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) fail(`No se pudieron listar los usuarios: ${error.message}`);
  const users = data.users ?? [];
  if (users.length === 0) fail("No hay ningún usuario. Regístrate primero en la app (/register).");
  if (emailArg) {
    const found = users.find((u) => (u.email ?? "").toLowerCase() === emailArg.toLowerCase());
    if (!found) fail(`No existe ningún usuario con email '${emailArg}'. ¿Te registraste con ese correo?`);
    return found;
  }
  if (users.length === 1) return users[0];
  const emails = users.map((u) => u.email).filter(Boolean).join(", ");
  fail(`Hay varios usuarios; indica cuál con --email=. Disponibles: ${emails}`);
}

async function main() {
  const user = await findUser();
  const { error } = await client
    .from("admin_users")
    .upsert({ user_id: user.id, role, is_active: true }, { onConflict: "user_id" });
  if (error) fail(`No se pudo conceder acceso admin: ${error.message}`);

  const portalPath = `/admin-portal/${slug}`;
  console.log(`\n✅ Acceso admin concedido a ${user.email} (rol ${role}).`);
  console.log(`   Entra en el panel: /admin  (redirige a ${portalPath})`);
  console.log(`   Si no estás logueado, primero inicia sesión en /login.\n`);
}

main().catch((error) => fail(error?.message ?? "Error desconocido"));
