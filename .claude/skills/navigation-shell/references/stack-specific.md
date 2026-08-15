# Stack-specific navigation notes

**Nothing here is guaranteed to exist.** Read the project's `package.json` before using any of it. The
accessibility rules in `SKILL.md` hold regardless of stack; this file only covers how a given dependency
changes the wiring.

## Getting the current path

The active-link ARIA in `SKILL.md` does not change. Only the source of `currentPath` does.

**Next.js (App Router)** — the component must be a Client Component:

```tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const isActive = usePathname() === href;
  return (
    <Link href={href} aria-current={isActive ? "page" : undefined}>
      {children}
    </Link>
  );
}
```

## Persisting sidebar state before first paint

Rule 8 in `SKILL.md` says the collapse state must be readable on the server. How:

**Next.js** — read the cookie in the layout, which is a Server Component:

```tsx
import { cookies } from "next/headers";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();          // async in Next 15+/16
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
```

## shadcn's `sidebar`, if the project installed it

shadcn is **not** part of any stack profile here. It is added per project, by decision. Where it is present,
its sidebar is comprehensive — 20+ parts, `collapsible="offcanvas" | "icon" | "none"`, a `sidebar_state`
cookie, a Cmd/Ctrl+B toggle, `Sheet`-based mobile behaviour, real `<ul>`/`<li>` markup — with three gaps
you fill every time:

1. **No `<nav>` landmark.** The root is a `<div>`.
2. **No `aria-current`.** `SidebarMenuButton`'s `isActive` prop emits `data-active` for styling only.
3. **Not resizable.** `SidebarRail` is a click-to-toggle strip, not a drag handle.

And the one that actually bites: **it writes `sidebar_state` but never reads it.** See the layout snippet
above.

```tsx
<Sidebar collapsible="icon">
  <SidebarContent className="overflow-y-auto overscroll-contain">
    <nav aria-label="Panel">
      <SidebarMenu>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                <Link href={item.href} aria-current={active ? "page" : undefined}>
                  <item.icon aria-hidden />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  </SidebarContent>
</Sidebar>
```

The `tooltip` prop is mandatory in `collapsible="icon"` mode — collapsed buttons render icon-only and lose
their accessible name without it.

For a modal mobile menu, shadcn's `Sheet` is `Dialog`-based and handles focus trapping, labelling and
restore-focus correctly. Where shadcn is absent, use the platform `<dialog>` or another dialog primitive
rather than hand-rolling the trap.

## Scroll-hiding headers with a motion library

Where a motion library is installed, its scroll primitives are the tidiest way to drive the `translateY` —
Motion / Framer Motion exposes `useScroll` and `useMotionValueEvent` for exactly this.

The fixed Next profile does not ship one. Without it, a passive scroll listener that batches its reads into a single
`requestAnimationFrame` is fine; what matters is doing no layout work per event.
