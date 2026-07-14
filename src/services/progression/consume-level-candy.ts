// src/services/progression/consume-level-candy.ts - Consume un USB Raro (caramelo de nivel) sobre una carta.
//
// Frontera de seguridad: el cliente SOLO dice qué caramelo y sobre qué carta. La XP que concede el caramelo la
// calcula AQUÍ el servidor a partir del nivel real de la carta (level-candy-rules), y la escritura la hace una
// función SQL transaccional que valida la posesión, descuenta y es idempotente. Si el cliente pudiera mandar la
// XP, se subiría una carta a nivel 100 desde la consola del navegador.
import { ValidationError } from "@/core/errors/ValidationError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { canConsumeCandy, resolveCandyGrant } from "@/core/services/progression/level-candy-rules";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabaseServerClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-server-client";

export interface IConsumeLevelCandyInput {
  candyId: string;
  cardId: string;
  /** Clave de la operación (la genera el cliente): impide que un doble clic gaste dos caramelos. */
  operationId: string;
}

export interface IConsumeLevelCandyResult {
  cardId: string;
  oldLevel: number;
  newLevel: number;
  newXp: number;
  grantedXp: number;
  wastedLevels: number;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function consumeLevelCandy(input: IConsumeLevelCandyInput): Promise<IConsumeLevelCandyResult> {
  if (!UUID_PATTERN.test(input.operationId)) throw new ValidationError("Operación no válida.");
  const session = await getCurrentUserSession();
  if (!session?.user.id) throw new ValidationError("Sesión no válida.");
  const playerId = session.user.id;
  const client = await createSupabaseServerClient();

  // El caramelo dice cuántos niveles da; el precio y la existencia son datos del catálogo, no del cliente.
  const { data: candy } = await client
    .from("level_candies")
    .select("id, levels, is_active")
    .eq("id", input.candyId)
    .maybeSingle();
  if (!candy || candy.is_active !== true) throw new NotFoundError("Ese caramelo no existe.");

  // Nivel/XP REALES de la carta para este jugador (una carta sin progreso empieza a 0).
  const { data: progress } = await client
    .from("player_card_progress")
    .select("level, xp")
    .eq("player_id", playerId)
    .eq("card_id", input.cardId)
    .maybeSingle();
  const currentLevel = progress?.level ?? 0;
  const currentXp = progress?.xp ?? 0;

  if (!canConsumeCandy(currentLevel)) {
    throw new ValidationError("Esta carta ya está al nivel máximo.");
  }

  const grant = resolveCandyGrant(currentLevel, currentXp, candy.levels as number);

  const { error } = await client.rpc("consume_level_candy", {
    p_candy_id: input.candyId,
    p_card_id: input.cardId,
    p_new_level: grant.newLevel,
    p_new_xp: grant.newXp,
    p_operation_id: input.operationId,
  });
  if (error) throw new ValidationError(error.message);

  return {
    cardId: input.cardId,
    oldLevel: currentLevel,
    newLevel: grant.newLevel,
    newXp: grant.newXp,
    grantedXp: grant.grantedXp,
    wastedLevels: grant.wastedLevels,
  };
}
