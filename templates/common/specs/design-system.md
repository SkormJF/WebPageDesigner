# DESIGN SYSTEM — [PROJECT_NAME]

<!-- SLOT: Owns the approved visual contract, copied from the Artifact a human approved rather than
     re-derived from taste; a value differing from it is a defect regardless of which is better. Named
     system decisions are durable, component-local literals need not become global tokens. No draft
     history, no review commentary, no inventory of every CSS literal.
     Every SLOT comment must be removed before the Spec Gate will pass. -->

## Approval

- **Approved on:** [TBD — YYYY-MM-DD]
- **Approved from:** [TBD — Artifact URL]
- **Decisions approved:** palette · typography · buttons · layout · backgrounds · tone [· auth/panel shell]

## Concept

<!-- SLOT: One or two sentences on what this system does and why it fits this product. Not adjectives. -->

[TBD]

---

## Color

| Token | Value | Role |
|---|---|---|
| `--color-primary` | [TBD] | [TBD] |
| `--color-accent` | [TBD] | [TBD] |
| `--color-surface` | [TBD] | [TBD] |
| `--color-text` | [TBD] | [TBD] |

**Contrast verified:** [TBD — the pairs actually measured and their ratios; body 4.5:1, large text and UI 3:1.
Write `UNVERIFIED` for anything that was not measured; the full audit runs at the Quality Gate.]

<!-- SLOT: Every colour is a token, placeholder tones included — build those from existing tokens, and if
     none fits, add one here. -->

## Typography

| Role | Family | Weights | Size | Line height |
|---|---|---|---|---|
| Display | [TBD] | [TBD] | [TBD] | [TBD] |
| Heading | [TBD] | [TBD] | [TBD] | [TBD] |
| Body | [TBD] | [TBD] | [TBD] | [TBD] |
| Small | [TBD] | [TBD] | [TBD] | [TBD] |

- **Base size:** [TBD]
- **Loading:** [TBD — self-hosted or framework font loader; never a CDN link at runtime]

<!-- SLOT: A base size raised for a stated reading-comfort need is recorded here as an accessibility
     decision with its reason, so a later pass does not shrink it back. -->

## Spacing and rhythm

- **Base unit:** [TBD]
- **Scale:** [TBD]
- **Section rhythm:** [TBD]
- **Content measure:** [TBD]

## Surfaces

<!-- SLOT: Radii come from one token scale and nowhere else. -->

| Surface | Background | Border | Radius | Shadow |
|---|---|---|---|---|
| [TBD] | [TBD] | [TBD] | [TBD] | [TBD] |

---

## Control sizes

<!-- SLOT: Two tiers is usually enough, declared on the component variants so no call site needs a one-off
     override. The values are this project's — a dense data tool and a booking flow share no number. -->

| Tier | Height | Used by |
|---|---|---|
| Compact | [TBD] | [TBD — secondary and inline actions] |
| Standard | [TBD] | [TBD — form fields and primary actions] |

**Touch targets:** WCAG 2.2 AA requires 24×24 (SC 2.5.8), AAA 44×44 (SC 2.5.5). A compact tier above the AA floor
is compliant, not a defect; grow a small target with padding rather than shrinking its visual box.
**Accessibility outranks the hierarchy:** if this audience needs larger targets, the scale is rebuilt around that,
with the reason recorded here.

## Interaction states

<!-- SLOT: Fixed once on the component, never improvised per section. -->

| State | Buttons | Inputs | Links |
|---|---|---|---|
| Default | [TBD] | [TBD] | [TBD] |
| Hover | [TBD] | [TBD] | [TBD] |
| Focus (keyboard) | [TBD] | [TBD] | [TBD] |
| Active | [TBD] | [TBD] | — |
| Disabled | [TBD] | [TBD] | — |
| Loading | [TBD] | — | — |
| Error | — | [TBD] | — |

**Focus is never removed.** It may be replaced with a better indicator; it may not be deleted.

## Component visual rules

| Component | Rules |
|---|---|
| [TBD] | [TBD] |

---

## Responsive behaviour

| Breakpoint | Width | What changes |
|---|---|---|
| Mobile | [TBD] | [TBD] |
| Tablet | [TBD] | [TBD] |
| Desktop | [TBD] | [TBD] |
| Wide | [TBD] | [TBD] |

## Motion

- **Timing:** [TBD]
- **Easing:** [TBD]
- **What animates:** [TBD]

**Reduced motion:** every animation has a still path under `prefers-reduced-motion`. Not a preference, not traded
away.

## Media direction

<!-- SLOT: What imagery this product uses and never uses. With no photographs, what stands in for them, built
     from tokens. -->

[TBD]

## Deliberate departures

<!-- SLOT: Something normally avoided that the human asked for, recorded as their decision with its reason,
     so a later pass does not "fix" it back. Never here: contrast below AA, removed focus indicators, motion
     with no reduced-motion path, text baked into images, a custom cursor — not theirs to trade away. -->

- [TBD, or "none"]
