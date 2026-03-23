// e2e/support/e2e-credentials.ts - Centraliza credenciales E2E para usuario efímero de onboarding y usuario estándar reusable.
interface IE2ECredentials {
  email: string;
  password: string;
}

const standardEmail = process.env.E2E_STANDARD_EMAIL ?? "a@test.com";
const standardPassword = process.env.E2E_STANDARD_PASSWORD ?? "12345678";

/**
 * Credenciales del usuario persistente para suites de login/market/home/combate.
 */
export function getStandardCredentials(): IE2ECredentials {
  return { email: standardEmail, password: standardPassword };
}

/**
 * Crea credenciales únicas para onboarding sin colisión entre ejecuciones.
 */
export function createEphemeralCredentials(): IE2ECredentials {
  const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  return {
    email: `e2e.onboarding.${runId}@aigi.local`,
    password: `E2E-${Date.now()}`,
  };
}
