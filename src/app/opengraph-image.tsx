// src/app/opengraph-image.tsx - Imagen social (Open Graph / Twitter) generada dinámicamente a
// 1200x630 con ImageResponse. Es la tarjeta de marca que muestran redes y mensajería al compartir
// el enlace del sitio. Diseño sci-fi cian coherente con la landing (sin imágenes externas ni fuentes
// remotas para que sea robusta en build).
import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE, SITE_URL } from "@/core/constants/site";

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  const domain = SITE_URL.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#010308",
          backgroundImage:
            "radial-gradient(circle at 50% 42%, rgba(6,182,212,0.30), rgba(1,3,8,0) 62%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Marco cian */}
        <div
          style={{
            position: "absolute",
            top: 34,
            left: 34,
            right: 34,
            bottom: 34,
            border: "2px solid rgba(6,182,212,0.35)",
            display: "flex",
          }}
        />

        {/* Chip de estado */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            border: "1px solid rgba(6,182,212,0.5)",
            borderRadius: 999,
            padding: "8px 22px",
            marginBottom: 44,
          }}
        >
          <div
            style={{
              width: 12,
              height: 12,
              borderRadius: 999,
              backgroundColor: "#22d3ee",
              marginRight: 14,
              display: "flex",
            }}
          />
          <div
            style={{
              display: "flex",
              fontSize: 22,
              letterSpacing: 6,
              color: "#a5f3fc",
              fontWeight: 700,
            }}
          >
            SYS · ONLINE
          </div>
        </div>

        {/* Título */}
        <div
          style={{
            display: "flex",
            fontSize: 148,
            fontWeight: 800,
            letterSpacing: -4,
            color: "#eafcff",
            lineHeight: 1,
          }}
        >
          {SITE_NAME}
        </div>

        {/* Subtítulo */}
        <div
          style={{
            display: "flex",
            fontSize: 44,
            fontWeight: 700,
            letterSpacing: 20,
            color: "#22d3ee",
            marginTop: 18,
          }}
        >
          {SITE_TAGLINE.toUpperCase()}
        </div>

        {/* Descriptor */}
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "#8fa3b8",
            marginTop: 46,
            letterSpacing: 2,
          }}
        >
          Juego de cartas estratégico · Duelos 1v1 · Fusiones
        </div>

        {/* Dominio */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            bottom: 58,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 4,
            color: "#22d3ee",
          }}
        >
          {domain}
        </div>
      </div>
    ),
    { ...size },
  );
}
