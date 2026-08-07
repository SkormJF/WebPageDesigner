# Motion Design

## Scope first — this file and `emil-design-eng` are both loaded

Both documents are in context at the same time, and read carelessly they appear to contradict each other on four points. They don't: each states a rule that is correct **within a scope it never names**. The adjudication below is authoritative — apply it before either document's unqualified phrasing.

The dividing line is **interactive vs. presentational**:

- **Interactive motion** responds to the user right now — a button press, a toggle, a menu opening, a hover. The user is waiting on it. `emil-design-eng`'s tighter constraints govern here.
- **Presentational motion** plays on its own — a hero reveal, a page-load stagger, a scroll entrance. The user is watching, not waiting. The longer durations in this file govern here.

| Question | Answer |
|---|---|
| Use `ease`? | Only for small, reversible state changes where the curve is barely perceptible — hover, color, opacity. For anything that travels a distance, use a directional curve. Neither file is wrong; they were talking about different motions. |
| Use `ease-in`? | **Never for something entering** — it lags at the start and reads as broken. Fine for something **leaving**, where the slow start goes unwatched and the exit accelerates away. |
| Bounce / spring? | A spring that **settles** without visible overshoot is good craft — that is what `emil-design-eng` means. A visible bouncy rebound is the dated effect this file warns about. Critically damped: yes. Elastic: no. |
| Duration ceiling? | **Interactive: under 300ms.** Presentational: the 500–800ms in the table below is fine. A 600ms dropdown is broken; a 600ms hero reveal is not. |

When the two documents still seem to conflict after applying this, prefer the **tighter** constraint. A too-fast animation is a missed opportunity; a too-slow one is a bug the user feels on every interaction.

## Duration: The 100/300/500 Rule

Timing matters more than easing. These durations feel right for most UI:

| Duration | Use Case | Examples |
|----------|----------|----------|
| **100-150ms** | Instant feedback | Button press, toggle, color change |
| **200-300ms** | State changes | Menu open, tooltip, hover states |
| **300-500ms** | Layout changes | Accordion, modal, drawer |
| **500-800ms** | Entrance animations | Page load, hero reveals |

**Exit animations are faster than entrances**—use ~75% of enter duration.

## Easing: Pick the Right Curve

**Don't use `ease`.** It's a compromise that's rarely optimal. Instead:

| Curve | Use For | CSS |
|-------|---------|-----|
| **ease-out** | Elements entering | `cubic-bezier(0.16, 1, 0.3, 1)` |
| **ease-in** | Elements leaving | `cubic-bezier(0.7, 0, 0.84, 0)` |
| **ease-in-out** | State toggles (there → back) | `cubic-bezier(0.65, 0, 0.35, 1)` |

**For micro-interactions, use exponential curves**—they feel natural because they mimic real physics (friction, deceleration):

```css
/* Quart out - smooth, refined (recommended default) */
--ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);

/* Quint out - slightly more dramatic */
--ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);

/* Expo out - snappy, confident */
--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
```

**Avoid bounce and elastic curves.** They were trendy in 2015 but now feel tacky and amateurish. Real objects don't bounce when they stop—they decelerate smoothly. Overshoot effects draw attention to the animation itself rather than the content.

## The Only Two Properties You Should Animate

**transform** and **opacity** only—everything else causes layout recalculation. For height animations (accordions), use `grid-template-rows: 0fr → 1fr` instead of animating `height` directly.

## Staggered Animations

Use CSS custom properties for cleaner stagger: `animation-delay: calc(var(--i, 0) * 50ms)` with `style="--i: 0"` on each item. **Cap total stagger time**—10 items at 50ms = 500ms total. For many items, reduce per-item delay or cap staggered count.

## Reduced Motion

This is not optional, and the affected population is larger than most people assume. A national US health survey found **vestibular dysfunction in ~35% of adults aged 40+**, measured by balance testing — note that's *dysfunction detected on a test*, not *diagnosed disorder*; only a subset were clinically symptomatic. Either way it's tens of millions of people, and motion sensitivity also covers migraine and concussion recovery, which the survey didn't count at all. (Agrawal et al., *Arch Intern Med.* 2009;169(10):938–944 — <https://pubmed.ncbi.nlm.nih.gov/19468085/>)

```css
/* Define animations normally */
.card {
  animation: slide-up 500ms ease-out;
}

/* Provide alternative for reduced motion */
@media (prefers-reduced-motion: reduce) {
  .card {
    animation: fade-in 200ms ease-out;  /* Crossfade instead of motion */
  }
}

/* Don't forget scrolling — this is the big one */
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
}
```

**`scroll-behavior: smooth` is the most common thing people forget to disable**, and for vestibular sensitivity it's a stronger trigger than most element animations — the whole viewport moves, filling peripheral vision. If the project sets `scroll-behavior: smooth` anywhere (and the sticky-header rule in `navigation-shell` means it usually does), it has to be reverted under `reduce`.

**What to preserve**: functional animation still has to work — progress bars, loading spinners, focus indicators, and anything communicating state. Strip the *spatial travel*, keep the *information*.

### About the global "kill everything" snippet

You'll see this pattern widely recommended:

```css
/* ⚠️ Diagnostic tool — not a shipping pattern */
*, *::before, *::after {
  animation-duration: 0.01ms !important;
  transition-duration: 0.01ms !important;
}
```

It is useful for *auditing* — drop it in temporarily to find what breaks without motion. But shipping it contradicts the paragraph above: it kills the progress bars, spinners, and state transitions you were just told to keep, and users who set `reduce` still need those to understand what the interface is doing.

The preference is named **reduce**, not *remove*. Handle it per component — crossfade instead of slide, instant instead of staggered — rather than with one global switch.

## Perceived Performance

**Nobody cares how fast your site is—just how fast it feels.** Perception can be as effective as actual performance.

**The ~100ms threshold**: response within roughly 100ms reads as instantaneous — the user feels they caused the result directly, with no intermediate feedback needed. This is the classic HCI figure (Card, Robertson & Mackinlay; popularized as Nielsen's 100ms / 1s / 10s limits), and it's the target for micro-interaction feedback. Past ~1s the flow of thought breaks and you owe the user a visible indicator.

**Active vs passive time**: Passive waiting (staring at a spinner) feels longer than active engagement. Strategies to shift the balance:

- **Preemptive start**: Begin transitions immediately while loading (iOS app zoom, skeleton UI). Users perceive work happening.
- **Early completion**: Show content progressively—don't wait for everything. Video buffering, progressive images, streaming HTML.
- **Optimistic UI**: Update the interface immediately, handle failures gracefully. Instagram likes work offline—the UI updates instantly, syncs later. Use for low-stakes actions; avoid for payments or destructive operations.

**Easing affects perceived duration**: Ease-in (accelerating toward completion) makes tasks feel shorter because the peak-end effect weights final moments heavily. Ease-out feels satisfying for entrances, but ease-in toward a task's end compresses perceived time.

**Caution**: Too-fast responses can decrease perceived value. Users may distrust instant results for complex operations (search, analysis). Sometimes a brief delay signals "real work" is happening.

## Performance

Don't use `will-change` preemptively—only when animation is imminent (`:hover`, `.animating`). For scroll-triggered animations, use Intersection Observer instead of scroll events; unobserve after animating once. Create motion tokens for consistency (durations, easings, common transitions).

---

**Avoid**: Animating everything (animation fatigue is real). Using >500ms for UI feedback. Ignoring `prefers-reduced-motion`. Using animation to hide slow loading.
