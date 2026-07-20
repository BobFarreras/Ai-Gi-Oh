<!-- docs/features/seo-implementation-guide.md - Guía de implementación: mejorar indexing y ranking en Google para AI-GI-OH. -->
# SEO para AI-GI-OH — Guía de Implementación

> Análisis de problemas de indexing en Google Search Console y plan de acción para mejorar la visibilidad en búsquedas.

---

## 0. Diagnóstico Actual

### Problemas detectados en Google Search Console

| Métrica | Valor | Problema |
|---------|-------|----------|
| Páginas indexadas | 3 de muchas | Google no puede crawlear el contenido |
| Razón principal | "Página con redirecció" | Middleware redirige crawlers autenticados |
| Impressions | Casi 0 | Poco contenido indexable |

### Causas raíz

1. **Landing page es 100% client-rendered** (`"use client"`) — crawlers pueden no llegar al contenido SEO
2. **Middleware redirige `/` a `/hub`** si detecta sesión — Googlebot puede obtener cookies
3. **Sitemap solo tiene 3 rutas** (`/`, `/register`, `/login`) — muy poco contenido indexable
4. **Contenido principal detrás de auth** — Google no puede indexar `/hub/*`

---

## 1. Solución A: Server Component para Landing Page (CRÍTICO)

### Problema

La landing page (`src/app/page.tsx`) es un `"use client"` con 3 fases:
- TERMINAL → NARRATIVE → SHOWCASE

El contenido SEO (h1, CTAs, descripción) solo aparece en **SHOWCASE**. Los crawlers pueden quedar atrapados en fases anteriores.

### Solución

Convertir a **Server Component** con contenido SEO renderizado en servidor, y parte interactiva hidratada en cliente.

### Implementación

#### Paso 1: Separar contenido SEO del componente interactivo

```typescript
// src/app/page.tsx (NUEVO - Server Component)
import type { Metadata } from "next";
import { LandingInteractive } from "@/components/landing/LandingInteractive";

export const metadata: Metadata = {
  title: "AI-GI-OH - The AGI Wars | Juego de Cartas Coleccionables Online",
  description: "Juego de cartas coleccionables online gratuito. Combina estrategia, inteligencia artificial y coleccionismo digital. Regístrate gratis y compila tu mazo.",
  openGraph: {
    title: "AI-GI-OH - The AGI Wars",
    description: "Juego de cartas coleccionables online gratuito con IA.",
    url: "https://ai-gi-oh.es",
    siteName: "AI-GI-OH",
    locale: "es_ES",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <>
      {/* Contenido SEO renderizado en servidor - siempre visible para crawlers */}
      <section className="sr-only">
        <h1>AI-GI-OH - The AGI Wars</h1>
        <p>
          Juego de cartas coleccionables online gratuito. Combina estrategia,
          inteligencia artificial y coleccionismo digital.
        </p>
        <p>
          Regístrate gratis y compila tu mazo. Historia inmersiva, combates
          PvE y PvP, sistema de progresión con árbol de habilidades.
        </p>
        <nav>
          <a href="/register">Registrarse Gratis</a>
          <a href="/login">Iniciar Sesión</a>
        </nav>
      </section>

      {/* Componente interactivo - solo se muestra en cliente */}
      <LandingInteractive />
    </>
  );
}
```

#### Paso 2: Extraer la lógica interactiva a un componente cliente

```typescript
// src/components/landing/LandingInteractive.tsx (NUEVO - "use client")
"use client";

import { useState, useEffect } from "react";
import { TerminalPrompt } from "./TerminalPrompt";
import { CrawlText } from "./CrawlText";
import { HeroCards } from "./HeroCards";
import { CommunityLinks } from "./CommunityLinks";
import { CyberBackground } from "./CyberBackground";

type LandingPhase = "TERMINAL" | "NARRATIVE" | "SHOWCASE";

export function LandingInteractive() {
  const [phase, setPhase] = useState<LandingPhase>("TERMINAL");
  const [accessCode, setAccessCode] = useState("");

  useEffect(() => {
    const seen = localStorage.getItem("landing-intro-seen");
    if (seen) setPhase("SHOWCASE");
  }, []);

  const handleTerminalComplete = (code: string) => {
    setAccessCode(code);
    setPhase("NARRATIVE");
  };

  const handleSkip = () => {
    localStorage.setItem("landing-intro-seen", "true");
    setPhase("SHOWCASE");
  };

  return (
    <div className="relative min-h-screen">
      <CyberBackground />

      {phase === "TERMINAL" && (
        <TerminalPrompt onComplete={handleTerminalComplete} />
      )}

      {phase === "NARRATIVE" && (
        <CrawlText accessCode={accessCode} onSkip={handleSkip} />
      )}

      {phase === "SHOWCASE" && (
        <>
          <HeroCards />
          <CommunityLinks />
          {/* CTAs */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
            <a href="/register" className="...">Compilar ID</a>
            <a href="/login" className="...">Conexion Red</a>
          </div>
        </>
      )}
    </div>
  );
}
```

#### Paso 3: Añadir `<noscript>` como fallback

```typescript
// En page.tsx, después del componente interactivo
<noscript>
  <div className="flex min-h-screen items-center justify-center bg-[#010308] text-white">
    <div className="max-w-2xl px-6 text-center">
      <h1 className="mb-4 text-4xl font-bold text-cyan-400">AI-GI-OH</h1>
      <h2 className="mb-8 text-2xl text-cyan-600">The AGI Wars</h2>
      <p className="mb-8 text-lg">
        Juego de cartas coleccionables online gratuito.
        Combina estrategia, inteligencia artificial y coleccionismo digital.
      </p>
      <div className="flex justify-center gap-4">
        <a href="/register" className="px-6 py-3 bg-cyan-500 text-black font-bold">
          Registrarse Gratis
        </a>
        <a href="/login" className="px-6 py-3 border border-cyan-500 text-cyan-400 font-bold">
          Iniciar Sesión
        </a>
      </div>
    </div>
  </div>
</noscript>
```

### Resultado

| Antes | Después |
|-------|---------|
| Crawlers ven fase TERMINAL (nada de SEO) | Crawlers ven h1, descripción, CTAs inmediatamente |
| Googlebot necesita ejecutar JS complejo | Contenido estático en HTML, JS es enhancement |
| Posible contenido oculto | `<noscript>` como garantía |

---

## 2. Solución B: Excluir Crawlers de la Redirección de Sesión (CRÍTICO)

### Problema

En `middleware.ts` línea 40-41:
```typescript
if (path === "/" && user) {
  return NextResponse.redirect(new URL("/hub", request.url));
}
```

Si Googlebot obtiene una cookie de sesión (posible tras crawlear `/login`), es redirigido a `/hub` que es **noindex**. Google ve "Page with redirect".

### Solución

Detectar User-Agent de crawlers y NO redirigirlos aunque tengan sesión.

### Implementación

```typescript
// middleware.ts (MODIFICAR)

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Lista de User-Agents de crawlers conocidos
const CRAWLER_USER_AGENTS = [
  "googlebot",
  "bingbot",
  "slurp",        // Yahoo
  "duckduckbot",
  "baiduspider",
  "yandexbot",
  "applebot",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "whatsapp",
  "telegrambot",
];

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const lower = userAgent.toLowerCase();
  return CRAWLER_USER_AGENTS.some((ua) => lower.includes(ua));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  // Solo verificar GET requests (excepto Server Actions)
  if (request.method === "GET") {
    const actionHeader = request.headers.get("next-action");
    if (!actionHeader) {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) =>
                request.cookies.set(name, value)
              );
              supabaseResponse = NextResponse.next({ request });
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            },
          },
        }
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const userAgent = request.headers.get("user-agent");
      const crawler = isCrawler(userAgent);

      // Guard 1: Proteger rutas privadas
      if (pathname.startsWith("/hub") || pathname.startsWith("/admin") || pathname.startsWith("/admin-portal")) {
        if (!user) {
          const url = request.nextUrl.clone();
          url.pathname = "/login";
          return NextResponse.redirect(url);
        }
      }

      // Guard 2: Redirect solo para USUARIOS REALES (no crawlers)
      if (pathname === "/" && user && !crawler) {
        const url = request.nextUrl.clone();
        url.pathname = "/hub";
        return NextResponse.redirect(url);
      }

      // Crawlers en "/" ven el contenido normalmente (no se redirigen)
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/", "/hub/:path*", "/admin/:path*", "/admin-portal/:path*"],
};
```

### Resultado

| Antes | Después |
|-------|---------|
| Googlebot con sesión → redirigido a `/hub` | Googlebot en `/` → ve contenido de landing |
| "Page with redirect" en Search Console | Página correctamente indexada |
| Crawlers confundidos | Crawlers siempre ven `/` |

---

## 3. Solución C: Canonical URLs Explícitas (RECOMENDADO)

### Problema

No hay `canonical` URLs globales. Google puede confundir páginas similares (`/login` vs `/register`) como contenido duplicado.

### Solución

Añadir `canonical` explícito a todas las páginas públicas.

### Implementación

#### En el root layout (global):

```typescript
// src/app/layout.tsx (MODIFICAR)

import type { Metadata } from "next";
import { SITE_URL, SITE_NAME, SITE_TITLE, SITE_DESCRIPTION, SITE_LOCALE, SITE_CREATOR } from "@/core/constants/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  // ... resto de metadata existente ...
  
  // NO añadir canonical global - cada página define el suyo
};
```

#### En cada página pública:

```typescript
// src/app/page.tsx
export const metadata: Metadata = {
  title: "AI-GI-OH - The AGI Wars",
  alternates: {
    canonical: "/",  // Se resuelve contra metadataBase
  },
};

// src/app/(auth)/login/page.tsx
export const metadata: Metadata = {
  title: "Iniciar Sesión",
  alternates: {
    canonical: "/login",
  },
};

// src/app/(auth)/register/page.tsx
export const metadata: Metadata = {
  title: "Registrarse",
  alternates: {
    canonical: "/register",
  },
};
```

### Resultado

| Antes | Después |
|-------|---------|
| Google puede confundir `/login` y `/register` | Cada página tiene canonical explícito |
| Posible contenido duplicado | Google sabe cuál es la URL canónica |

---

## 4. ¿Esto Mejorará el Ranking?

### Respuesta corta: **Sí, pero con matices**

### Lo que ESTAS soluciones resuelven:

| Problema | Solución | Impacto |
|----------|----------|---------|
| Landing no indexable | Server Component | ✅ Alto - Google puede crawlear |
| Redirección de crawlers | Excluir bots del redirect | ✅ Alto - Elimina "Page with redirect" |
| Pocas páginas en sitemap | (No resuelto aquí) | ⚠️ Medio |
| Sin canonical | Canonical URLs | ✅ Bajo-Medio - Evita duplicados |

### Lo que ESTAS soluciones NO resuelven:

| Problema | Solución necesaria |
|----------|-------------------|
| Contenido detrás de auth | Crear páginas públicas (blog, guías, FAQ) |
| Poca autoridad de dominio | Link building, PR, community |
| Competencia fuerte | Diferenciación, nicho |

---

## 5. Estrategia SEO Completa para un Juego

### Nivel 1: Técnico (lo que hacemos aquí)

| Acción | Prioridad | Impacto |
|--------|-----------|---------|
| Server Component para landing | 🔴 Crítico | Alto |
| Excluir crawlers de redirect | 🔴 Crítico | Alto |
| Canonical URLs | 🟡 Medio | Bajo-Medio |
| Sitemap completo | 🟡 Medio | Medio |
| Page speed optimization | 🟡 Medio | Medio |

### Nivel 2: Contenido (recomendado)

| Acción | Prioridad | Impacto |
|--------|-----------|---------|
| Blog con guías de juego | 🟡 Medio | Alto |
| FAQ / Preguntas frecuentes | 🟡 Medio | Medio |
| Guías de estrategia | 🟢 Bajo | Alto |
| Lore / Historia del juego | 🟢 Bajo | Medio |
| Patch notes / Changelog | 🟢 Bajo | Bajo |

### Nivel 3: Off-page (largo plazo)

| Acción | Prioridad | Impacto |
|--------|-----------|---------|
| Community building (Discord) | 🟡 Medio | Alto |
| Influencer marketing | 🟡 Medio | Alto |
| Press coverage | 🟢 Bajo | Alto |
| Link building | 🟢 Bajo | Medio |
| Social media presence | 🟡 Medio | Medio |

---

## 6. Realismo: SEO para un Juego Browser

### Desafíos únicos

1. **Contenido dinámico**: Los juegos generan contenido que cambia constantemente (rankings, eventos, etc.) - difícil de indexar
2. **Detrás de auth**: El contenido principal (combates, mazos, colección) no es indexable
3. **Competencia**: Duelos Masters, Hearthstone, etc. tienen años de autoridad de dominio
4. **Búsqueda de marca**: La mayoría de tráfico será por nombre de marca, no por términos genéricos

### Expectativas realistas

| Métrica | Actual | Esperado (3 meses) | Esperado (12 meses) |
|---------|--------|-------------------|---------------------|
| Páginas indexadas | 3 | 5-10 | 20-50 |
| Impressions/mes | ~0 | 100-500 | 1,000-5,000 |
| Clicks/mes | ~0 | 10-50 | 100-500 |
| Posición media | N/A | 30-50 | 15-30 |

### Estrategia recomendada

1. **Primero**: Soluciones A + B (técnico) - **1-2 días de trabajo**
2. **Segundo**: Blog con 5-10 guías básicas - **1 semana**
3. **Tercero**: Community building (Discord activo) - **continuo**
4. **Cuarto**: Influencer marketing (YouTubers de TCG) - **cuando haya contenido**

---

## 7. Métricas de Éxito

### Google Search Console

- [ ] Páginas indexadas: de 3 a 5+
- [ ] Errores "Page with redirect": de X a 0
- [ ] Impressions: crecimiento mes a mes
- [ ] Clicks: crecimiento mes a mes

### Herramientas

- [ ] Google Search Console: monitoreo semanal
- [ ] Google Analytics 4: tráfico orgánico
- [ ] PageSpeed Insights: rendimiento
- [ ] Lighthouse: SEO score > 90

---

## 8. Archivos a Modificar

| # | Archivo | Cambio | Prioridad |
|---|---------|--------|-----------|
| 1 | `src/app/page.tsx` | Convertir a Server Component | 🔴 Crítico |
| 2 | `src/components/landing/LandingInteractive.tsx` | NUEVO: componente cliente extraído | 🔴 Crítico |
| 3 | `middleware.ts` | Excluir crawlers de redirect | 🔴 Crítico |
| 4 | `src/app/page.tsx` | Añadir metadata + canonical | 🟡 Medio |
| 5 | `src/app/(auth)/login/page.tsx` | Añadir canonical | 🟡 Medio |
| 6 | `src/app/(auth)/register/page.tsx` | Añadir canonical | 🟡 Medio |
| 7 | `src/app/sitemap.ts` | Añadir más rutas públicas | 🟡 Medio |

---

## 9. Notas para Otros Agentes

- **No romper la UX**: El componente interactivo debe seguir funcionando igual para usuarios reales
- **Testing**: Verificar que Googlebot ve el contenido con `URL Inspection` en Search Console
- **No over-engineering**: Para un juego indie, el SEO técnico es suficiente; el tráfico vendrá de comunidad y marketing
- **Monitorizar**: Después de implementar, esperar 1-2 semanas para ver resultados en Search Console
