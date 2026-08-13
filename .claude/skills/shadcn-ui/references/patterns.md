# patterns

Reference for the `shadcn-ui` skill. The installed files in the project outrank anything here.

---

## Composition Patterns

### Compound Components

```tsx
// Card composition
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>

// Form composition
<Form {...form}>
  <FormField
    control={form.control}
    name="field"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Label</FormLabel>
        <FormControl>
          <Input {...field} />
        </FormControl>
        <FormDescription>Help text</FormDescription>
        <FormMessage />
      </FormItem>
    )}
  />
</Form>
```

### Polymorphic Components (asChild)

```tsx
// Render Button as Link
import { Button } from "@/components/ui/button"
import Link from "next/link"

<Button asChild>
  <Link href="/dashboard">Go to Dashboard</Link>
</Button>

// Render as custom component
<Button asChild>
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    Animated Button
  </motion.button>
</Button>
```

**How it works** (Radix Slot):
```tsx
import { Slot } from "@radix-ui/react-slot"

interface ButtonProps {
  asChild?: boolean
}

const Button = ({ asChild, ...props }: ButtonProps) => {
  const Comp = asChild ? Slot : "button"
  return <Comp {...props} />
}
```

### Custom Compositions

```tsx
// Create custom card variant
export function PricingCard({
  title,
  price,
  features,
  highlighted
}: PricingCardProps) {
  return (
    <Card className={cn(highlighted && "border-primary")}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription className="text-3xl font-bold">
          ${price}/mo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-center">
              <Check className="mr-2 h-4 w-4 text-primary" />
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={highlighted ? "default" : "outline"}>
          Get Started
        </Button>
      </CardFooter>
    </Card>
  )
}
```

---

## Advanced Patterns

### Custom Hooks

```tsx
// useToast hook (built-in with toast component)
import { useToast } from "@/components/ui/use-toast"

function MyComponent() {
  const { toast } = useToast()

  return (
    <Button
      onClick={() => {
        toast({
          title: "Scheduled: Catch up",
          description: "Friday, February 10, 2023 at 5:57 PM",
        })
      }}
    >
      Show Toast
    </Button>
  )
}

// Custom form hook
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

function useFormWithToast<T extends z.ZodType>(schema: T) {
  const { toast } = useToast()
  const form = useForm({
    resolver: zodResolver(schema),
  })

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      // Submit logic
      toast({ title: "Success!" })
    } catch (error) {
      toast({ title: "Error", variant: "destructive" })
    }
  })

  return { form, handleSubmit }
}
```

### Responsive Design

```tsx
// Mobile-first responsive components
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>Mobile: 1 col, Tablet: 2 col, Desktop: 3 col</Card>
</div>

// Responsive dialog (sheet on mobile, dialog on desktop)
import { useMediaQuery } from "@/hooks/use-media-query"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"

function ResponsiveModal({ children, ...props }) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  if (isDesktop) {
    return (
      <Dialog {...props}>
        <DialogContent>{children}</DialogContent>
      </Dialog>
    )
  }

  return (
    <Sheet {...props}>
      <SheetContent>{children}</SheetContent>
    </Sheet>
  )
}
```

### Animation Variants

```tsx
// Using Framer Motion with shadcn/ui
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

const MotionCard = motion(Card)

<MotionCard
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Animated Card
</MotionCard>

// Staggered list animation
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
}

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.li key={item.id} variants={item}>
      <Card>{item.content}</Card>
    </motion.li>
  ))}
</motion.ul>
```

---

## Next.js Integration

### App Router Setup

```bash
# Create Next.js app with TypeScript and Tailwind
npx create-next-app@latest my-app --typescript --tailwind --app

# Initialize shadcn/ui
cd my-app
npx shadcn@latest init

# Add components
npx shadcn@latest add button card form
```

### Server Components

```tsx
// app/page.tsx (Server Component by default)
import { Button } from "@/components/ui/button"

export default function HomePage() {
  return (
    <main>
      <h1>Welcome</h1>
      {/* Static components work in Server Components */}
      <Button asChild>
        <a href="/about">Learn More</a>
      </Button>
    </main>
  )
}
```

### Client Components

```tsx
// app/interactive.tsx
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

export function InteractiveSection() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <p>Client-side interactivity</p>
      </DialogContent>
    </Dialog>
  )
}
```

### Route Handlers

```tsx
// app/api/submit/route.ts
import { NextResponse } from "next/server"
import { z } from "zod"

const formSchema = z.object({
  email: z.string().email(),
  message: z.string().min(10),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = formSchema.parse(body)

    // Process form data
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ errors: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
```
