<!-- docs/GUIA_PRESENTACION_TFM_WEB.md - Guía de contenido y narrativa para una presentación TFM implementada como página web dentro del proyecto. -->
# Guía de Presentación TFM en Formato Web

## Objetivo

Definir una presentación del TFM hecha con código (sin Google Slides/PowerPoint/Canva), desplegada como una página web del proyecto y válida como URL de acceso en la entrega.

## Requisito académico cubierto

1. El TFM exige una presentación en formato slides o equivalente.
2. La opción elegida es una presentación web propia dentro de la app.
3. La entrega incluirá una URL pública (Vercel) y referencia explícita en `README.md`.

## Contexto del proyecto (resumen ejecutivo)

1. Proyecto: **AI-GI-OH**.
2. Stack: Next.js 16, React 19, TypeScript estricto, Zustand, Supabase.
3. Arquitectura por capas: `components -> services/use-cases -> core -> infrastructure`.
4. Dominios principales: Hub, Academy (tutorial/training), Home, Market, Story, motor de combate.
5. Seguridad y hardening: auth boundaries, rate-limit, validación de origen, RPCs atómicas de wallet/recompensas.
6. Calidad de merge: `quality:check` (`lint`, `typecheck`, `test:coverage`, `audit`, `build`) + `gitleaks`.

## Enfoque recomendado (presentación web)

1. Crear ruta dedicada y no enlazada en navegación principal: `/presentacion-tfm`.
2. Tratar cada bloque visual como una “slide” navegable por scroll o por teclas.
3. Mantener estética coherente con el juego (ciberpunk, HUD, narrativa técnica).
4. Priorizar claridad académica: problema, objetivos, arquitectura, decisiones, validación y resultados.

## Estructura sugerida (12 bloques)

1. **Portada**
   - Título del TFM.
   - Autor, tutor, curso.
   - Claim del proyecto.
   - Subtítulo personal: inicio del viaje en programación con apoyo de IA.

2. **Quién soy y por qué este TFM**
   - Contexto personal: sin experiencia previa en programación.
   - Motivación: curiosidad por el desarrollo.
   - Papel de la IA como acelerador de aprendizaje y desbloqueo de entrada.

3. **Problema y motivación**
   - Qué problema resuelve.
   - Por qué un juego táctico de cartas como vehículo técnico.

4. **Decisión del proyecto**
   - Iteración previa de ideas de TFM no convincentes.
   - Punto de inflexión: decidir construir un juego con tecnología web.
   - Nota técnica de criterio: alternativa nativa (C/C++) vs apuesta web full-stack.

5. **Objetivos**
   - Objetivo general.
   - Objetivos específicos medibles.

6. **Stack tecnológico**
   - Frontend, backend, persistencia, testing y CI.
   - Justificación breve de cada elección.

7. **Arquitectura**
   - Capas y dependencias permitidas.
   - Separación de responsabilidades (UI, application, domain, infra).

8. **Lore y narrativa del juego**
   - Escenario: red tecnológica bajo amenaza de control por una superIA.
   - Referencia base: `MODO-HISTORIA.md`.
   - Introducir personajes clave del relato.

9. **Motor de juego**
   - Estado por turnos.
   - Fases, combate, traps, ejecuciones, fusión.
   - `combatLog` como fuente de verdad de eventos UX.

10. **Subdominios funcionales**
   - Hub y onboarding.
   - Academy (tutorial y training).
   - Home/Arsenal, Market, Story.

11. **Seguridad**
   - Auth boundary y repositorios.
   - Hardening en APIs.
   - RPC atómicas para wallet/recompensas y consistencia transaccional.

12. **Calidad y testing**
   - Strategy de tests (unit, component, integration, e2e puntual).
   - Quality gates en CI y local.
   - Cobertura y criterio de merge.

13. **DevOps y despliegue**
    - Flujo `develop -> main`.
    - GitHub Actions.
    - Vercel producción.

14. **Resultados y demo**
    - Flujos jugables relevantes.
    - Indicadores técnicos (paso de gates, estabilidad, rendimiento base).

15. **Conclusiones y trabajo futuro**
    - Qué se ha conseguido.
    - Limitaciones.
    - Próximas iteraciones.

## Evidencias mínimas que debe mostrar la presentación

1. Capturas o bloques de arquitectura (`docs/architecture/*`).
2. Capturas o clips de gameplay (Hub, combate, Story, Market).
3. Evidencia de calidad (`quality:check` verde, tests, build).
4. Evidencia de seguridad (hardening documentado y rutas protegidas).
5. URL pública de despliegue y URL de la propia presentación.
6. Presencia visual explícita de personajes narrativos:
   - BigLog
   - GenNvim

## Reglas de diseño para la presentación web

1. Una idea principal por bloque.
2. Máximo 5 bullets por bloque.
3. Tipografía grande y legible en proyector.
4. Animaciones con intención (no decorativas).
5. Contraste alto y accesibilidad básica (`aria-label`, semántica, foco visible).

## Propuesta técnica de implementación

1. Ruta: `src/app/presentacion-tfm/page.tsx`.
2. Módulos internos:
   - `src/components/tfm/sections/*`
   - `src/components/tfm/navigation/*`
   - `src/components/tfm/charts/*`
3. Datos de contenido:
   - `src/components/tfm/content/tfm-presentation-content.ts`.
4. Metadata específica:
   - título SEO: `TFM | AI-GI-OH`.
   - `robots: noindex, nofollow` si se quiere mantener fuera de buscadores.

## Plan de ejecución en fases

1. Fase 1: Esqueleto de bloques + navegación.
2. Fase 2: Integrar narrativa personal y origen de decisión del proyecto.
3. Fase 3: Insertar contenido técnico real (arquitectura, seguridad, calidad, CI/CD).
4. Fase 4: Visuales avanzados y dirección artística alineada al juego.
5. Fase 5: Ensayo de defensa y ajuste de tiempos por bloque.

## Definición de “hecho” para esta entrega

1. Existe ruta `/presentacion-tfm` funcional en entorno local y producción.
2. El contenido cubre los 12 bloques.
3. `README.md` incluye URL final de la presentación.
4. `pnpm quality:check` pasa en verde tras añadir la presentación.
