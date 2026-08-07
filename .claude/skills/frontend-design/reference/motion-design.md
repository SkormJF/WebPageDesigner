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

## Ambitious motion: the four techniques worth knowing

Most pages need none of this. When a client asks for something choreographed — an entrance sequence, one element carrying across a navigation, a gallery that feels like it has weight — these are the tools that actually deliver it, and knowing which is safe saves rebuilding.

### 1. Element carries across a navigation → View Transitions API

This is the "click a card and it expands into the next screen" effect. The browser animates between two DOM states for you; you don't hand-animate anything.

**Baseline: newly available since 2025-10-14** (Chrome 111, Safari 18, Firefox 144 — verified against the W3C Baseline data, not a blog). Safe to use, still worth a fallback since "newly" means recently-universal, not universally-updated.

```css
/* The shared element gets a name on both screens. That's the whole trick. */
.hero-image { view-transition-name: product-hero; }

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*),
  ::view-transition-old(*),
  ::view-transition-new(*) { animation: none !important; }
}
```

```js
if (document.startViewTransition) {
  document.startViewTransition(() => updateTheDOM());
} else {
  updateTheDOM();  // no transition, same result
}
```

Two constraints that bite: a `view-transition-name` must be **unique on the page** — two elements sharing one silently disables the transition — and the old and new elements must both exist at their respective moments, so it doesn't work across a full page reload without the cross-document variant.

### 2. Exit animations → `transition-behavior: allow-discrete`

Anything that leaves by hitting `display: none`, or that lives in the top layer (`<dialog>`, `popover`), **does not animate out**. It vanishes. The entrance works, the exit doesn't, and it looks broken in a way that's hard to name.

```css
.panel {
  transition: opacity 200ms, transform 200ms, display 200ms allow-discrete;
}
@starting-style { .panel { opacity: 0; transform: translateY(8px); } }
.panel[hidden] { opacity: 0; transform: translateY(8px); }

/* Dialogs and popovers also need the overlay property, or the backdrop jumps. */
dialog { transition: opacity 200ms, overlay 200ms allow-discrete, display 200ms allow-discrete; }
```

`@starting-style` gives the entry values; `allow-discrete` is what lets `display` participate at all. You need both, and this is the single most common reason a hand-rolled modal animates in and snaps out.

### 3. Spring feel without a JS dependency → `linear()`

`linear()` approximates any curve with a list of stops, so a real spring is now a CSS value. Baseline widely available since mid-2026.

```css
/* Settles with weight. No overshoot — see the scope note at the top of this file. */
--ease-spring: linear(0, 0.006, 0.025, 0.101, 0.539, 0.826, 0.949, 0.995, 1);
```

For a landing page this replaces a ~34kb animation dependency with about 200 bytes. Reach for Motion when you need orchestration, layout animation, or gesture — not for a single eased transition.

### 4. Scroll-driven reveals → Framer Motion, not CSS scroll timelines

`animation-timeline: scroll()` reads like the right answer and **is not Baseline** — support is still partial in major browsers, so it can't carry a load-bearing reveal. Use `useScroll` + `useMotionValueEvent` from Motion, which is already a project dependency, and drive `transform`/`opacity`.

Never `window.addEventListener("scroll")` — it fires on the main thread at scroll frequency and will jank on mobile.

## Sliders and horizontal galleries

A horizontal gallery is a scroll container, not a carousel widget, unless it genuinely needs to autoplay. CSS scroll-snap gives you the feel with none of the JS:

```css
.gallery { display: flex; gap: 1.5rem; overflow-x: auto; scroll-snap-type: x mandatory; overscroll-behavior-x: contain; }
.gallery > * { scroll-snap-align: start; flex: 0 0 min(80vw, 32rem); }
```

Three things people skip and shouldn't: it must be **keyboard reachable** (a scroll container needs `tabindex="0"` and an accessible name, or its children must be focusable), it must be **operable without dragging** — WCAG 2.2 SC 2.5.7 means prev/next buttons, not just swipe — and `overscroll-behavior-x: contain` stops the browser's back-swipe gesture firing when someone reaches the end.

If it autoplays, it also needs a pause control (SC 2.2.2), which is usually the argument for not autoplaying.

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
