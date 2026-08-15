---
name: performance-audit
description: Diagnose performance in a built project — measure, interpret the evidence, locate causes with file:line citations, and propose concrete corrections in priority order. It diagnoses; it does not implement. Use as a Quality Gate input, or on explicit request ("audit performance", "is this slow", "why is this heavy").
---

# Performance Audit

The rule that matters most here: **every finding must be provable by grep or by reading the actual file, not
recalled from "common issues with this framework."** A finding without a file:line citation isn't a finding
yet.

This applies to any project built here. Read `design.md` for the stack profile and `package.json` for what is
actually installed before assuming any framework-specific behaviour exists.

## When to run this

As a Quality Gate input, once the build is complete and before deploy readiness is claimed — not something
the user has to remember to request. Re-run it after any later pass that touches shared components,
data-fetching, or dependencies in a meaningful way; skip it after a small, isolated copy or styling tweak.

## Targets

Measure against these, and interpret rather than chase. A perfect score bought by gutting the approved
design is a failed audit — the design was approved by a human and the score was not.

| Metric | Target | What it actually measures |
|---|---|---|
| LCP | < 2.5s | How fast the main content appears |
| INP | < 200ms | How fast the page answers an interaction |
| CLS | < 0.1 | How much the layout moves while loading |

## What to check

These hold on any React web stack. Each is a grep or a file read, not a guess.

**1. The LCP element.** Find what it actually is — usually the hero image or the first heading. If it is an
image, confirm it is not lazy-loaded and that it is discoverable in the initial HTML rather than behind a
script. Lazy-loading the LCP image is the most common single-line performance defect there is.

**2. Layout stability.** Every `<img>`, `<video>` and embed needs explicit dimensions or an aspect-ratio
box. Missing width/height is the most frequent CLS cause. Check late-injected banners and font swaps too.

**3. Fonts.** Only the weights actually used, one variable face in preference to five static files, a
declared `font-display` strategy, and preloading for the face that renders above the fold. Grep the CSS and
the font declarations for weights nothing references.

**4. Bundle composition.** Look for barrel imports: `import { X } from "some-package"` where that package
re-exports many submodules from a single index. One symbol can pull in the whole library and cost hundreds
of milliseconds of import time. Check whether the bundler or framework already optimises the package before
proposing a manual fix.

**5. Dead dependencies and dead code.** For each entry in `dependencies`, grep `src/` for a real import.
Watch for a hook whose return value is unconditionally overridden by a later prop spread — a shared wrapper
that calls a theming hook every caller already overrides is dead code that still ships its dependency to the
browser. Scaffolded templates introduce this easily, for features the project never adopted.

**6. `package.json` hygiene.** CLI-only tooling listed under `dependencies` instead of `devDependencies`.
Use the same grep-for-imports approach as item 5.

**7. Sequential awaits that could be parallel.** Independent requests awaited one after another instead of
through `Promise.all`. Look especially for a second query whose input is already known from a URL parameter
or prior state, so it never needed the first result at all.

**8. Re-render cost.** Context values or object/array literals recreated every render and passed to memoised
children, state that lives higher than it needs to, effects that write state the render could have derived.
These show up as INP, not as load time.

**9. Client/server boundary**, where the stack has one. A component marked as client-side that did not need
to be drags its entire import graph into the browser bundle. Where the stack has no such boundary, the
equivalent question is what is in the initial chunk versus what could be loaded on demand.

**10. Third-party and below-the-fold work.** Analytics, chat widgets, embeds — deferred until after
hydration, or loaded on interaction.

**11. Duplicated request-time work.** The same authorization check, session lookup or data fetch running
more than once per request across different layers. Confirm both really run before proposing a fix; caching
helpers usually deduplicate within one render pass and not across execution phases.

## Stack-specific checks

`references/next.md` covers the Next-specific version of several of the above — `optimizePackageImports`,
the middleware-to-page duplication, Server Component data flow, and its image and font primitives.

Load it only when `design.md` says the project is on a Next profile. On a Vite/SPA project the same
questions are answered by looking at the bundle output, the router's code-splitting, and the entry chunk.

## This skill diagnoses. It does not implement.

Measure, interpret, locate the cause, and propose the correction with enough precision that someone else can
apply it. The Builder implements inside its assigned build group; review is invoked only when that group's risk policy requires it. That separation keeps a performance pass from quietly becoming an unreviewed refactor without turning every routine change into a separate agent cycle.

It also does not change the architecture, redesign anything, or touch `design-system.md`.

## Process

1. **Grep and read broadly first** — both the **shared component's own definition** and its **real usage
   sites**. The definition alone misleads: a `size="lg"` variant may be declared as one height while every
   call site overrides it by hand, so the real default is the override. Cataloguing real usage rather than
   declarations is the method; the `atomic-design` skill applies the same one to consistency.
2. **Report findings with evidence.** Each one: the file:line, what it costs, and why. A finding without a
   citation is not a finding yet.
3. **Propose corrections in priority order**, grouped by risk. Dependency and config changes and query
   parallelization are low-risk. Anything touching the auth boundary is not, and should be proposed as its
   own separately-verified piece of work rather than folded in with the cheap wins.
4. **Say what would prove each fix worked**, in terms that can fail — a measurement, a bundle delta, a
   request count. For anything touching the auth boundary that means an explicit security check, such as a
   forged-header request confirming a trusted header cannot be spoofed. Code review is not evidence for a
   security-sensitive change.

## What not to do

- **Do not run Lighthouse on every task or build group.** It is evidence to gather when performance is the question, not a
  ritual attached to unrelated work.
- **Do not chase a perfect score.** The number is a proxy. A design the human approved is not.
- **Do not trade away the approved design** to win a metric. If the two genuinely conflict, that is a
  finding for the human, not a decision to make inside an audit.
