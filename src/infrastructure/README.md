<!-- src/infrastructure/README.md - Inventario de adaptadores externos y persistencia del proyecto. -->
# Módulo de Infraestructura

## Objetivo

Implementar adaptadores concretos de persistencia e integración externa sin contaminar `core/`.

## Submódulos

1. `persistence/supabase/`: repositorios reales sobre Supabase.
2. `repositories/`: implementaciones in-memory y singletons de desarrollo.
3. `database/`: contratos/adaptadores auxiliares de acceso a datos.
4. `ai/`: espacio reservado para integraciones de IA externas.

## Reglas

1. Ningún componente UI debe importar SDKs externos desde aquí.
2. Los contratos viven en `core/repositories`; aquí solo se implementan.

