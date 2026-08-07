---
name: performance-audit
description: Systematic performance audit for a Next.js + Supabase project — run automatically as part of Phase 5 (Preview & QA), right after Phase 4 Build, before showing the built page to the user. Catalogs grep-verified inconsistencies with file:line citations rather than generic advice — duplicate auth checks between middleware and pages, un-optimized bundle imports, dead dependencies, sequential queries that could run in parallel. Produces a prioritized plan (criticality / impact / rationale) and implements it in verified phases. Also invoke on explicit request ("audit performance", "is this slow", "optimize this").
---

# Performance Audit

The rule that matters most here: **every finding must be provable by grep or by reading the actual file, not recalled from "common Next.js issues."** A finding without a file:line citation isn't a finding yet.

## When to run this

Automatically, as a standard step of Phase 5, immediately after Phase 4 Build finishes and before presenting the page to the user — not something the user has to remember to request. Re-run it after any later pass that touches shared components, data-fetching, or dependencies in a meaningful way; skip it after a small, isolated copy or styling tweak.

## What to check

**1. Duplicate auth/session verification.** If there's a middleware (`proxy.ts`/`middleware.ts`) that checks the session, and a separate page-level helper that also calls the equivalent of `auth.getUser()` + a profile query, check whether both run on every navigation. `React.cache()` only deduplicates calls within a single render pass — it does **not** deduplicate across the middleware→page boundary, since those are separate execution phases. If both are verified to run on every request, the fix is: middleware sets the verified result on trusted **request** headers via `Headers.set()` (never `.append()`, since `.set()` unconditionally overwrites anything a client tried to send under the same header name) after validating; the page-level helper reads those headers first and only falls back to a full re-check when they're absent. Document explicitly why the header can be trusted (who sets it, and that the real data access still goes through RLS with the actual session cookie regardless — the header only saves a redundant lookup, it isn't itself the security boundary).

**2. Bundle imports.** Check `next.config.ts` for `experimental.optimizePackageImports`. Grep for any package imported as a single barrel (`import { X } from "some-package"` where that package re-exports many submodules from one index — `radix-ui`'s consolidated package is a known example) and confirm whether it's in Next's **default-optimized** list before assuming it needs to be added manually (check `node_modules/next/dist/server/config-shared.d.ts` for the current default list — `lucide-react` and several common icon/utility libraries are already covered by default and don't need re-adding).

**3. Dead dependencies and dead code.** For each `dependencies` entry in `package.json`, grep `src/` for an actual import. A hook whose return value gets unconditionally overridden by a later prop spread (e.g. a shared wrapper component that calls a theming hook but every caller already passes an explicit prop that wins) is dead code shipping an unused dependency to the client bundle — look for this pattern in shared UI wrappers specifically, since it's easy to introduce when scaffolding from a template that assumed a feature (like a theme switcher) the project doesn't actually use.

**4. Query parallelization.** For each Server Component page, check whether independent queries are awaited sequentially instead of via `Promise.all`. Look specifically for the case where a second query's input *could* already be known from a URL param or prior state without needing the first query's result — that's a query that can be kicked off in parallel and only needs to fall back to sequential in the rarer case where the param truly is missing.

**5. `package.json` hygiene.** CLI-only tooling (a scaffolding CLI like `shadcn`, not imported anywhere at runtime) listed under `dependencies` instead of `devDependencies` — check with the same grep-for-imports approach as item 3.

## Process

1. Grep and read broadly first — both the **shared component's own definition** and its **real usage sites** across the app. The definition alone can be misleading: a `size="lg"` button variant might be declared as one height in the component file while every actual call site overrides it to a different height by hand, meaning the "real" default in practice is the overridden value, not the declared one. This same principle (catalog real usage, not just declarations) is also the core method behind consistency/Atomic Design audits — see `docs/design-guide.md`.
2. Present a plan before changing anything: a table with criticality, performance impact, and the concrete rationale (file:line) behind each item, phased by risk (dependency/config changes and query parallelization are low-risk; anything touching the auth boundary is higher-risk and gets its own phase with extra verification).
3. Implement in phases, running `tsc --noEmit`, `npm run lint`, and `npm run build` after each phase — not just once at the end.
4. For any change that touches the auth boundary specifically, add an explicit security check before calling it done — for example, a forged-header request against a running dev server confirming the trusted header can't be spoofed by a client. Code review alone isn't enough evidence for a security-sensitive performance change.
