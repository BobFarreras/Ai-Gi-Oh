// src/components/hub/academy/scene/internal/academy-hologram-material.ts
// Material shader del holograma de Academy: proyecta una textura 2D (imagen intro) con look
// holográfico — tinte cian, líneas de escaneo animadas, banda de barrido vertical y realce en hover.
// Se instancia con `new AcademyHologramMaterial()` y se actualiza por frame; NO usa JSX intrínseco
// (evita augmentación de tipos de R3F) — se pasa como `material={...}` a un <mesh>.
import { shaderMaterial } from "@react-three/drei";
import { extend, type ThreeElement } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Uniforms:
 * - uTime: tiempo acumulado (segundos) para animar scan lines y barrido.
 * - uMap: textura de la imagen a proyectar (cara del personaje/carta).
 * - uTint: color del tinte holográfico (cian).
 * - uOpacity: opacidad base del holograma.
 * - uScanIntensity: intensidad de las líneas de escaneo.
 * - uGlow: realce 0..1 interpolado hacia 1 en hover/selección.
 */
export const AcademyHologramMaterial = shaderMaterial(
  {
    uTime: 0,
    uMap: null as THREE.Texture | null,
    uTint: new THREE.Color("#a7f3ff"),
    uOpacity: 0.97,
    uScanIntensity: 0.08,
    uGlow: 0,
    // 1 = aplica máscara de carta (recorta el margen oscuro y redondea esquinas) para la baraja.
    uCardMask: 0,
    // 1 = recorta el fondo BLANCO/claro de la imagen (chroma-key) para imágenes sin canal alfa
    // (p. ej. el nodo de Documentación es un servidor sobre fondo blanco): deja solo la silueta.
    uChromaWhite: 0,
    // Umbrales del chroma-key. Los valores por defecto son los históricos del nodo de Documentación.
    // Una imagen con blancos PROPIOS (mármol, nubes, nieve) necesita un corte casi puro, o el shader
    // se come el objeto además del fondo.
    uChromaBright: 0.8,
    uChromaSat: 0.15,
  },
  /* glsl - vertex */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  /* glsl - fragment */ `
    uniform float uTime;
    uniform sampler2D uMap;
    uniform vec3 uTint;
    uniform float uOpacity;
    uniform float uScanIntensity;
    uniform float uGlow;
    uniform float uCardMask;
    uniform float uChromaWhite;
    uniform float uChromaBright;
    uniform float uChromaSat;
    varying vec2 vUv;

    void main() {
      vec4 tex = texture2D(uMap, vUv);
      // Recorta el fondo transparente de la imagen intro para dejar solo la silueta.
      if (tex.a < 0.02) discard;

      // Chroma-key de fondo blanco (imágenes sin canal alfa): descarta los píxeles casi blancos/grises
      // claros (alta luminancia + baja saturación), dejando solo el objeto de color/oscuro.
      if (uChromaWhite > 0.5) {
        float mx = max(max(tex.r, tex.g), tex.b);
        float mn = min(min(tex.r, tex.g), tex.b);
        float sat = mx > 0.001 ? (mx - mn) / mx : 0.0;
        float bright = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
        if (bright > uChromaBright && sat < uChromaSat) discard;
      }

      // Máscara de carta (baraja): recorta el margen oscuro exterior de la imagen y redondea las
      // esquinas, para que se vea SOLO la carta y no un rectángulo con borde.
      if (uCardMask > 0.5) {
        float inset = 0.05;
        if (vUv.x < inset || vUv.x > 1.0 - inset || vUv.y < inset || vUv.y > 1.0 - inset) discard;
        vec2 c = (vUv - inset) / (1.0 - 2.0 * inset); // 0..1 dentro del recorte
        vec2 pc = abs(c - 0.5) * 2.0;                 // 0 centro → 1 borde
        float rr = 0.16;
        vec2 q = pc - (1.0 - rr);
        if (length(max(q, 0.0)) - rr > 0.0) discard;  // fuera de las esquinas redondeadas
      }

      // Versión holográfica (teñido cian) de la imagen.
      float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
      vec3 holoColor = uTint * (0.35 + luma * 0.85) + tex.rgb * 0.42;

      // Efecto holográfico: más marcado en reposo y se REDUCE al pasar el ratón (uGlow 0→1),
      // revelando mejor el arte original al hacer hover.
      float effect = mix(0.42, 0.18, uGlow);
      vec3 rgb = mix(tex.rgb, holoColor, effect);

      // Líneas de escaneo que recorren siempre; se atenúan un poco en hover.
      float scan = sin((vUv.y * 200.0) - uTime * 1.6);
      scan = smoothstep(0.55, 1.0, scan);
      rgb += uTint * scan * uScanIntensity * (1.0 - 0.5 * uGlow);

      // Alfa = la de la imagen (silueta completa visible); el desvanecido "de luz que se pierde"
      // lo aporta el haz de luz de detrás, no recortamos el cuerpo del personaje.
      float alpha = tex.a * uOpacity;
      gl_FragColor = vec4(rgb, alpha);
    }
  `,
);

// Tipo de instancia del material (para tipar refs y accesos a uniforms como propiedades).
export type AcademyHologramMaterialImpl = InstanceType<typeof AcademyHologramMaterial>;

// Registra el material como elemento JSX intrínseco `<academyHologramMaterial />`.
extend({ AcademyHologramMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    academyHologramMaterial: ThreeElement<typeof AcademyHologramMaterial>;
  }
}
