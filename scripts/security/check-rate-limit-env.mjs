// scripts/security/check-rate-limit-env.mjs - Valida configuración de rate limiting por entorno antes de desplegar.
import fs from "node:fs";
import path from "node:path";

function parseEnvContent(content) {
  const result = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex < 1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    result[key] = value;
  }
  return result;
}

function loadEnvFileIfProvided(envFile) {
  if (!envFile) return;
  const absolutePath = path.isAbsolute(envFile) ? envFile : path.join(process.cwd(), envFile);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`No se encontró el archivo de entorno: ${absolutePath}`);
  }
  const parsed = parseEnvContent(fs.readFileSync(absolutePath, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    if (!process.env[key]) process.env[key] = value;
  }
}

function parseArguments() {
  const options = {
    target: "generic",
    envFile: null,
  };
  for (const argument of process.argv.slice(2)) {
    if (argument.startsWith("--target=")) {
      options.target = argument.slice("--target=".length).trim().toLowerCase();
      continue;
    }
    if (argument.startsWith("--env-file=")) {
      options.envFile = argument.slice("--env-file=".length).trim();
      continue;
    }
  }
  return options;
}

function isTrue(value) {
  return value?.trim().toLowerCase() === "true";
}

function validateTimeout(errors, warnings) {
  const rawValue = process.env.SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS;
  if (!rawValue) {
    warnings.push("No se definió SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS (se aplicará default interno 1200ms).");
    return;
  }
  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue)) {
    errors.push("SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS debe ser numérico.");
    return;
  }
  if (parsedValue < 200 || parsedValue > 5000) {
    errors.push("SECURITY_RATE_LIMIT_DISTRIBUTED_TIMEOUT_MS debe estar entre 200 y 5000.");
  }
}

function validateBaseConsistency(errors, warnings) {
  const authRequireDistributed = isTrue(process.env.AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED);
  const authFailClosed = isTrue(process.env.AUTH_RATE_LIMIT_FAIL_CLOSED);
  const adminRequireDistributed = isTrue(process.env.ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED);
  const adminFailClosed = isTrue(process.env.ADMIN_RATE_LIMIT_FAIL_CLOSED);
  const hasUrl = Boolean(process.env.UPSTASH_REDIS_REST_URL?.trim());
  const hasToken = Boolean(process.env.UPSTASH_REDIS_REST_TOKEN?.trim());

  if ((authRequireDistributed || authFailClosed || adminRequireDistributed || adminFailClosed) && (!hasUrl || !hasToken)) {
    errors.push("Modo estricto activado pero faltan UPSTASH_REDIS_REST_URL y/o UPSTASH_REDIS_REST_TOKEN.");
  }

  if (authFailClosed && !authRequireDistributed) {
    warnings.push("AUTH_RATE_LIMIT_FAIL_CLOSED=true sin AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED=true reduce consistencia de política.");
  }
  if (adminFailClosed && !adminRequireDistributed) {
    warnings.push("ADMIN_RATE_LIMIT_FAIL_CLOSED=true sin ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED=true reduce consistencia de política.");
  }
}

function validateTargetPolicy(target, errors, warnings) {
  const authRequireDistributed = isTrue(process.env.AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED);
  const authFailClosed = isTrue(process.env.AUTH_RATE_LIMIT_FAIL_CLOSED);
  const adminRequireDistributed = isTrue(process.env.ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED);
  const adminFailClosed = isTrue(process.env.ADMIN_RATE_LIMIT_FAIL_CLOSED);

  if (target === "staging") {
    if (!authRequireDistributed) errors.push("Staging requiere AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED=true.");
    if (authFailClosed) warnings.push("En staging se recomienda AUTH_RATE_LIMIT_FAIL_CLOSED=false para reducir fricción durante validación.");
    if (!adminRequireDistributed) errors.push("Staging requiere ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED=true.");
    if (!adminFailClosed) errors.push("Staging requiere ADMIN_RATE_LIMIT_FAIL_CLOSED=true.");
  }

  if (target === "production") {
    if (!authRequireDistributed) errors.push("Producción requiere AUTH_RATE_LIMIT_REQUIRE_DISTRIBUTED=true.");
    if (!authFailClosed) errors.push("Producción requiere AUTH_RATE_LIMIT_FAIL_CLOSED=true.");
    if (!adminRequireDistributed) errors.push("Producción requiere ADMIN_RATE_LIMIT_REQUIRE_DISTRIBUTED=true.");
    if (!adminFailClosed) errors.push("Producción requiere ADMIN_RATE_LIMIT_FAIL_CLOSED=true.");
  }
}

function printMessages(errors, warnings) {
  if (warnings.length > 0) {
    console.warn("Advertencias de configuración:");
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }
  if (errors.length > 0) {
    console.error("Errores de configuración:");
    for (const error of errors) {
      console.error(`- ${error}`);
    }
  }
}

function main() {
  const options = parseArguments();
  loadEnvFileIfProvided(options.envFile);
  const errors = [];
  const warnings = [];

  validateTimeout(errors, warnings);
  validateBaseConsistency(errors, warnings);
  validateTargetPolicy(options.target, errors, warnings);
  printMessages(errors, warnings);

  if (errors.length > 0) process.exit(1);
  console.log(`Configuración de rate limiting válida para target "${options.target}".`);
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : "Error desconocido.";
  console.error(`Fallo validando configuración de rate limiting: ${message}`);
  process.exit(1);
}
