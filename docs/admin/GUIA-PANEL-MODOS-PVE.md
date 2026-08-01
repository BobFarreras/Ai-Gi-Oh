<!-- docs/admin/GUIA-PANEL-MODOS-PVE.md - Guía práctica para configurar Supervivencia y Olimpo desde el panel admin. -->
# Guía del panel: Modos PvE

Ruta: `/admin-portal/<slug>/pve-modes`. Cuatro pestañas: **Supervivencia**, **Config Olimpo**,
**Leyendas** y **Campeones**.

## 1. La regla que gobierna todo: publicar ≠ editar

| Qué tocas | Qué pasa al guardar | Por qué |
| --- | --- | --- |
| Supervivencia, Config Olimpo | Se **publica una versión nueva** y se activa | Una expedición en curso se quedó atada a la versión con la que empezó. Si reescribiéramos la fila, su dificultad cambiaría a mitad de partida. |
| Leyendas, campeones, nodos | Se **edita en sitio** y sube su `version` | Cada batalla guarda un snapshot inmutable. El servidor reproduce ese snapshot, no el catálogo de hoy. |
| Retirar una leyenda o un nodo | Se **archiva** si ya tiene historial | Borrar dejaría batallas huérfanas y sacaría el coste del nodo del reembolso del respec. |

Las versiones antiguas nunca se borran: son el registro de con qué reglas jugó cada partida. El panel
muestra el historial completo debajo de cada formulario.

## 2. Supervivencia: cómo escala una expedición

Una expedición es una cadena de combates con **los LP reales del jugador**: lo que le queda al ganar es
con lo que empieza el siguiente. Perder **o empatar** la cierra.

### 2.1. Quién sale (roster)

El rival del combate `N` es el de la posición `N % roster`, en orden circular. El orden importa: el
combate 1 es el primero de la lista. Una **vuelta completa** dura tantos combates como rivales tenga.

### 2.2. Cuánta fuerza tiene (tier)

```text
tier del combate N = tier inicial + floor((N - 1) / combates por tier)
                     ...frenado por el «tier máximo» del tramo activo
```

Con tier inicial 4 y 2 combates por tier: combates 1-2 → T4, 3-4 → T5, 5-6 → T6…

### 2.3. Qué cambia por tramos

Cada tramo manda **desde su combate hasta que empieza el siguiente** y fija:

- **Dificultad de la IA** (`HARD` → `BOSS` → `MASTER` → `MYTHIC`).
- **Tier máximo**: al tocarlo, el rival deja de subir de tier y **arranca la Ascensión**.
- **LP y ATK/DEF extra por vuelta**: el crecimiento acotado que sustituye al tier.
- **Id de recompensa**: solo etiqueta de auditoría del pago de Éter.

### 2.4. Ascensión

```text
rango = floor((combate actual - primer combate con el tier al tope) / tamaño del roster)
LP extra del rival    = LP por vuelta   × rango
ATK/DEF extra         = stats por vuelta × rango
```

Es decir: **una vuelta completa al roster = un rango**. Nivel y versión de las cartas también suben con
el rango, sin pasar del máximo del juego.

### 2.5. Hitos

Cada `N` victorias el jugador recupera los LP configurados, sin superar su máximo. En la vista previa los
combates que curan salen marcados en verde.

### 2.6. Vista previa

El bloque **«Así se jugará»** simula los 24 primeros combates **con el mismo resolutor que usa el
servidor** (`resolveSurvivalEncounter`). Si algo se ve raro ahí, se verá igual de raro en la partida.

## 3. Config Olimpo

| Campo | Qué controla |
| --- | --- |
| Intentos por día | Batallas por jugador y día. Se reinician a las **00:00 UTC**, no a medianoche local. |
| Caducidad (min) | Ventana para jugar una batalla emitida. Al caducar, abandonar cuenta como derrota. |
| Respecs gratis | Reasignaciones sin coste **por campeón**. |
| Coste de respec | Éter que cuesta a partir de las gratuitas. |
| Reembolso (%) | Porcentaje de lo invertido que se devuelve al reasignar. |

El intento se consume **al emitir** la batalla. Reanudar una batalla ya emitida no gasta otro.

## 4. Leyendas

- **Identidad y arte**: las cuatro rutas (`avatar`, `intro`, `victoria`, `derrota`) viven en
  `public/assets/combat/olympus/opponents/<id>/`.
- **LP iniciales** y **Energía +**: `Energía +` es energía **por encima** del máximo compartido del motor,
  no un valor absoluto.
- **Plantilla**: la variante de Arena de la que salió el mazo. Es documentación; el mazo real se edita
  abajo y puede divergir.
- **Reglas especiales**: una por línea. El jugador las lee **antes** de gastar un intento.
- **Ventana de disponibilidad**: sin fechas, disponible siempre mientras esté activa. Sirve como rotación.
- **Recompensas**: victoria, bonus de primera victoria (una sola vez por leyenda y jugador) y compensación
  por derrota, que nunca debe ser premium.

### Editor de mazo

Pulsa una carta del mazo o del almacén y se abre su ficha con **nivel, versión, XP y objetos**. El
escalado y los objetos se aplican **a todas las copias de esa carta**, igual que en Arena y Story. Una
carta nueva nace al nivel y versión máximos del juego.

## 5. Campeones

El jugador **no juega con su mazo**: toma prestado el mazo real de un rival de Arena que ya derrotó.

- **Rival de Arena**: de quién toma prestado. Al cambiarlo hay que volver a elegir mazo.
- **Tier** y **Ladder**: en qué nivel y tras cuántas victorias se desbloquea.
- **Mazo prestado**: solo se ofrecen variantes **de ese rival**. Si aparece el aviso rojo, la variante
  guardada pertenece a otro rival y el combate fallaría al emitirse.
- **Nivel/versión base**: con qué escala salen las cartas prestadas, independientemente del nivel real del
  jugador.
- **Árbol**: los nodos suben desde esa base hasta el tope de cada efecto.

Las cartas prestadas **no ganan experiencia ni entran en la colección** del jugador.

### Efectos de nodo soportados

Solo estos; publicar cualquier otro dejaría un nodo cobrado sin efecto en combate:

| Efecto | Qué hace | Rama natural |
| --- | --- | --- |
| `GLOBAL_LEVEL` | Sube el nivel de todo el mazo prestado (ATK/DEF). | Potencia |
| `GLOBAL_VERSION_TIER` | Sube la versión de todo el mazo (potencia las pasivas de maestría). | Identidad |
| `SIGNATURE_CARD_LEVEL` | Sube el nivel de las cartas emblemáticas. Sin selector, todo el fusion deck. | — |
| `STARTING_LP` | LP iniciales del campeón. | Resistencia |
| `STARTING_ENERGY` | Energía máxima del campeón. | Resistencia |

**`Tope` es el techo absoluto del atributo, no el incremento.** Varios nodos sobre el mismo atributo suman
sus magnitudes y comparten el tope más restrictivo.

> **No pongas dos ramas a subir lo mismo.** El árbol nació con Identidad usando `SIGNATURE_CARD_LEVEL`, que
> es un subconjunto del `GLOBAL_LEVEL` de Potencia: el jugador pagaba más por menos. Cada rama debe mover un
> eje distinto — Potencia el nivel (ATK/DEF), Resistencia el aguante (LP y energía), Identidad la versión
> (pasivas). Si usas `SIGNATURE_CARD_LEVEL`, dale un selector de cartas explícito.

## 6. La moneda se llama Éter

Los «Fragmentos» son la moneda de **eventos**. La de Supervivencia y Olimpo es el **Éter**, y son cosas
distintas. Internamente la columna sigue llamándose `ascension_fragments` por compatibilidad; en pantalla
nunca debe aparecer la palabra «Fragmentos» para esta moneda.
