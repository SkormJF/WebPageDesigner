---
name: performance-audit
description: Diagnose performance in a built project — measure, interpret the evidence, locate causes with file:line citations, and propose concrete corrections in priority order. It diagnoses; it does not implement. Use as a Quality Gate input, or on explicit request ("audit performance", "is this slow", "why is this heavy").
---

# Performance Audit

The rule that matters most here: **every finding must be provable by grep or by reading the actual file, not recalled from "common Next.js issues."** A finding without a file:line citation isn't a finding yet.

## When to run this

As a Quality Gate input, once the build is complete and before deploy readiness is claimed — not something the user has to remember to request. Re-run it after any later pass that touches shared components, data-fetching, or dependencies in a meaningful way; skip it after a small, isolated copy or styling tweak.

## Targets

Measure against these, and interpret rather than chase. A perfect score bought by gutting the approved
design is a failed audit — the design was approved by a human and the score was not.

| Metric | Target | What it actually measures |
|---|---|---|
| LCP | < 2.5s | How fast the main content appears |
| INP | < 200ms | How fast the page answers an interaction |
| CLS | < 0.1 | How much the layout moves while loading |

The wins that are almost always available, in rough order of payoff:

- **The hero image is the LCP element.** Prioritise it explicitly; lazy-loading it is a common own goal.
- **Give every image explicit dimensions.** Missing width and height is the most frequent CLS cause.
- **Load only the font weights in use**, with a swap strategy, and prefer a variable face over five files.
- **Keep the client boundary tight.** A client directive on a component that does not need one drags its
  whole import graph into the browser bundle.
- **Import from source, not barrels.** A barrel re-export can cost hundreds of milliseconds of import time
  for one symbol.
- **Defer below-the-fold and third-party work** until after hydration.

## What to check

**1. Duplicate auth/session verification.** If there's a middleware (`proxy.ts`/`middleware.ts`) that checks the session, and a separate page-level helper that also calls the equivalent of `auth.getUser()` + a profile query, check whether both run on every navigation. `React.cache()` only deduplicates calls within a single render pass — it does **not** deduplicate across the middleware→page boundary, since those are separate execution phases. If both are verified to run on every request, the fix is: middleware sets the verified result on trusted **request** headers via `Headers.set()` (never `.append()`, since `.set()` unconditionally overwrites anything a client tried to send under the same header name) after validating; the page-level helper reads those headers first and only falls back to a full re-check when they're absent. Document explicitly why the header can be trusted (who sets it, and that the real data access still goes through RLS with the actual session cookie regardless — the header only saves a redundant lookup, it isn't itself the security boundary).

**2. Bundle imports.** Check `next.config.ts` for `experimental.optimizePackageImports`. Grep for any package imported as a single barrel (`import { X } from "some-package"` where that package re-exports many submodules from one index — `radix-ui`'s consolidated package is a known example) and confirm whether it's in Next's **default-optimized** list before assuming it needs to be added manually (check `node_modules/next/dist/server/config-shared.d.ts` for the current default list — `lucide-react` and several common icon/utility libraries are already covered by default and don't need re-adding).

**3. Dead dependencies and dead code.** For each `dependencies` entry in `package.json`, grep `src/` for an actual import. A hook whose return value gets unconditionally overridden by a later prop spread (e.g. a shared wrapper component that calls a theming hook but every caller already passes an explicit prop that wins) is dead code shipping an unused dependency to the client bundle — look for this pattern in shared UI wrappers specifically, since it's easy to introduce when scaffolding from a template that assumed a feature (like a theme switcher) the project doesn't actually use.

**4. Query parallelization.** For each Server Component page, check whether independent queries are awaited sequentially instead of via `Promise.all`. Look specifically for the case where a second query's input *could* already be known from a URL param or prior state without needing the first query's result — that's a query that can be kicked off in parallel and only needs to fall back to sequential in the rarer case where the param truly is missing.

**5. `package.json` hygiene.** CLI-only tooling (a scaffolding CLI like `shadcn`, not imported anywhere at runtime) listed under `dependencies` instead of `devDependencies` — check with the same grep-for-imports approach as item 3.

## This skill diagnoses. It does not implement.

Measure, interpret, locate the cause, and propose the correction with enough precision that someone else can
apply it. The Builder implements, under a task, and the Reviewer gates the result. That separation is what
keeps a performance pass from quietly becoming an unreviewed refactor.

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

- **Do not run Lighthouse on every task.** It is evidence to gather when performance is the question, not a
  ritual attached to unrelated work.
- **Do not chase a perfect score.** The number is a proxy. A design the human approved is not.
- **Do not trade away the approved design** to win a metric. If the two genuinely conflict, that is a
  finding for the human, not a decision to make inside an audit.
