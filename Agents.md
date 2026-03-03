# SYSTEM RULES & GUIDELINES (Agents.md)

## 1. Language Policy (The "English-Code, Spanish-Docs" Rule)
* **Codebase:** All filenames, variables, functions, classes, and types MUST be written in **English**. 
* **Documentation & UI:** All code comments, JSDoc blocks, `README.md`, architecture documents, and user-facing text (UI) MUST be written in **Spanish**.

## 2. Typing & TypeScript Strictness
* **Zero `any` Tolerance:** The use of `any` is strictly forbidden. Use strict typing, generics, or `unknown` (with type narrowing).
* Interfaces must start with an uppercase 'I' (e.g., `ICard`, `IUserRepository`) if representing abstract contracts, or follow standard entity naming (e.g., `Card`).

## 3. Architecture & SOLID Principles
* **Repository Pattern:** UI components (React) and API routes MUST NOT interact with the database (Supabase) directly. They must use Repositories via dependency injection or service classes.
* **Separation of Concerns:** Business logic belongs in the `core/` or `services/` directory, NEVER inside React components.

## 4. Next.js App Router Rules
* Default to **Server Components**. Only use `"use client"` when interactivity (hooks like `useState`, `useEffect`, or DOM events) is strictly required.
* Data fetching should happen on the server side whenever possible.

## 5. TDD & Testing
* Follow the Red-Green-Refactor cycle.
* No feature is considered complete without unit tests (Vitest) for business logic and component tests (React Testing Library) for UI.

## 6. Error Handling
* Do not use generic `console.log()` for errors in production.
* Create custom Error classes (e.g., `DatabaseError`, `ValidationError`) and handle them gracefully in the UI with toast notifications or error boundaries.

## 7. Calidad del Código y Deuda Técnica (Zero Technical Debt)
* **Nivel de Experiencia:** Actúa siempre como un Staff Software Engineer experto en Next.js, TypeScript y Clean Architecture.
* **Cero Deuda Técnica:** No propongas "soluciones rápidas" o "parches" temporales. Si una implementación requiere refactorizar una interfaz previa para ser robusta, hazlo.
* **Co-location (Tests y Componentes):** Los tests unitarios (`*.test.ts`, `*.test.tsx`) DEBEN colocarse en el mismo directorio que el archivo que están evaluando, nunca en una carpeta separada y aislada de `/tests`.

## 8. Anti-GOD Code y Límites de Tamaño (Mandatory)
* **Prohibido GOD Objects/Components:** Ningún archivo puede centralizar múltiples responsabilidades de dominio, UI y orquestación en un único módulo.
* **Límite de líneas por archivo:** Máximo **150 líneas** para componentes, hooks, servicios y casos de uso.
* **Excepciones permitidas (justificadas):** Archivos de tipos/entidades, archivos de configuración, y migraciones pueden superar el límite si existe justificación explícita en PR.
* **Regla de extracción:** Si un archivo supera 150 líneas, se debe dividir en submódulos cohesivos en el mismo commit.
* **Una responsabilidad por módulo:** Cada archivo debe tener un único motivo de cambio (SRP estricto).

## 9. Separación de Responsabilidades (UI, Application, Domain, Infra)
* **UI (React):** Solo renderizado y manejo de eventos de interacción. No debe contener reglas de negocio del juego.
* **Application/Use-Cases:** Orquesta flujos del juego, validaciones y reglas. No renderiza UI.
* **Domain/Core:** Entidades, value objects y reglas puras sin dependencias de framework.
* **Infrastructure:** Adaptadores externos (DB, APIs, SDKs). Nunca debe contaminar `core/`.
* **Dependencias permitidas:** `app/components -> services/use-cases -> core`. `infrastructure` implementa interfaces del `core`.

## 10. Reglas Estrictas para PR y Merge (Quality Gates)
* **Bloqueo de merge si falla cualquier gate:** `pnpm lint`, `pnpm test`, `pnpm build`.
* **Sin warnings nuevos:** Todo warning de ESLint debe resolverse antes de mergear.
* **Cobertura mínima de lógica de negocio:** 80% en casos de uso y servicios críticos.
* **Cambio sin tests = cambio incompleto:** Toda nueva feature/refactor de comportamiento debe incluir tests unitarios y, cuando aplique, test de integración.
* **Checklist obligatoria en PR:**
  1. Se mantiene SRP y no se introduce código GOD.
  2. Ningún archivo nuevo supera 150 líneas (o excepción justificada).
  3. Documentación afectada actualizada en español.
  4. `lint`, `test` y `build` en verde.

## 11. Accesibilidad y Testabilidad de UI
* Todo elemento interactivo (`button`, `input`, `select`, `a`) debe tener nombre accesible (`aria-label`, texto visible o asociación correcta con `label`).
* Los tests de UI deben priorizar queries semánticas (`getByRole`, `getByLabelText`, `getByText`) y evitar selectores frágiles por clase CSS.

## 12. Estructura recomendada del motor (`game-engine/`)
* Organizar por subdominios:
  * `state/`
  * `actions/`
  * `phases/`
  * `combat/`
  * `fusion/`
  * `logging/`
* Evitar volver a mezclar lógica de diferentes dominios en la raíz de `game-engine/`.

## 13. Eventos de UX obligatorios
* Cualquier cambio relevante de turno/fase/combate debe reflejarse en `combatLog`.
* El `combatLog` es la fuente única para:
  * historial visual,
  * carteleras de estado,
  * efectos de sonido/feedback.
