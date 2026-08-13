# theming

Reference for the `shadcn-ui` skill. The installed files in the project outrank anything here.

---

## Theming

### Color Customization

**Change base color scheme**:
```bash
# Regenerate components with new base color
npx shadcn@latest init

# Choose new base: Slate, Gray, Zinc, Neutral, Stone
```

**Manual color override** (globals.css):
```css
:root {
  --primary: 210 100% 50%;  /* HSL: Blue */
  --primary-foreground: 0 0% 100%;
}

.dark {
  --primary: 210 100% 60%;  /* Lighter blue for dark mode */
}
```

### Custom Variants

```tsx
// Extend button variants
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // ...existing variants
        gradient: "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
      },
    },
  }
)

// Usage
<Button variant="gradient">Gradient Button</Button>
```

### Theme Switching

```tsx
// Using next-themes
import { ThemeProvider } from "next-themes"

// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

// Theme toggle component
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

---

## Dark Mode

### Setup with Next.js

```bash
npm install next-themes
```

```tsx
// app/providers.tsx
"use client"

import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}

// app/layout.tsx
import { Providers } from "./providers"

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Dark Mode Utilities

```tsx
// Force dark mode for specific section
<div className="dark">
  <Card>Always dark, regardless of theme</Card>
</div>

// Conditional styling
<div className="bg-white dark:bg-slate-950">
  <p className="text-slate-900 dark:text-slate-50">
    Adapts to theme
  </p>
</div>
```
