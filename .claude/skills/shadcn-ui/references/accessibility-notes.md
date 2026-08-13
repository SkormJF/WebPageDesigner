# accessibility notes

Reference for the `shadcn-ui` skill. The installed files in the project outrank anything here.

---

## Accessibility

### ARIA Support

All shadcn/ui components include proper ARIA attributes via Radix UI:

```tsx
// Dialog automatically includes:
// - role="dialog"
// - aria-describedby
// - aria-labelledby
// - Focus trap
// - Escape key handler
<Dialog>
  <DialogContent>
    {/* Automatically accessible */}
  </DialogContent>
</Dialog>

// Button includes:
// - role="button"
// - tabindex="0"
// - Keyboard activation (Space/Enter)
<Button>Accessible by default</Button>
```

### Keyboard Navigation

**Built-in keyboard support**:
- `Tab` / `Shift+Tab` - Navigate between interactive elements
- `Enter` / `Space` - Activate buttons
- `Escape` - Close dialogs, dropdowns, popovers
- `Arrow keys` - Navigate menus, select options, radio groups
- `Home` / `End` - Jump to first/last in lists

**Example: Command Palette**:
```tsx
import {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command"

// ⌘K to open
<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Type a command..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Suggestions">
      <CommandItem>Calendar</CommandItem>
      <CommandItem>Search Emoji</CommandItem>
      <CommandItem>Calculator</CommandItem>
    </CommandGroup>
  </CommandList>
</CommandDialog>
```

### Screen Reader Support

```tsx
// Visually hidden but accessible to screen readers
<span className="sr-only">Close dialog</span>

// Skip navigation links
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

// Descriptive labels
<FormLabel htmlFor="email">Email address</FormLabel>
<Input
  id="email"
  type="email"
  aria-describedby="email-description"
  aria-invalid={!!errors.email}
/>
<FormDescription id="email-description">
  We'll never share your email.
</FormDescription>
```

### Focus Management

```tsx
// Focus trap in Dialog (automatic)
<Dialog>
  <DialogContent>
    {/* Focus stays within dialog until closed */}
  </DialogContent>
</Dialog>

// Custom focus management
import { useRef, useEffect } from "react"

function CustomComponent() {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return <Input ref={inputRef} />
}
```
