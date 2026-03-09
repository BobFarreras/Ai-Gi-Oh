<!-- src/app/README.md - Guía de entradas App Router, páginas de módulo y API routes. -->
# Módulo App Router

## Qué contiene

1. Páginas y layouts de Next.js (`/`, `/hub/*`, `/login`, `/register`).
2. API routes para mutaciones de `auth`, `home`, `market`, `story` y progresión.
3. Capa de composición server-side para construir view models y datos iniciales.

## Reglas del módulo

1. Las páginas no deben contener reglas de negocio.
2. La lógica de dominio vive en `core/` y `services/`.
3. Las rutas API son finas: validan entrada/sesión y delegan a servicios/casos de uso.

## Subcarpetas clave

1. `api/`: endpoints HTTP.
2. `hub/`: módulos jugables del hub.
3. `(auth)/`: flujo de login/registro.

