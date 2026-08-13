---
name: emil-design-eng
description: Motion and micro-interaction craft — whether something should animate at all, easing and timing, springs, interruptibility, gesture feedback, reduced motion, and animation performance. Use when adding or refining interactive motion, or when an interface works but feels flat.
---

# Motion and Interaction Craft

Specialized knowledge about how motion should behave. It carries no workflow and no authority: it does not
review, approve, reject or gate anything, and it does not decide what gets built. The Reviewer is the
independent gate; `design-system.md` is the approved visual contract; this skill informs the work inside
both.

**The design system decides the motion register.** Whether this product is quiet and precise or springy and
playful is an approved decision, not one to make here. Everything below is how to execute a register well —
the numbers are starting points that a contract, a platform constraint or a measurement can all override.

**The general design rules live elsewhere.** Typography, colour, layout and spacing belong to
`frontend-design`; component identity and reuse belong to `atomic-design`. What is here is motion.

**On scope, because two files can look like they disagree.** This file and
`frontend-design/reference/motion-design.md` state different durations and different easings. Both are
right within a scope neither names: the tighter rules here govern **interactive** motion, where the user is
waiting on a response, and the longer ones there govern **presentational** motion, where the user is
watching. Apply the scope before either file's unqualified phrasing.

---

## 1. Should this animate at all?

The strongest predictor is **how often the user will see it**.

| Frequency | Usually |
|---|---|
| 100+ times/day — command palette, shortcuts | No animation |
| Tens of times/day — hover, list navigation | Minimal, or none |
| Occasional — modals, drawers, toasts | Standard animation |
| Rare — onboarding, celebration, first run | Room for delight |

Something opened a hundred times a day wants to be *there*, not to arrive. Raycast has no open/close
animation, and that is the right call for what it is. The variable is frequency and the user's intent, not
the input device — a rarely-used keyboard shortcut is not the same case as a constant one.

Then: **why does this animate?** A good answer is spatial consistency, state indication, explanation,
feedback, or preventing a jarring appearance. "It looks cool" is a valid answer only where the user will
rarely see it.

## 2. Easing

```
entering or exiting  → ease-out (starts fast, reads as responsive)
moving or morphing   → ease-in-out
hover, colour        → ease
constant motion      → linear
```

**Built-in CSS easings are weak.** Custom curves carry more intent:

```css
--ease-out:    cubic-bezier(0.23, 1, 0.32, 1);   /* UI interactions */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen movement */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* drawers, sheets */
```

**`ease-in` rarely suits something the user just triggered.** It delays the movement at exactly the moment
they are watching most closely, so a 300ms `ease-in` dropdown *feels* slower than a 300ms `ease-out` one.
That is a fact about attention, not a prohibition — an element leaving under its own momentum can be a
legitimate use.

## 3. Duration

| Element | Duration |
|---|---|
| Button press feedback | 100–160ms |
| Tooltips, small popovers | 125–200ms |
| Dropdowns, selects | 150–250ms |
| Modals, drawers | 200–500ms |
| Marketing / explanatory | Longer is fine |

Interactive motion above ~300ms starts to read as waiting. Below that, faster generally feels better: a
180ms select feels more responsive than a 400ms one, and a faster spinner makes an identical load feel
quicker. A deliberately languid, cinematic register is a real direction — when the contract asks for it,
these numbers move.

## 4. Interruptibility

The property that separates motion that feels alive from motion that feels scripted.

- **Springs keep their velocity when interrupted.** Keyframes restart from zero. For anything a user can
  reverse mid-motion — a drag, a rapidly toggled panel — that difference is the whole experience.
- **CSS transitions can be retargeted mid-flight**; keyframe animations cannot. For rapidly triggered UI,
  transitions are usually smoother.
- Springs suit drag with momentum, gestures, and elements meant to feel physical. Duration-based easing
  suits everything where you want a predictable, repeatable timing.

Bounce is a register decision. Subtle (0.1–0.3) reads as quality in most product UI; more is right for a
playful direction and wrong for a serious one. `design-system.md` says which this is.

## 5. Performance

**Prefer `transform` and `opacity`.** They are the two properties the compositor can animate without layout
or paint, which is why they hold up when the main thread is busy. Animating `width`, `height`, `padding` or
`margin` costs layout every frame.

That is a cost, not a ban. Sometimes the honest expression of a change *is* a size change — a
`grid-template-rows` transition for a genuinely unknown height is the common example. Reach for the cheap
properties first, and when you need an expensive one, measure it under load rather than assuming.

**CSS beats JS under load.** CSS animations run off the main thread; anything driven by
`requestAnimationFrame` drops frames while the browser is loading or painting. Use CSS for predetermined
motion and JS for dynamic, interruptible motion.

**Check what the project actually has.** Motion libraries are a per-project dependency, not a given. Read
`package.json` before importing one, and before applying any library-specific advice.

## 6. Accessibility

**`prefers-reduced-motion` is not optional, and it does not mean "no motion".** It means less movement and
gentler motion. Keep opacity and colour transitions that aid comprehension; remove movement, parallax and
position changes.

```css
@media (prefers-reduced-motion: reduce) {
  .element { animation: fade 0.2s ease; }
}
```

**Gate hover motion behind capability.** Touch devices fire hover on tap, so an unguarded hover animation
misfires on every mobile press.

```css
@media (hover: hover) and (pointer: fine) {
  .element:hover { transform: scale(1.05); }
}
```

---

## References

Loaded on demand. None of this is needed to decide whether or how something should animate.

| File | For |
|---|---|
| `references/component-patterns.md` | Press feedback, entrances, popover origin, tooltips, blur masking, `@starting-style`, spring config, library caveats |
| `references/motion-recipes.md` | Transforms, `clip-path`, gestures and drag, stagger, and how to debug motion |
