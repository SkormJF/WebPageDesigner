---
name: accessibility-audit
description: Audit a built interface for accessibility — axe plus the keyboard, focus, form, dialog, navigation, dynamic-state and reflow behaviour automated tools cannot see. Use at the Quality Gate, when reviewing an assigned visual scope/group, and whenever someone asks whether something is accessible.
---

# Accessibility Audit

**An axe PASS is not an accessibility PASS.** Automated tooling catches somewhere around a third of real
barriers — the machine-checkable third. It cannot tell you the focus order is nonsensical, that the modal
traps nobody, that the error message appears somewhere a screen reader will never announce, or that the
page becomes unusable at 200% zoom.

Run axe first because it is cheap and it catches genuine defects. Then do the part that requires a person.

---

## 1. Automated pass

Run axe against every distinct view, in the states they actually reach — not just the empty one. A form with
validation errors showing is a different page from the same form untouched, and it is usually where the
violations are.

```
withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
```

Report violations with the node they came from. A count is not a finding.

**Zero violations means the automated third is clean.** Say exactly that, not "the page is accessible".

---

## 2. Keyboard

Unplug the mouse, conceptually. Then:

- **Tab through the whole page.** Can you reach every interactive element? Links, buttons, inputs, custom
  controls, the thing that only looks like a div.
- **Does the focus order match the visual order?** Left to right, top to bottom, as rendered. A CSS
  reordering that leaves the DOM order intact produces a page that reads correctly and tabs incoherently.
- **Can you see where you are, at every step?** A focus indicator that disappears against one background is
  a missing focus indicator.
- **Can you get out?** Escape closes dialogs, dropdowns and mobile menus. If it does not, someone who cannot
  click is stuck.
- **Can you get back?** Closing a dialog returns focus to whatever opened it. Otherwise focus falls to the
  top of the document and the user starts over.
- **Is anything reachable that should not be?** Content behind an open modal must not be tabbable. `inert`
  on the background, or a real focus trap.

**Skip link.** The first focusable element should let someone jump past the navigation. It may be visually
hidden until focused; it may not be absent.

---

## 3. Forms

- **Every input has a visible label**, associated by `for`/`id`. A placeholder is not a label — it vanishes
  when typing starts, and it fails contrast almost everywhere.
- **Errors are associated with their field** via `aria-describedby`, and the field is marked `aria-invalid`.
- **Errors are announced**, not just displayed. A live region, or focus moved to the error summary.
- **Errors say what to do.** "Invalid input" is not an error message. What happened, why, how to fix it.
- **Required fields are marked in the accessibility tree**, not only with a red asterisk.
- **Submission feedback reaches a screen reader.** A success message that only appears visually is a form
  that silently succeeded.

---

## 4. Images, icons and structure

- **Informative images describe what they convey**, not what they are. "Team of four at a shared desk"
  tells someone something; "image1.jpg" and "photo" tell them nothing, and neither does a filename.
- **Decorative images take an empty alt**, so a screen reader skips them. An empty alt is a decision; a
  missing alt attribute is an omission, and they are read differently.
- **Icon-only controls have accessible names.** The icon itself is hidden from assistive technology and the
  name lives on the control.
- **Icons beside text are hidden**, otherwise the label is announced twice.
- **No text baked into images.** It cannot be resized, translated, selected or read aloud.
- **Landmarks are used** — header, nav, main, footer — so someone can jump between regions instead of
  tabbing through everything.
- **One `h1`, and no skipped levels.** Heading order is how most screen-reader users navigate a page; a
  heading chosen for its font size rather than its rank breaks that.
- **Lists are lists.** Related items in a `<ul>`, not a stack of divs.

---

## 5. Dialogs and overlays

- Correct role, and a name — `aria-labelledby` pointing at the title.
- Focus moves into the dialog on open, and to a sensible element, not the close button by default.
- Focus is trapped while open.
- Escape closes it.
- Focus returns to the trigger on close.
- Background content is inert.

Component libraries handle most of this. **Verify it rather than assuming it** — the one that was hand-rolled
because the library's version did not fit is the one that will fail.

---

## 6. Navigation

- The current page is identified — `aria-current="page"`, not colour alone.
- The mobile menu is reachable, operable and dismissible by keyboard.
- A sticky header does not cover the element that just received focus. This is a common and invisible
  failure: tab down the page and the focused control ends up behind the header, so a keyboard user is
  looking at a focus ring they cannot see.
- Icon-only controls have accessible names.

---

## 7. Dynamic state

Anything that changes without a page load needs to reach someone who is not watching.

- Loading, success and error states announced through a live region with the right politeness. `polite`
  for most things; `assertive` only for something that genuinely interrupts.
- Content inserted above the current scroll position does not shift what someone was reading.
- A control that changes meaning changes its accessible name with it — a toggle that says "Play" after it
  started playing is lying to everyone who cannot see the state.

---

## 8. Reflow and zoom

- **200% browser zoom**: content reflows, nothing is cut off, nothing needs horizontal scrolling.
- **320 CSS pixels wide**: the WCAG reflow criterion. No two-dimensional scrolling.
- **Text spacing overrides** applied — increased line height, letter and word spacing — without content
  overlapping or being clipped.

---

## 9. Colour and contrast

- Body text 4.5:1, large text and UI components 3:1. Measure, do not estimate.
- **Colour is never the only carrier of meaning.** An error that is only red, a required field that is only
  red, a chart series that is only distinguishable by hue.
- Focus indicators meet contrast against **both** the component and its background.
- Check the states, not just the default: a hover colour and a disabled colour each need to pass on their
  own.

---

## 10. Motion

Every animation has a still path under `prefers-reduced-motion`. This is not a preference to weigh against
the design — it costs nothing and vestibular disorders are common enough that any real audience includes
people affected by them.

Parallax, scroll-driven reveals and page-load choreography are all fine. Each needs a version that holds
still.

---

## Reporting

Group by severity, cite the element, and say what a person is actually blocked from doing.

```
BLOCKER   Contact form, email field: no label. A screen-reader user reaches an
          unnamed text input and cannot tell what to type.
          Evidence: <input id="email"> with no associated <label>, axe rule "label".

MAJOR     Gallery lightbox: Escape does not close it and focus is not trapped.
          A keyboard user who opens an image cannot get back to the page.
```

**Never report "accessible" as a verdict.** Report what you checked and what you found. The claim you can
support is "no violations in the automated pass, and the keyboard, focus, form and reflow checks below
passed" — which is a stronger and more useful statement than a word.
