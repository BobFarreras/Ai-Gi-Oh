<!-- skills/repository-pattern-supabase/SKILL.md - Protocolo para aplicar Repository Pattern y evitar acceso directo a Supabase desde UI y rutas. -->
---
name: repository-pattern-supabase
description: Úsala cuando un cambio lea o escriba datos para asegurar repositorios tipados y separación de infraestructura.
---

# Repository Pattern para Supabase

## Cuándo usar esta skill
Aplicar en cualquier caso con lectura/escritura de datos, cambios en rutas API, servicios o integración con Supabase.

## Reglas obligatorias
- UI y rutas API no acceden a Supabase directo.
- Todo acceso a datos debe pasar por repositorios.
- Repositorios exponen contratos tipados sin `any`.
- Infraestructura implementa interfaces definidas por dominio o aplicación.

## Flujo recomendado
1. Definir o reutilizar interfaz de repositorio.
2. Implementar adaptador de Supabase en `infrastructure/`.
3. Inyectar el repositorio en servicio/caso de uso.
4. Usar el caso de uso desde UI o ruta API.

## Checklist de calidad
- ¿Existe contrato explícito del repositorio?
- ¿Hay mapeo claro entre entidad de dominio y modelo persistido?
- ¿Los errores de infraestructura se traducen a errores de aplicación?
- ¿Hay tests unitarios del caso de uso con repositorio mock?

## Integración con Engram
- Registrar decisiones de contrato con `mem_save` (`architecture/*` o `decision/*`).
- Registrar bugfixes de persistencia con `mem_save` en `bug/*`.
