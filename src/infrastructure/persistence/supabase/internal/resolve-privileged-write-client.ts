// src/infrastructure/persistence/supabase/internal/resolve-privileged-write-client.ts - Cliente con el que se
// ESCRIBEN las tablas de valor (cartera, colección, progresión).
//
// Por qué existe: esas tablas se escribían con el cliente de la SESIÓN del jugador, lo que obligaba a darle a
// `authenticated` permiso de UPDATE sobre su propia fila. Y una fila propia que puedes actualizar es una fila
// que puedes falsificar: cualquiera podía ponerse los Nexus que quisiera, regalarse cartas o subirse la
// progresión con un PATCH directo a la API REST desde la consola del navegador.
//
// Con esto, la escritura va SIEMPRE con service-role desde el servidor, y la base de datos puede prohibirle al
// jugador escribir sus propias filas. La identidad no se pierde: todos los métodos reciben el `playerId`, que
// los llamadores sacan de la sesión (nunca del cuerpo de la petición).
//
// El cliente se crea PEREZOSAMENTE, en la primera escritura: así los repositorios se pueden seguir construyendo
// (y usar para leer) en entornos sin la clave de service-role, como los tests.
import { SupabaseClient } from "@supabase/supabase-js";
import { createSupabaseServiceRoleClient } from "@/infrastructure/persistence/supabase/internal/create-supabase-service-role-client";

export function createPrivilegedWriteClientResolver(): () => SupabaseClient {
  let cached: SupabaseClient | null = null;
  return () => {
    cached ??= createSupabaseServiceRoleClient();
    return cached;
  };
}
