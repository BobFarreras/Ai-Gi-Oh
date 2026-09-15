<!-- docs/vercel/avisos-de-cuota.md - Por qué Vercel avisa de cuota y cómo bajarla sin romper nada. -->
# Avisos de cuota en Vercel

> **Leer esto antes que nada (2026-09-15).** El indicador «Deployment Storage X / 10 GB» del panel es el
> agregado de los **últimos 30 días**, no lo que ocupas ahora. Tras borrar 45 despliegues el 12/09 el
> indicador llegó a marcar **9,75 GB**, más que antes de la limpieza, mientras el almacenamiento real ya
> era de **1,44 GB**. El número de cabecera no baja hasta que los días anteriores a la limpieza salen de
> la ventana de 30 días. Para ver lo real: *Usage → Deployment Storage*, y mirar el **total del gráfico**
> («Updated just now»), no el medidor.

Estado (plan Hobby, cuentan **todos** los proyectos de la cuenta, aunque aquí sólo hay uno):

| Métrica | 12/09 (antes) | 15/09 (medidor) | 15/09 (real) | Límite |
|---|---|---|---|---|
| **Deployment Storage** | 8,94 GB | 9,75 GB ⚠️ ventana 30d | **1,44 GB** | 10 GB |
| Fluid Active CPU | 47m 11s | 47m 53s | — | 4h |
| Functions Storage | 1,15 GB | 1,38 GB | — | 10 GB |
| Edge Requests | 67K | 71K | — | 1M |

El medidor **subió** después de la limpieza y aun así el almacenamiento real bajó un 84%. Es la ventana,
no un problema.

## Por qué se llena el Deployment Storage

Vercel **congela una copia completa del build en cada despliegue** y la guarda hasta que se borra. No es
el sitio el que ocupa 9 GB: son cuarenta copias del sitio. Con `public/` en 236 MB, cada push a `main` o
`develop` costaba un cuarto de giga.

## Las tres palancas, de más a menos inmediata

### 1. Borrar despliegues viejos

Aplicado el **2026-09-12**: de 59 despliegues a 14, y el almacenamiento real pasó de ~9 GB a **1,44 GB**
(comprobado el 15/09 en el gráfico de uso). Funcionó; solo el medidor de cabecera tarda 30 días en
reflejarlo.

```bash
VERCEL_TOKEN=xxx pnpm vercel:prune:deployments
```

Modo informe: lista qué conservaría y qué borraría, **sin tocar nada**. Conserva siempre el despliegue de
producción en vivo, los 3 de producción más recientes (red de rollback) y todo lo de los últimos 7 días;
el resto son candidatos. Para borrarlos de verdad hay que repetirlo con `--yes`:

```bash
VERCEL_TOKEN=xxx pnpm vercel:prune:deployments --yes
```

Ajustable con `--keep-production=5` y `--keep-days=14`. El token se saca de
[vercel.com/account/tokens](https://vercel.com/account/tokens) y **se pasa por entorno, nunca al repo**.

Borrar un despliegue es **irreversible**: se pierde la posibilidad de hacer rollback instantáneo a él.
Por eso el script nunca borra sin `--yes` y por eso conserva los más recientes.

### 2. Política de retención — NO disponible en Hobby

Comprobado el 2026-09-12 en el panel: `/settings/deployment-retention` da **404** y en *Settings* solo
hay General, Build and Deployment, Environments, Git y Deployment Protection. La retención automática es
función de **Pro**, así que en este plan **no existe esta palanca**: la limpieza es manual (el script de
arriba) o no hay. Reevaluar si algún día se sube de plan.

### 3. Que cada despliegue pese menos

```bash
pnpm media:compress:videos:dry   # informe
pnpm media:compress:videos       # recomprime y reemplaza
```

Recomprime los `.mp4` de `public/assets/videos` a bitrate de web **sin cambiar rutas ni resolución**, así
que no hay que tocar ni una línea de código de la app. Salta los que ya están optimizados (por debajo de
4 Mbps) y no reemplaza si el ahorro no llega al 15%.

Aplicado el 2026-09-12: **119,9 MB → 56,2 MB (−53%)**. Los másters venían a 20-23 Mbps (calidad de
edición, no de web); ahora van a CRF 26, que se comparó fotograma a fotograma contra el original en la
fusión más exigente y no se distingue.

| Vídeo | Antes | Después |
|---|---|---|
| `fusion/gemgpt.mp4` | 22,6 MB | 8,9 MB |
| `fusion/kaclauli.mp4` | 21,4 MB | 9,4 MB |
| `fusion/pytgress.mp4` | 19,3 MB | 8,5 MB |
| `fusion/curshost.mp4` | 16,4 MB | 7,1 MB |
| `story/act-1/intro-act-1.mp4` | 13,6 MB | 6,1 MB |
| `story/act-2/intro-act-2.mp4` | 13,6 MB | 6,2 MB |
| `story/act-4/genNvim.mp4` | 4,8 MB | 1,9 MB |

**Lo que queda por hacer:** `public/assets/renders` son 62 MB y muchas piezas están a 4096×4096 o más
(`exec-fusion-super-c.webp` mide 5408×3072 y pesa 12,2 MB) para pintarse como overlay a pantalla completa.
Reescalarlas a 2048 px de lado mayor bajaría `public/` otros ~45 MB, pero es una decisión visual y no se
toca sin pedirlo.

### Por qué NO se movieron los vídeos a Supabase Storage

Era la idea inicial, pero el proyecto de Supabase está en plan **free**: 1 GB de almacenamiento (caben)
y **5 GB de salida al mes** (no caben). Sirviendo `intro-act-1.mp4` sin comprimir eran ~370
visualizaciones al mes antes de agotar la cuota, y con ella agotada los jugadores se quedan sin
cinemáticas hasta el mes siguiente. Se cambiaba un problema de almacenamiento por uno de disponibilidad.
Comprimidos y servidos desde el CDN de Vercel no hay ninguno de los dos.

## El otro aviso: "has not collected data during the past 7 days" — RESUELTO

Ese es de **Web Analytics** y no tiene nada que ver con la cuota. Faltaban dos cosas:

1. El paquete `@vercel/analytics` con `<Analytics />` montado en el layout raíz. **Hecho** el 2026-09-12
   ([layout.tsx](../../src/app/layout.tsx)).
2. Activar *Web Analytics* en la pestaña **Analytics** del proyecto en el panel de Vercel. **Hecho**: el
   panel ya muestra Visitors / Page Views / Bounce Rate. En Hobby el plan incluye 2.500 eventos al mes.
   (Al activarlo, el Vercel Agent abrió el PR #41 proponiendo exactamente este mismo cambio; se cerró por
   duplicado.)

**Confirmado el 2026-09-15: está recogiendo datos.** El panel marca 8 visitantes y 114 páginas vistas,
con la serie arrancando el 11/09 (el día del despliegue que llevaba el componente). El aviso que sigue
apareciendo es residual: su ventana de 7 días todavía incluye días sin datos. Se apaga solo.

Aviso para el futuro: el MCP de Vercel devuelve `404 Web Analytics not found` para este proyecto aunque
funcione. No es señal de que esté desactivado — mirar el panel, no la API.

No confundirlo con la **telemetría propia** (`AnalyticsInitializer`), que escribe en Supabase y alimenta
el panel de admin. Esa es independiente y necesita las dos variables a la vez, porque el cliente no emite
sin la primera y la API `/api/analytics/batch` rechaza sin la segunda. Las dos **existen** en el proyecto
desde el 28/06, pero su valor no se puede leer (ver más abajo); si el panel de admin no recibe eventos,
es que alguna no está en `true`.

```
NEXT_PUBLIC_ANALYTICS_ENABLED=true
ANALYTICS_ENABLED=true
```

Las variables de entorno se aplican **en build**, así que después de añadirlas hay que redesplegar.

## Las variables están guardadas como Secret: no se pueden leer

Las tres (`STORY_OVERWORLD_ENABLED`, `NEXT_PUBLIC_ANALYTICS_ENABLED`, `ANALYTICS_ENABLED`) son de tipo
**Secret**, y Vercel avisa de que *"You can't reveal this value after saving"*. Eso significa que **nadie**
—tampoco el dueño de la cuenta— puede comprobar su valor desde el panel: la única forma de asegurarlo es
sobrescribirlo (Edit → escribir el valor → Save) y redesplegar.

Para un flag booleano esto es más incordio que seguridad. Si algún día se recrean, el tipo **Config** sí
deja leerlas; sólo los secretos de verdad (service-role, tokens de Upstash) necesitan ser Secret.

**Cómo verificar el flag sin poder leerlo:** entrar a `/hub/story` con sesión iniciada. Si redirige a
`/hub/story/overworld`, `STORY_OVERWORLD_ENABLED` está en `true`; si se queda en el panel clásico, no.

**Verificado el 2026-09-15 y el flag está en `true`:** Web Analytics registra `/hub/story/overworld` como
**ruta servida** con 5 visitantes, empatada con `/hub/story` (5), justo lo que produce la redirección. Si
el flag estuviera apagado la ruta resolvería a `/_not-found`, no a sí misma. Los Actos 5-8 son jugables
en producción. Web Analytics sirve además como verificador de flags sin tener que leer la variable.
