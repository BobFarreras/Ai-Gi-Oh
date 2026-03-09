<!-- src/components/hub/home/internal/README.md - Detalla utilidades internas del módulo Home para mutaciones y estado optimista. -->
# Internos de Home

## Estructura recomendada

1. `actions/`: flujos async de insertar, remover y evolucionar.
2. `dnd/`: handlers de drag and drop por zona.
3. `hooks/`: estado/orquestación/handlers de interacción del contenedor.
4. `types/`: contratos compartidos del módulo.
5. `view/`: vista presentacional + builder de props de UI.
6. `optimistic/`: helpers y tests de actualización optimista.
7. `errors/`: normalización de errores para UX.

## Regla de uso

Solo debe ser consumido por componentes/hooks del módulo `home`.

