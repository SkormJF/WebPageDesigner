# Component motion patterns

Concrete patterns for individual components. Each is a technique that works, not a requirement — the
approved motion register in `design-system.md` decides which of them this product wants, and the exact
values (durations, scales, radii) come from that contract wherever it states them.

## Press feedback

A small scale on `:active` acknowledges the press immediately, which is what makes an interface feel like it
heard you. Somewhere around `scale(0.95–0.98)` reads as responsive without looking rubbery.

```css
.button { transition: transform 160ms ease-out; }
.button:active { transform: scale(0.97); }
```

Whether this product uses press-scale at all — and at what value — is a design-system decision. Where the
contract declares an active state, that wins.

## Entrances

**Starting from `scale(0)` looks like an object appearing from nowhere.** Nothing in the physical world does
that. Starting from `0.9`–`0.95` with opacity gives the element a shape to grow from, and the entrance reads
as arrival rather than materialisation.

```css
.entering { transform: scale(0.95); opacity: 0; }
```

An exception worth knowing: a deliberately synthetic, digital direction may want exactly the artificial
version. That is a register choice.

## Popover origin

Popovers generally read better scaling from their trigger than from their own centre, because that is where
the user's attention already is.

```css
/* Radix */ .popover { transform-origin: var(--radix-popover-content-transform-origin); }
/* Base UI */ .popover { transform-origin: var(--transform-origin); }
```

**Modals are the exception** — they are not anchored to a trigger, so `transform-origin: center` is correct.

Whether the project has Radix or Base UI is visible in `components.json` and the installed component
source. Check before writing either variable name.

## Tooltips: skip the delay after the first

A delay before the first tooltip prevents accidental activation. Once one is open, opening adjacent ones
instantly makes a whole toolbar feel faster without giving up that protection.

```css
.tooltip {
  transition: transform 125ms ease-out, opacity 125ms ease-out;
  transform-origin: var(--transform-origin);
}
.tooltip[data-starting-style],
.tooltip[data-ending-style] { opacity: 0; transform: scale(0.97); }
.tooltip[data-instant] { transition-duration: 0ms; }
```

## Transitions over keyframes for interruptible UI

CSS transitions can be interrupted and retargeted mid-animation; keyframes restart from zero. For anything
triggered rapidly — stacking toasts, toggling state — transitions produce smoother results.

```css
.toast { transition: transform 400ms ease; }   /* interruptible */
```

## Blur to mask an imperfect crossfade

When a crossfade between two states feels wrong despite trying other easings and durations, a subtle
`filter: blur(2px)` during the transition often fixes it. Without blur you see two distinct objects
overlapping; blur blends them so the eye reads one thing changing.

```css
.button-content { transition: filter 200ms ease, opacity 200ms ease; }
.button-content.transitioning { filter: blur(2px); opacity: 0.7; }
```

Keep blur under 20px — heavy blur is expensive, especially in Safari.

## `@starting-style` for entry

The modern CSS way to animate entry without JavaScript:

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 400ms ease, transform 400ms ease;

  @starting-style { opacity: 0; transform: translateY(100%); }
}
```

This replaces the `useEffect` + `mounted` pattern. Use it where browser support allows; the
`data-mounted` attribute pattern remains the fallback.

## Spring configuration

Apple's parameterisation is easier to reason about:

```js
{ type: "spring", duration: 0.5, bounce: 0.2 }
```

Traditional physics gives more control:

```js
{ type: "spring", mass: 1, stiffness: 100, damping: 10 }
```

For decorative mouse-tracking, interpolating through a spring rather than binding directly to pointer
position is what gives the movement weight. Note that this is decoration: on a functional readout — a
figure in a banking app — no animation is the better answer.

## Library and platform caveats

**These apply only if the project actually has the dependency. Check `package.json` first.**

- **Motion / Framer Motion shorthand props (`x`, `y`, `scale`) are not hardware-accelerated.** They run
  through `requestAnimationFrame` on the main thread and drop frames while the page is loading. The full
  `transform` string is composited:

  ```jsx
  <motion.div animate={{ transform: "translateX(100px)" }} />
  ```

- **CSS custom properties inherit.** Changing one on a parent recalculates styles for every child, which is
  expensive in a long list. Set `transform` directly on the moving element instead of updating a shared
  `--offset` variable on its container.

- **WAAPI** gives JavaScript control with CSS performance — composited, interruptible, no library:

  ```js
  element.animate(
    [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0 0)' }],
    { duration: 1000, fill: 'forwards', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' },
  );
  ```
