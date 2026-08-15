# troubleshooting

Reference for the `shadcn-ui` skill. The installed files in the project outrank anything here.

---

## Configuration

### components.json

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**Key Options**:
- `style`: "default" or "new-york" (design variants)
- `rsc`: React Server Components support
- `cssVariables`: Use CSS variables for theming
- `prefix`: Tailwind class prefix (optional)

### Tailwind & theme tokens — read the project, don't copy from here

This section is deliberately not a config template. The stack template ships **Tailwind v4**, where the theme is declared in CSS via `@theme` and there is no `tailwind.config.ts` by default. The generated stylesheet also disables repository-wide auto-discovery with `source(none)` and declares the profile's real application roots with `@source`. Any config block written into a document like this one goes stale as soon as the tooling moves — and a stale config that looks authoritative is worse than none, because it gets copied before it gets questioned.

The authoritative sources for this project, in order:

1. **the project's global stylesheet** — the real theme tokens. Read it before writing any colour, radius, or spacing utility.
2. **`components.json`** — the aliases, style variant, and base colour the CLI was initialised with. `npx shadcn@latest add` reads this file; so should you.
3. **`src/components/ui/*.tsx`** — the installed components themselves. They live in your repo and you own them, so their actual props and variants beat any catalog, including the one below.

What holds regardless of Tailwind version:

- Theming runs on **CSS custom properties**, so changing a colour is a token edit in one file — never a find-and-replace across components.
- The semantic pairs (`background`/`foreground`, `card`/`card-foreground`, `muted`/`muted-foreground`, `destructive`/`destructive-foreground`) exist so that foreground contrast is correct by construction. Use them as pairs; don't put one pair's foreground on another pair's background.
- Adding a colour means adding a token and referencing it, not hardcoding a hex inside a component.

If you need current syntax for something specific, check the installed `globals.css` first. If it genuinely isn't there, check the live shadcn docs — don't infer it from this file.

---

## CLI Commands

### Initialize

```bash
# Interactive init
npx shadcn@latest init

# Non-interactive with defaults
npx shadcn@latest init -y

# Specify options
npx shadcn@latest init --typescript --tailwind
```

### Add Components

```bash
# Single component
npx shadcn@latest add button

# Multiple components
npx shadcn@latest add button card dialog form

# Specific version
npx shadcn@latest add button@1.0.0

# Overwrite existing -- see the warning below before using this
npx shadcn@latest add button --overwrite

# Different path
npx shadcn@latest add button --path src/components/ui
```

### Diff Components

```bash
# Check for component updates
npx shadcn@latest diff

# Diff specific component
npx shadcn@latest diff button

# Show what would change
npx shadcn@latest diff --check
```

### Update Components

```bash
# Update all components
npx shadcn@latest update

# Update specific components
npx shadcn@latest update button card

# Preview changes before applying
npx shadcn@latest update --dry-run
```

---

## Troubleshooting

**Import errors**:
```bash
# Check path aliases in tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Tailwind classes not applying**: on **Tailwind v4** (what the stack template ships) there is no `content` array to fix. This project intentionally **does not** scan the whole repository: read the global stylesheet's `source(none)` / `@source` declarations and confirm the real application file is inside one of those profile-owned roots. Do not add `.claude/`, `.workflow/` or specification folders as sources. If the file is already in scope, the usual culprit is a class built by string concatenation (`` `text-${color}-500` ``), which nothing can detect statically. Write complete class names and select between them:

```tsx
// ❌ never produced in the output
<p className={`text-${color}-500`}>

// ✅ full class names, chosen at runtime
const tone = { danger: "text-red-500", ok: "text-green-500" }[status];
```

On an older v3 project, check that `content` in `tailwind.config.ts` covers your component directories.

**Dark mode not working**:
```tsx
// Add suppressHydrationWarning to <html>
<html lang="en" suppressHydrationWarning>
```

**Form validation not triggering**:
```tsx
// Ensure FormMessage is included in FormField
<FormField>
  <FormItem>
    <FormControl>...</FormControl>
    <FormMessage />  {/* Required for errors */}
  </FormItem>
</FormField>
```
