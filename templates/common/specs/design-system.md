# DESIGN SYSTEM — [PROJECT_NAME]

<!-- SLOT: This file owns the approved visual contract. Every value here was approved by a human in
     the Artifact -- it is copied from what they saw, not re-derived afterwards from taste. If a
     value in this file differs from the Artifact the human approved, that is a defect, regardless
     of which value is better.
     Every SLOT comment must be removed before the Spec Gate will pass. -->

## Approval

- **Approved on:** [TBD — YYYY-MM-DD]
- **Approved from:** [TBD — Artifact URL]
- **Elements approved individually:** palette · typography · buttons · layout · backgrounds · tone [· auth/panel shell]

## Concept

<!-- SLOT: One or two sentences on what this system is doing and why it fits this product. The
     thread that makes the rest cohere. Not adjectives. -->

[TBD]

---

## Color

| Token | Value | Role |
|---|---|---|
| `--color-primary` | [TBD] | [TBD] |
| `--color-accent` | [TBD] | [TBD] |
| `--color-surface` | [TBD] | [TBD] |
| `--color-text` | [TBD] | [TBD] |

**Contrast verified:** [TBD — which pairs were checked and their ratios. Body text 4.5:1, large text
and UI components 3:1. A palette that has not been measured has not been checked.]

<!-- SLOT: Every colour the product uses is a token. A literal colour value written into a component
     is the drift this file exists to prevent, and it almost always arrives through a placeholder --
     the gradient standing in for a photo that has not been sent, the empty state, the tinted swatch.
     They feel temporary, so a raw value gets typed instead of a token, and then the placeholder
     outlives the excuse. Build placeholder tones from existing tokens. If none fits, the palette is
     missing one: add it here. -->

## Typography

| Role | Family | Weights | Size | Line height |
|---|---|---|---|---|
| Display | [TBD] | [TBD] | [TBD] | [TBD] |
| Heading | [TBD] | [TBD] | [TBD] | [TBD] |
| Body | [TBD] | [TBD] | [TBD] | [TBD] |
| Small | [TBD] | [TBD] | [TBD] | [TBD] |

- **Base size:** [TBD]
- **Loading:** [TBD — self-hosted or framework font loader; never a CDN link at runtime]

<!-- SLOT: If the base size was raised because a human revealed a reading-comfort need rather than a
     preference, record it here as an accessibility decision with that reason attached. It stops a
     later polish pass from reading it as an oversight and shrinking it back. This is conditional --
     only when the condition actually appeared. -->

## Spacing and rhythm

- **Base unit:** [TBD]
- **Scale:** [TBD]
- **Section rhythm:** [TBD]
- **Content measure:** [TBD]

## Surfaces

<!-- SLOT: Elevation, borders, radii, shadows. Radii come from one token scale and nowhere else --
     an arbitrary radius on a call site is the same class of drift as a raw colour value. -->

| Surface | Background | Border | Radius | Shadow |
|---|---|---|---|---|
| [TBD] | [TBD] | [TBD] | [TBD] | [TBD] |

---

## Control sizes

<!-- SLOT: Two heights cover nearly every interactive control. They are assigned to the component
     variants themselves, so no call site ever needs a one-off height override.
     Decided before the build, not after: a component's declared default is not what pages end up
     using unless it was chosen with real content in mind, and once every instance has its own
     override the same final height arrives via a different padding/font-size combination in each
     file. That stops being a one-line fix at about a dozen occurrences. -->

| Tier | Height | Used by |
|---|---|---|
| Compact | [TBD ~32px] | Secondary and inline actions, icon-only row actions, badges |
| Standard | [TBD ~44px] | Every form field and every primary action button |

**Touch targets:** the standard tier clears WCAG 2.2 AAA (SC 2.5.5). The compact tier is comfortably AA
(SC 2.5.8, 24×24) and **must not be inflated to 44px by a later pass** — doing that flattens the size
hierarchy this scale exists to create. Where a target is genuinely small, grow the hit area with padding
before shrinking the visual box.

## Interaction states

<!-- SLOT: Fixed once on the component, never improvised per section. A static reference can only
     ever show the default, which is exactly why these get written down: left undeclared, each
     section invents its own version and they drift. -->

| State | Buttons | Inputs | Links |
|---|---|---|---|
| Default | [TBD] | [TBD] | [TBD] |
| Hover | [TBD] | [TBD] | [TBD] |
| Focus (keyboard) | [TBD] | [TBD] | [TBD] |
| Active | [TBD] | [TBD] | — |
| Disabled | [TBD] | [TBD] | — |
| Loading | [TBD] | — | — |
| Error | — | [TBD] | — |

**Focus is never removed.** A focus indicator may be replaced with a better one; it may not be deleted.

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

**Reduced motion:** every animation has a still path under `prefers-reduced-motion`. This is not a
preference and does not get traded away — it costs nothing and it is the difference between a page that
works and one that makes someone ill.

## Media direction

<!-- SLOT: What imagery this product uses and what it never uses. If there are no photographs, say
     what stands in for them and build it from tokens. -->

[TBD]

## Deliberate departures

<!-- SLOT: Where the human asked for something that is normally avoided -- a heavily blurred surface,
     a dark page with a glow, oversized display type, pronounced motion -- record it here as their
     decision, with the one-line reason. Two things follow from writing it down: a later pass does
     not "fix" it back, and the project's own quality checks are updated so the build is not failed
     against a default the human deliberately overruled.
     What never appears in this section: contrast below AA, removed focus indicators, motion with no
     reduced-motion path, text baked into images, or a custom cursor that replaces the system one.
     Those are not taste, and they are not the human's to trade away on someone else's behalf. -->

- [TBD, or "none"]
