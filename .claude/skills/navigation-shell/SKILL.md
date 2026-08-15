---
name: navigation-shell
description: Build the navigation chrome — sticky/scroll headers, mobile menus, dashboard sidebars, and the app shell they live in. Use whenever writing a header, nav, mobile menu or sidebar, and when reviewing one. Covers the accessibility criteria these components fail by default (WCAG 2.2 SC 2.4.11, 2.5.7, 1.4.13) and the CSS traps that silently break sticky positioning.
---

# Navigation Shell

Navigation is the highest-frequency artefact in any project here — every product has a header, every application has a sidebar — and it is where accessibility failures cluster, because the defaults look correct while being broken.

This skill supplies the patterns. It carries no workflow and no authority: it does not decide what gets
built, change phase, or override the approved design system.

Everything below is a rule with a reason. Where a rule cites a WCAG success criterion, that criterion is Level AA unless stated otherwise — meaning it's part of the accessibility baseline `CLAUDE.md`'s Quality Gate already commits every project to.

**This core assumes React and CSS, and nothing else.** No router, no component library, no motion library.
Generated projects here run on the fixed Next profile but still install dependencies per product — so before importing
anything named below, confirm it is in the project's own `package.json`. Router-, shadcn- and
motion-library-specific material lives in `references/stack-specific.md` and applies only where those
dependencies actually exist.

---

## Header / navbar

### 1. A sticky header without `scroll-padding-top` is an automatic AA failure

**WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum), Level AA** — new in 2.2 — requires that a component receiving keyboard focus is not entirely hidden by author content. Sticky headers are the textbook cause: Tab to a link just below the fold, the browser scrolls it to y=0, and it lands underneath the header. The user is now typing into something they cannot see.

Pair these two whenever a header is sticky or fixed. Not optional, not a polish item:

```css
/* globals.css */
:root { --header-h: 4rem; }

html { scroll-padding-top: calc(var(--header-h) + 1rem); }  /* keyboard focus + anchor links */
[id]  { scroll-margin-top:  calc(var(--header-h) + 1rem); }  /* anchor targets */
```

`scroll-padding-top` goes on the scroll container; `scroll-margin-top` goes on the target element. If the header hides on scroll, size the padding to the **expanded** height — focus can arrive while it's showing.

### 2. `position: sticky` fails silently in two specific ways

Both produce "sticky isn't working" with no error, and both are common in this codebase's own history.

**It needs a non-`auto` inset.** `sticky` with no `top`/`bottom` behaves as `relative`. Always write `sticky top-0`, never bare `sticky`.

**Any ancestor with `overflow` other than `visible` captures it.** A wrapper with `overflow-x-hidden` — the standard reflex fix for horizontal scroll on mobile — kills every sticky descendant beneath it.

```tsx
// ❌ the wrapper's overflow-x-hidden makes the header un-stick
<div className="overflow-x-hidden">
  <header className="sticky top-0">…</header>
</div>

// ✅ clip the content, not an ancestor of the sticky element
<header className="sticky top-0 z-40">…</header>
<main className="overflow-x-clip">…</main>
```

`overflow: clip` does not create a scroll container, so it contains overflow without breaking sticky. Reach for it before `hidden`.

### 3. `backdrop-blur` disappears under an animated opacity wrapper

Any ancestor with `opacity < 1`, `filter`, `mask`, `clip-path`, or `mix-blend-mode` becomes a *backdrop root*: the child's `backdrop-filter` then only blurs content between that ancestor and itself — i.e. nothing. An animated fade-in wrapping the header does exactly this, whatever library drives it, and the blur just quietly never appears.

Animate `transform` instead of `opacity` on that wrapper, or move the blur outside the animated subtree. Also give it a solid fallback — `backdrop-filter` is a progressive enhancement, and a translucent bar without blur is unreadable:

```tsx
<header className="bg-background/70 backdrop-blur-md supports-[not(backdrop-filter:blur(0))]:bg-background">
```

### 4. The active link needs `aria-current="page"`, not just a class

Styling communicates "you are here" to sighted users only. Without `aria-current`, a screen-reader user tabbing the nav gets no signal at all.

```tsx
export function NavLink({ href, currentPath, children }: NavLinkProps) {
  const isActive = currentPath === href;
  return (
    <a
      href={href}
      aria-current={isActive ? "page" : undefined}
      className="text-muted-foreground transition-colors aria-[current=page]:text-foreground aria-[current=page]:font-medium"
    >
      {children}
    </a>
  );
}
```

Two details: use `undefined` when inactive, never `aria-current={false}` — any non-enumerated string value is treated as `true`. And note the attribute doubles as the styling hook (`aria-[current=page]:`), so you don't need a parallel `isActive` class.

**Where the current path comes from is the router's business**, and the routers differ across profiles — see `references/stack-specific.md`. The ARIA above does not change with any of them.

### 5. Mobile menu: a disclosure, not a focus trap

If the menu stays in flow and the page remains visible, it's a **disclosure** — the APG pattern is a `<button aria-expanded aria-controls>` inside a labelled `<nav>`, Escape closes it and returns focus to the button, and there is **no focus trap**. Trapping focus in a non-modal dropdown strands keyboard users.

Only trap focus when the menu is a true modal overlay. In that case do not hand-roll the trap — use a dialog primitive that already handles trapping, labelling and restore-focus, or the platform `<dialog>` element. Getting focus containment right by hand is harder than it looks and it fails silently.

```tsx
export function MobileNav() {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <nav aria-label="Principal" className="md:hidden">
      <button
        ref={btnRef}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-11 items-center justify-center"
      >
        {open ? <X aria-hidden /> : <Menu aria-hidden />}
        <span className="sr-only">{open ? "Cerrar menú" : "Abrir menú"}</span>
      </button>

      <ul
        id="mobile-nav-panel"
        hidden={!open}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); }
        }}
      >
        {/* links */}
      </ul>
    </nav>
  );
}
```

Use `hidden={!open}` rather than `{open && …}` so `aria-controls` always points at a real element. And returning focus to the trigger on Escape is the half that's usually forgotten.

**Landmark labels:** with a header nav, a footer nav, and a sidebar nav on the same page, each `<nav>` needs a distinct `aria-label`. Do not put the role in the label — `aria-label="Navegación principal"` is announced as "Navegación principal navigation". Use `"Principal"`, `"Pie de página"`, `"Panel"`.

### 6. Hover-revealed panels have three obligations

**SC 1.4.13 Content on Hover or Focus (AA)** applies to any dropdown or mega-menu that opens on hover. It must be:

- **Dismissible** — Escape closes it without moving the pointer
- **Hoverable** — the pointer can travel from trigger into panel without it vanishing, so no visual gap between them
- **Persistent** — it stays until focus/hover leaves or the user dismisses it

The classic failure is an 8px gap between trigger and panel: the panel closes as the mouse crosses the gap. The simplest way to satisfy all three is to **open on click/focus rather than hover**. Prefer that unless the design specifically demands hover.

### 7. Scroll-hiding headers translate, they do not resize

If the header hides on scroll-down and returns on scroll-up, drive a `translateY` on a sticky element. Animating `height` or `top` instead forces layout on every scroll frame, and it is the usual reason a scroll-hiding header stutters.

Track scroll direction through whatever the project already uses for scroll state — a motion library's scroll primitives if one is installed, otherwise a passive listener with the reads batched into a frame. What matters is that you are not doing layout work per event.

Do not reach for CSS scroll-driven animations (`animation-timeline`) for this yet: support is still partial across major browsers, so it cannot carry a load-bearing behaviour on its own.

---

## Sidebar

### 8. The persisted collapse state has to be read before first paint

A sidebar that remembers being collapsed must apply that on the server or before hydration. Write it to a cookie rather than `localStorage`, because only the cookie is available to the server on the initial request.

Skip this and the user who collapsed the sidebar sees it render expanded on every full page load, then snap shut after hydration — a visible jump on every navigation that misses the client cache. It is the single most common defect in a persisted shell, and it is invisible in a client-side-only dev loop.

If the project uses a component library whose sidebar writes such a cookie, check whether anything reads it. Several write and never read.

### 9. A collapsed icon-only sidebar still needs accessible names

When a sidebar collapses to icons, every button loses its visible label. Without an accessible name — a tooltip wired to the control, `aria-label`, or visually-hidden text — the collapsed state is unusable with a screen reader while looking perfectly fine.

Wrap the menus in `<nav aria-label="…">` too. A sidebar built from generic `<div>`s has no landmark, so the application's primary navigation is unreachable by landmark navigation.

### 10. Exactly one `aria-current` per page

The reflex `pathname.startsWith(href)` marks both `/panel` and `/panel/usuarios` as current, so a screen reader announces two current pages. Use `startsWith` for *visual* "this section is active" styling if you want it, but **exact match** for `aria-current`.

A collapsible group header is a disclosure button: `aria-expanded` plus `aria-controls` pointing at the submenu's `id`. The parent of an open section gets no `aria-current` — only the matching leaf does.

### 11. Scrollable sidebars need `overscroll-contain`

Without it, reaching the end of the sidebar chains the scroll into the page behind it: the nav stops, the main content starts moving under the cursor. Tailwind's `overscroll-contain` fixes it.

Use `contain`, not `none` — `none` also disables the platform's bounce and pull-to-refresh, which users expect.

### 12. A drag-to-resize sidebar owes a non-drag alternative

**SC 2.5.7 Dragging Movements (AA)**: any functionality operated by dragging must also be achievable with a single pointer without dragging. Keyboard support does **not** satisfy this — the alternative has to work through clicks or taps.

If you ship a resize handle, pair it with a collapse/expand button or preset-width buttons. A click-to-toggle rail alongside a keyboard shortcut satisfies the criterion; the keyboard shortcut alone does not.

---

## Stack-specific notes

`references/stack-specific.md` covers the router APIs for each profile, and the shadcn sidebar's known gaps — including the cookie it writes but never reads.

**Read the project's `package.json` first.** Nothing in that file is guaranteed to be installed: the profiles here ship different routers, and neither ships shadcn or a motion library by default.

---

## Before you call the shell done

Walk these with the keyboard only — most of them are invisible to a visual check:

- [ ] Tab through the whole header. Nothing lands under a sticky bar (rule 1).
- [ ] The current page's link reports `aria-current="page"`, and exactly one element does (rules 4, 10).
- [ ] Every `<nav>` has a distinct `aria-label` that doesn't contain the word "navigation" (rule 5).
- [ ] The mobile menu opens, Escape closes it, and focus returns to the trigger (rule 5).
- [ ] Any hover panel survives the pointer crossing from trigger into it, and Escape dismisses it (rule 6).
- [ ] The header still sticks with the page scrolled and no ancestor broke it (rule 2).
- [ ] Collapse the sidebar, hard-reload: it stays collapsed, with no flash (rule 8).
- [ ] Collapse it to icons: every control still has an accessible name (rule 9).
- [ ] Scroll the sidebar to its end: the page behind does not start scrolling (rule 11).
