---
name: shadcn-ui
description: Front door for shadcn/ui in a React + Tailwind project — when to reach for it, how to add only what is needed, and why the installed files outrank any catalog. Use before adding or modifying a UI primitive.
---

# shadcn/ui

shadcn is not a dependency. The CLI copies source into the repository and you own it from that moment, so
there is no upgrade that reconciles a document with what is actually there.

**The installed files are the source of truth.** Read the component before writing code against it. When
this skill, any catalog, or your memory disagrees with `src/components/ui/*.tsx`, the files win — every
time, without checking.

---

## Before adding anything

```
does a component for this already exist in the project?
  → yes: use it. Extend it or add a variant if it nearly fits.
  → no:  is this a genuine UI primitive, or product-specific structure?
           primitive          → shadcn is a reasonable source
           product structure  → build it, in the feature that owns it
```

**Add only what the assigned phase/scope needs.** Never `add --all`, and never add a component speculatively: every
one is source code that lands in the repository, gets reviewed, and has to be maintained whether or not
anything imports it.

**Never overwrite an installed component blindly.** The CLI will happily replace a file that has already
been customized — with the project's own tokens, variants and accessibility fixes in it. Read what is there
first, and if it must be regenerated, port the changes back deliberately.

---

## What owns what

This skill covers *sourcing and wiring* components. It does not decide how they look or how they compose.

| Decision | Owner |
|---|---|
| Colour, radius, spacing, typography, interaction states | `design-system.md` |
| Whether this should be one component or three, variants vs new | `atomic-design` |
| Component API shape, props, accessibility patterns | `building-components` |
| Header, nav, sidebar and app shell | `navigation-shell` |
| Which component to install and how to wire it | here |

Styling goes through the project's tokens. A shadcn default that contradicts `design-system.md` is changed
to match the contract, not the other way round.

---

## Check the real stack before assuming an API

The generated project pins its own versions, and shadcn's own surface has moved more than once:

- **Base library.** Components generated against Radix expose `asChild`; those generated against Base UI
  expose `render`. Which one this project has is visible in `components.json` and in the component source.
  Assuming the wrong one produces code that typechecks against nothing.
- **Tailwind version and sources.** On Tailwind v4 the theme is declared in CSS via `@theme` and there is no
  `tailwind.config.ts`. The generated Next template also scopes detection explicitly with `source(none)` + `@source`; preserve
  those application roots and never re-enable repository-wide scanning just to make a class appear.
- **Form primitives are not guaranteed.** Some registry versions ship no `Form`/`FormField` wrapper. Check
  whether the file actually exists after adding it; if it does not, wire the form directly rather than
  importing something that was never generated.

Read `components.json` and the installed source. Both are in the repository, and both are current in a way
this document cannot be.

---

## References

Loaded on demand — none of this is needed to decide whether to add a component.

| File | For |
|---|---|
| `references/component-catalog.md` | What each component is and its shape |
| `references/theming.md` | Token wiring and dark mode |
| `references/patterns.md` | Composition, advanced usage, framework integration |
| `references/accessibility-notes.md` | The accessibility behaviour these components do and do not give you |
| `references/troubleshooting.md` | Configuration, CLI usage, and what to check when something does not apply |
