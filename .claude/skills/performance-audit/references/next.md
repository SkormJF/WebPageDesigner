# Next-specific performance checks

Generated projects run on the fixed Next stack profile. This reference covers the Next-specific part of the audit; none of
it applies, and the cross-stack checks in `SKILL.md` are the whole audit.

## Duplicate auth/session verification across the middleware boundary

If there is a `proxy.ts`/`middleware.ts` that checks the session, and a separate page-level helper that also
calls the equivalent of `auth.getUser()` plus a profile query, check whether both run on every navigation.

`React.cache()` only deduplicates calls **within a single render pass**. It does *not* deduplicate across
the middleware → page boundary, because those are separate execution phases. This is the detail that makes
the duplication invisible in code review.

If both are verified to run on every request, the shape of the fix is:

- middleware validates, then sets the verified result on trusted **request** headers via `Headers.set()` —
  never `.append()`, since `.set()` unconditionally overwrites anything a client tried to send under the
  same header name;
- the page-level helper reads those headers first and falls back to a full re-check only when they are
  absent.

Document explicitly why the header can be trusted: who sets it, and that real data access still goes through
RLS with the actual session cookie regardless. The header saves a redundant lookup; it is not itself the
security boundary.

**This is the highest-risk item in any performance audit.** Propose it as its own separately-verified piece
of work, and require a forged-header request as proof that the trusted header cannot be spoofed. Code review
is not evidence here.

## `optimizePackageImports`

Check `next.config.ts` for `experimental.optimizePackageImports`.

Before adding a package manually, confirm it is not already in Next's **default-optimized** list — check
`node_modules/next/dist/server/config-shared.d.ts` for the current defaults. `lucide-react` and several
common icon and utility libraries are already covered and do not need re-adding. `radix-ui`'s consolidated
package is a real example of one worth checking.

## Server Components and data flow

- A `"use client"` directive on a component that does not need it pulls its whole import graph into the
  browser bundle. Walk the boundary and find the highest component that genuinely needs interactivity.
- Independent `await`s in a Server Component page run sequentially unless wrapped in `Promise.all`.
- Large serialized props crossing the server→client boundary cost both bandwidth and hydration time. Pass
  the minimum the client component actually reads.

## Image and font primitives

- `next/image` needs `priority` on the LCP image and explicit `sizes` for responsive images; without
  `sizes`, it over-fetches.
- `next/font` self-hosts and eliminates the render-blocking request. Confirm every font token in `@theme`
  names a variable that some `next/font` call actually declares — a token pointing at an undefined name
  resolves to nothing and the page silently falls back to the browser default.
