> **[Read this in English (README.md)](README.md)**

# Web Builder — Fábrica de Proyectos

Este repositorio no construye productos. Los **especifica**, y después genera el repositorio que sí los
construye.

Vos contás qué querés. Él hace el descubrimiento, consigue que apruebes la dirección visual sobre una página
real e interactiva, escribe cinco especificaciones completas, las manda a revisar a un agente independiente,
te pide la aprobación, y recién ahí genera un **repositorio nuevo e independiente**: con su propio historial
de git, su propio harness, sus propios agentes y sus propios skills.

Ese repositorio lo abrís en una sesión nueva de Claude Code, decís `inicia`, y ahí empieza la
implementación.

```
WEB BUILDER          descubrimiento · dirección visual · especificaciones · generación · validación
PROYECTO GENERADO    implementación · revisión · integración · QA · deploy · mantenimiento
```

La frontera es el punto. Una fábrica que además construye el producto termina haciendo mal las dos cosas.

---

## Qué hace falta

| Qué | Para qué |
|---|---|
| **Claude Code** | Corre el Builder |
| **Node.js 20+** | Los scripts y la plantilla Next fija |
| **Git** | Todo proyecto generado nace como repositorio |

Los proyectos generados quedan en `C:\SkormJF\Projects\PagesProjects\<slug>`, configurado en
[`builder.config.json`](builder.config.json).

---

## Cómo se usa

Abrís este repositorio en Claude Code y contás qué querés construir. Esa es toda la interfaz.

Lo que pasa, en orden:

```
IDLE → DISCOVERY → PLANNING → SPEC_REVIEW → AWAITING_APPROVAL → READY_TO_CREATE
     → CREATING_PROJECT → VALIDATING_PROJECT → HANDOFF_COMPLETE → RESET → IDLE
```

**El descubrimiento** es una conversación en cuatro rondas: qué es el producto, qué dice, cómo se comporta
(solo si tiene funcionalidad real) y cómo se ve. La última ronda termina con un artifact interactivo que
abrís en el navegador. El Builder te nombra las decisiones principales del sistema visual —paleta, tipografía, botones,
layout, fondos y tono— y aprobás esa dirección en una sola compuerta cuando nada está en disputa.

No es una imagen de un diseño: es una página real. Por eso hover, foco, estados y ritmo pueden inspeccionarse antes de
convertirse en el contrato visual, en vez de improvisarse durante la implementación.

**La planificación** convierte todo eso en cinco especificaciones, cada una dueña de exactamente una cosa:

| Archivo | De qué es dueño |
|---|---|
| `PROJECT.md` | Identidad y alcance |
| `requirements.md` | Qué tiene que hacer el producto |
| `design.md` | Cómo, técnicamente |
| `design-system.md` | El contrato visual aprobado |
| `tasks.md` | El trabajo, descompuesto y trazable |

**La compuerta** son tres condiciones, y tienen que pasar las tres:

```
Spec Gate mecánico  +  Spec Reviewer  +  tu aprobación explícita  =  READY_TO_CREATE
```

La mitad mecánica revisa estructura: archivos, IDs, referencias, placeholders sin resolver. El
[Spec Reviewer](.claude/agents/spec-reviewer.md) es un agente aparte que revisa si las specs están *bien*:
completas, consistentes, trazables, factibles y fieles a lo que realmente aprobaste. Reporta y nunca corrige.

**La generación** compone el repositorio nuevo, instala sus dependencias, hace un único commit base, valida
el resultado y te da la ruta.

**Dos veces te va a pedir que cortes el contexto** — al aprobar el artifact y al aprobar las specs. Aparece un
`CONTEXT CHECKPOINT`, se detiene, y vos ejecutás `/clear` y después `continúa`. No se pierde nada: todo lo
aprobado ya está escrito en disco y se recupera desde ahí. Son paradas fijas del flujo, no una sugerencia
según cómo venga la sesión.

---

## Plataforma

Hay una sola base de aplicación soportada:

| Plataforma | Stack | Estado |
|---|---|---|
| `next-standard-v1` *(fijo)* | Next.js 16 · React 19 · Tailwind 4 · TypeScript 5 · ESLint | soportado |

Planning no elige framework. Toda aplicación generada usa Next.js. Solo decide el modo de backend de la aplicación:
`none` para un proyecto simple/sin backend propio, o `supabase` cuando el producto necesita datos persistentes, Auth,
storage, realtime o autorización en base de datos. Las APIs externas siguen siendo Integrations. Las versiones exactas
viven en el `package.json` y lockfile de la plantilla Next.

---

## Qué recibe un proyecto generado

```
proyecto/
├── CLAUDE.md              su propio contrato de harness
├── PROJECT.md  requirements.md  design.md  design-system.md  tasks.md
├── .claude/
│   ├── agents/            planner · builder · reviewer (+ db-reviewer solo con Supabase)
│   └── skills/            17 estándar + 2 de Next (19 hoy)
├── .workflow/             state.json por grupos + evidencia compacta en current/
├── .mcp.json              Vercel siempre; Supabase solo si Backend Mode = supabase
├── .claude/settings.json  Sonnet/high por defecto
├── src/  public/
└── package.json  package-lock.json
```

El conjunto de skills es determinista: las 17 marcadas `inherited-standard` más las 2 del perfil Next fijo — 19 hoy. El catálogo del Builder es de 20, y la diferencia es
`chrome-bridge-automation`, clasificada `optional`. **Nunca** se copia automáticamente: mandarla por defecto
convertiría "requiere una decisión explícita" en una frase de un documento, con la skill ya instalada en el
repositorio.

Su propio ciclo de vida corre de `READY_TO_BUILD` a `DONE` por **grupos de construcción**. Las Tasks siguen siendo
unidades de trazabilidad y aceptación, pero las relacionadas se implementan de corrido con un Builder en vez de pagar un
ciclo de agentes por cada fila. Los grupos declaran el gate desde Planning: AUTO para trabajo totalmente LOW, REVIEW para el Reviewer genérico sin herramientas directas de edición y DB_REVIEW para trabajo CRITICAL de
Supabase/datos mediante un MCP dedicado, acotado y de solo lectura. Una corrección recibe
una sola re-revisión dirigida, nunca una auditoría completa nueva. `HEAD` es siempre el último grupo aprobado.

La biblioteca de skills heredada permanece disponible para features y rediseños futuros. Los agentes cargan el cuerpo
completo de una skill bajo demanda para el scope actual, en vez de recorrer el catálogo antes de trabajar.

---

## Los tres scripts

```bash
npm run create-project -- --slug <slug>
npm run validate-project -- --slug <slug>
npm run reset-builder -- --yes
```

Exactamente tres, y son solo mecánicos. Acá nada razona sobre un producto: descubrir, planificar, diseñar y
revisar son conversaciones, y un script que fingiera hacerlas solo estaría escondiendo el criterio que se
salteó.

`create-project` rechaza más de lo que hace: cualquier fase que no sea `CREATING_PROJECT`, slug que no
coincide, spec faltante, compuerta fallada, skill ausente y, sobre todo, un destino ocupado — nunca
sobreescribe, nunca fusiona y nunca se inventa un `<slug>-2`.

El stack queda fijado por `builder.config.json`/el perfil Next y no se repite como elección del proyecto en `design.md`; ninguno de los scripts acepta selector de stack. El Backend Mode (`none` o `supabase`) sale del `design.md` aprobado.

`validate-project` demuestra y no repara nada. Un validador que arregla lo que encuentra ya no puede
contarte qué estaba roto.

`reset-builder` borra exactamente un directorio y no acepta ninguna ruta como argumento.

---

## Estructura del repositorio

```
.claude/
  agents/spec-reviewer.md     el único subagente del Builder
  skills/                     20 skills, la fuente de distribución
config/
  skill-manifest.json         clasifica cómo se distribuye cada skill
  stack-profiles/             el perfil Next fijo y sus skills específicas
templates/
  common/                     cómo funciona todo proyecto generado
  capabilities/supabase/      capacidad DB read-only condicional
  stacks/next-standard-v1/    base Next validada y ejecutable
scripts/                      create · validate · reset
tests/                        el contrato del core, como invariantes de node --test
.builder/current/             el proyecto activo (fuera de git)
```

[`CLAUDE.md`](CLAUDE.md) es el contrato operativo; este README lo describe y nunca lo pisa.
[`tests/core-contract.test.mjs`](tests/core-contract.test.mjs) guarda las invariantes que no pueden
regresionar — se corre con `node --test tests/core-contract.test.mjs`.

---

## Licencia

Todos los derechos reservados — ver [LICENSE](LICENSE). Proyecto privado, no licenciado para redistribución.

Creado por [@Soyenriquerocha](https://github.com/Soyenriquerocha) / [Tododeia](https://tododeia.com)
