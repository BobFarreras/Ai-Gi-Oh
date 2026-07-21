// src/components/game/card/internal/CardArtVignette.tsx - Viñeteado interior uniforme para el arte a sangre de magias/trampas.
// El arte se muestra con object-cover y un ligero zoom (sensación de carta viva); este overlay oscurece los
// bordes —sobre todo los laterales— con gradientes en % (escala-invariante: igual en miniatura que en detalle),
// dando la sensación de que la ilustración "sale de la oscuridad". Sin blur ni imagen extra: coste casi nulo.

/**
 * Overlay de sombreado. Se coloca por encima del arte (z-10) y por debajo de la UI (badges, nombre),
 * ocupando toda la zona de arte (absolute inset-0). No captura clics.
 */
export function CardArtVignette() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10"
      style={{
        background: [
          // Bordes laterales oscuros (izquierda/derecha).
          "linear-gradient(90deg, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0) 18%, rgba(0,0,0,0) 82%, rgba(0,0,0,0.82) 100%)",
          // Viñeteado suave alrededor: la imagen emerge del centro hacia la oscuridad.
          "radial-gradient(130% 118% at 50% 42%, rgba(0,0,0,0) 52%, rgba(0,0,0,0.7) 100%)",
        ].join(", "),
      }}
    />
  );
}
