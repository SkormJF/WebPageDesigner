---
name: building-components
description: Technical craft for building a UI component — API shape, props, composition, controlled vs uncontrolled state, polymorphism, accessibility behaviour, tokens and styling. Use while writing or revising a shared component.
---

# Building Components

How to build a component well, once it has been decided that this component should exist.

That decision is not made here. **`atomic-design` owns** whether something is one component or three,
whether a case is a variant or a new component, when to extract a repeat, and when an abstraction is not
earning its keep. This skill starts after that and covers the implementation.

| Question | Owner |
|---|---|
| Should this be a component at all? A variant? An extraction? | `atomic-design` |
| What does it look like — colour, size, radius, states | `design-system.md` |
| How is its API shaped, how does it compose, how is it accessible | here |
| Where does it live in the tree | `design.md` |

---

## What to get right

**API shape.** Props that describe intent, not implementation. A component with a boolean for each part it
can hide wants composition instead — see `references/composition.mdx`.

**Controlled and uncontrolled state.** Decide deliberately which the component supports, and support the
uncontrolled path properly rather than as an afterthought. `references/state.mdx`.

**Polymorphism, only where it pays.** Rendering as a different element is genuinely useful for links that
look like buttons; it is also where type complexity accumulates fastest.
`references/as-child.mdx`, `references/polymorphism.mdx`.

**Accessibility as behaviour, not attributes.** Roles and labels are the easy half. Focus management,
keyboard interaction, and what a screen reader is told when state changes are the half that gets skipped.
`references/accessibility.mdx`.

**Styling through tokens.** Never a literal colour, radius or spacing value in a component.
`references/design-tokens.mdx`, `references/styling.mdx`.

**Data attributes for state**, so styling can respond to state without prop-threading.
`references/data-attributes.mdx`.

**Types that describe the real API**, including what happens when a consumer passes something unexpected.
`references/types.mdx`.

---

## Out of scope

This project builds products, not published component libraries. Packaging a component for npm, publishing
to a registry, or distributing through a marketplace is not part of any task here — and a component designed
for external distribution carries generality it does not need, which is the over-abstraction `atomic-design`
warns about.

If a project ever genuinely needs to publish, that is a scope decision for the human, not a default.

---

## References

| File | For |
|---|---|
| `references/principles.mdx` | Core principles for component design |
| `references/composition.mdx` | Composable APIs, slots, sub-components |
| `references/state.mdx` | Controlled vs uncontrolled |
| `references/as-child.mdx` | The as-child pattern |
| `references/polymorphism.mdx` | Polymorphic components and their type cost |
| `references/accessibility.mdx` | ARIA, keyboard, focus management |
| `references/types.mdx` | TypeScript patterns |
| `references/data-attributes.mdx` | State-driven styling |
| `references/design-tokens.mdx` | Token systems |
| `references/styling.mdx` | Styling approaches |
