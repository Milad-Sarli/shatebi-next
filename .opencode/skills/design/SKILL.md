---
name: design
description: Shatebi project design system — Tailwind CSS v4, shadcn/ui (New York/neutral), Framer Motion, RTL/Persian, dark mode, Pinar font, reactbit animations
version: 1.0.0
author: opencode
type: skill
category: frontend
tags:
  - tailwind
  - shadcn
  - design-system
  - framer-motion
  - rtl
  - persian
  - dark-mode
  - reactbit
---

# Shatebi Design System Skill

> **Purpose**: Apply consistent design patterns for the Shatebi project — a Persian RTL Next.js app using Tailwind v4, shadcn/ui (New York style, neutral base), Framer Motion, dark mode, and the Pinar Persian font.

---

## Tailwind v4 — CSS-Based Config

- **No `tailwind.config.js`** — Tailwind v4 is configured via CSS in `src/app/globals.css`
- **Imports**: `@import "tailwindcss"` then `@import "tw-animate-css"`
- **Dark mode variant**: `@custom-variant dark (&:is(.dark *));`
- **Aliases** (via `components.json`): `@/components`, `@/components/ui`, `@/lib`, `@/hooks`
- **Path map**: `@/components/ui/*` → `src/components/ui/*`

---

## Color Tokens (OKLCH)

All defined in `globals.css` as CSS variables. Use these instead of hardcoded Tailwind colors.

### Light (`:root`)

| Token | OKLCH | Visual |
|-------|-------|--------|
| `--background` | `1.0000 0 0` | White |
| `--foreground` | `0.3729 0.0306 259.7328` | Near-black |
| `--primary` | `0.7227 0.1920 149.5793` | Vibrant green |
| `--primary-foreground` | `1.0000 0 0` | White |
| `--secondary` | `1.0000 0 0` | White |
| `--muted` | `0.9670 0.0029 264.5419` | Light gray |
| `--muted-foreground` | `0.5510 0.0234 264.3637` | Medium gray |
| `--accent` | `0.9505 0.0507 163.0508` | Light green |
| `--destructive` | `0.6368 0.2078 25.3313` | Red |
| `--border`/`--input` | `0.9276 0.0058 264.5313` | Light border |
| `--ring` | `0.7227 0.1920 149.5793` | Green (same as primary) |
| `--sidebar` | `0.9514 0.0250 236.8242` | Light blue-gray |

### Dark (`.dark`)

Background → `0.2077 0.0398 265.7549` (very dark blue). Primary → `0.7729 0.1535 163.2231` (slightly lighter green). All light/dark pairings are reversed.

### Zinc Palette (direct Tailwind classes)

Use these for custom surfaces not covered by CSS variables:

- `bg-zinc-50` / `bg-zinc-900` — page background (light/dark)
- `bg-white dark:bg-zinc-900` — card backgrounds
- `text-zinc-900 dark:text-zinc-100` — primary text
- `text-zinc-500 dark:text-zinc-400` — muted/secondary text
- `border-zinc-200 dark:border-zinc-800` — borders
- `hover:bg-zinc-100 dark:hover:bg-zinc-800` — hover states
- `text-blue-600 dark:text-blue-400` — blue accent (logo, notification bell)

### Chart Colors (5 greens)

```
Chart 1: 0.7227 0.1920 149.5793 (primary)
Chart 2: 0.6959 0.1491 162.4796
Chart 3: 0.5960 0.1274 163.2254
Chart 4: 0.5081 0.1049 165.6121
Chart 5: 0.4318 0.0865 166.9128
```

---

## Typography

- **Font stack**: `--font-sans: DM Sans`, `--font-serif: Lora`, `--font-mono: IBM Plex Mono`
- **Persian font**: **Pinar** (loaded via `next/font/local` with weights 300/500/800)
- **Global override**: `body, * { font-family: 'Pinar', Tahoma, Arial, sans-serif !important; }`
- **Radius**: `--radius: 0.5rem` (8px); cascade: `sm`=4px, `md`=6px, `lg`=8px, `xl`=12px

---

## shadcn/ui Component Conventions (v4)

All components live at `src/components/ui/{component}.tsx`.

### Architecture

```tsx
"use client"  // when needed
import * as React from "react"
import * as Primitive from "@radix-ui/react-{name}"
import { cn } from "@/lib/utils"

function Component({ className, ...props }: React.ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      data-slot="component-name"
      className={cn("flex items-center gap-2", className)}
      {...props}
    />
  )
}
```

- Use `data-slot="component-name"` on every component
- Use `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- Use `cva()` from `class-variance-authority` for variants (Button, Badge, etc.)
- **No `forwardRef`** — use `React.ComponentProps` pattern

### SVG Icon Convention

Every component with icons:
```css
[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0
```

### Focus Ring Convention

```css
focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]
aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive
```

### Floating Element Animation (tw-animate-css)

```css
data-[state=open]:animate-in data-[state=closed]:animate-out
data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
data-[side=bottom]:slide-in-from-top-2
```

### Button Variants

5 variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
4 sizes: `default`, `sm`, `lg`, `icon`

### Badge Variants

4 variants: `default` (primary green), `secondary`, `destructive`, `outline`

### Card

`rounded-xl` (12px), `gap-6`, `py-6`, `shadow-sm`. Child components use `@container/card-header`.

### Dialog/AlertDialog

`fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]`, overlay `bg-black/50`, `sm:max-w-lg`, `rounded-lg border p-6 shadow-lg`.

---

## Form Patterns

Always use react-hook-form + zod + shadcn Form components:

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const formSchema = z.object({ /* ... */ })
type FormValues = z.infer<typeof formSchema>

const form = useForm<FormValues>({ resolver: zodResolver(formSchema), defaultValues: { /* ... */ } })

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="grid md:grid-cols-2 gap-x-6 gap-y-4">
    <FormField control={form.control} name="field" render={({ field }) => (
      <FormItem>
        <FormLabel className="text-zinc-900 dark:text-zinc-100">Persian Label</FormLabel>
        <FormControl>
          <Input placeholder="..." className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" {...field} />
        </FormControl>
        <FormMessage className="text-red-500" />
      </FormItem>
    )} />
  </form>
</Form>
```

- Backend errors mapped via `form.setError()`
- Toast feedback via `sonner`: `toast.success()` / `toast.error()`
- Loading spinner: `className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-200 border-t-transparent"`

### Spacing Standards

| Element | Classes |
|---------|---------|
| Page padding | `p-4 md:p-6` |
| Card padding | `px-4 py-4 sm:px-6 sm:py-5` |
| Form grid | `grid md:grid-cols-2 gap-x-6 gap-y-4` |
| Button text | `text-sm font-medium` |
| Form label | `text-sm font-semibold text-zinc-900 dark:text-zinc-100` |
| Form error | `text-xs text-red-500` |
| Description | `text-xs text-zinc-500 dark:text-zinc-400` |
| Form item spacing | `space-y-2` (within Item), `gap-2` (wrapper) |
| Labels + Inputs | `px-3 py-2` for Input, `h-9` default height |

---

## Framer Motion Animation Patterns

### Page Transition Component (`src/components/ui/page-transition.tsx`)

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 20 }}
  transition={{ duration: 0.3, ease: "easeInOut" }}
>
  {children}
</motion.div>
```

### Stat Card Stagger

```tsx
<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, delay: index * 0.08 }}
/>
```

### Mobile Sidebar Slide

```tsx
<motion.div
  initial={{ x: "100%" }}
  animate={{ x: sidebarOpen ? 0 : "100%" }}
  transition={{ type: "spring", damping: 20 }}
/>
```

### Backdrop Fade

```tsx
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
/>
```

### Login Page Sequence

- Brand section: `opacity: 0, x: -50` → `opacity: 1, x: 0` (0.8s, delay 0.2)
- Logo: `opacity: 0, scale: 0.8` → `opacity: 1, scale: 1` (1s, delay 0.3)
- Form: `opacity: 0, y: 20` → `opacity: 1, y: 0` (0.5s)
- Fields staggered: delays 0.1, 0.2, 0.3, 0.4
- Form step slide: `x: ±20` with opacity
- Spinner: `animate={{ rotate: 360 }}` with `transition={{ duration: 1, repeat: Infinity, ease: "linear" }}`

### AnimatePresence

**Do NOT use `mode="wait"`** — it causes React key warnings. Wrap `AnimatePresence` without `mode`, or use React fragments (`<></>`) with `key` on immediate children.

---

## Reactbit Animation Components

Located at `src/components/reactbit/`:

- **BlurText**: Word-by-word blur + y offset reveal (IntersectionObserver-driven)
- **RotatingText**: Rotates through text array with spring animation (damping: 25, stiffness: 300)
- **GradientText**: Animated gradient (`background-size: 300% 100%`, `animate-gradient` class, 8s)
- **GlitchText**: Glitch effect text
- **Aurora**: WebGL animated aurora background
- **SpotlightCard**: Spotlight hover effect card
- **TextEffect** (from `motion-primitives`): Preset variants (blur, fade-in-blur, scale, fade, slide)
- **TextShimmerWave**: Shimmer wave text animation

---

## RTL / Persian Conventions

- `<html lang="fa" dir="rtl" suppressHydrationWarning>`
- All UI text in Persian
- Form labels, placeholders, button text in Persian
- Dashboard sidebar: `text-right` on items
- Inputs for phone/code: `dir="ltr"` for LTR numerals
- Combobox: `dir="rtl"` for Persian text, `dir="ltr"` for numbers
- Dates: use Jalali libraries (`date-fns-jalali`, `jalaliday`, `react-multi-date-picker`)
- Toggle: `checked ? "translate-x-6 rtl:-translate-x-6" : "translate-x-1 rtl:-translate-x-1"`
- Responsive: `order-1 lg:order-none` for RTL-friendly reordering

---

## Dark Mode

- **Provider**: `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- **Toggle**: Custom `ThemeToggleButton` with `document.startViewTransition()` + SVG clip-path masks
  - Variants: `circle`, `circle-blur` (default), `polygon`, `gif`
  - Start positions: `top-left` (default), `top-right`, `bottom-left`, `bottom-right`, `center`
- Dark class on `<html>`, all components use `dark:` variants

### Standard dark mode pattern:

```tsx
bg-white dark:bg-zinc-900
text-zinc-900 dark:text-zinc-100
text-zinc-500 dark:text-zinc-400
border-zinc-200 dark:border-zinc-800
hover:bg-zinc-100 dark:hover:bg-zinc-800
```

---

## Custom Components (non-shadcn)

| Component | File | Purpose |
|-----------|------|---------|
| `PageTransition` | `ui/page-transition.tsx` | AnimatePresence page wrapper |
| `ThemeToggleButton` | `ui/theme-toggle-button.tsx` | Dark/light toggle |
| `theme-animations.ts` | `ui/theme-animations.ts` | SVG clip-path configs |
| `ConfirmationModal` | `ui/ConfirmationModal.tsx` | Generic confirmation dialog |
| `DeleteConfirmationModal` | `ui/DeleteConfirmationModal.tsx` | Delete-specific dialog |
| `CustomToggle` | `ui/custom-toggle.tsx` | RTL-aware toggle switch |
| `Combobox` | `ui/Combobox.tsx` | Searchable select with drag scroll |
| `MultiSelectCombobox` | `ui/Combobox.tsx` | Multi-select variant |
| `MultiSelectComboBoxWithInfiniteScroll` | `ui/MultiSelectComboBoxWithInfiniteScroll.tsx` | Infinite scroll multiselect |
| `OTPInput` | `ui/otp-input.tsx` | 6-digit OTP input |
| `FileInput` | `ui/file-input.tsx` | File upload with preview |
| `CustomJalaliDatePicker` | `ui/CustomJalaliDatePicker.tsx` | Persian date picker |
| `TimePicker` | `ui/TimePicker.tsx` | Time selection |
| `DatePicker` | `ui/DatePicker.tsx` | General date picker |
| `NotificationDisplay` | `NotificationDisplay.tsx` | Notification list |
| `PushNotificationSetup` | `PushNotificationSetup.tsx` | Web push setup |
| `AttendanceChart` | `charts/attendance-chart.tsx` | Recharts attendance area chart |
| `AverageScoresChart` | `charts/AverageScoresChart.tsx` | Average scores chart |

---

## File Locations

- **UI components**: `src/components/ui/`
- **Custom components**: `src/components/`
- **Reactbit animations**: `src/components/reactbit/`
- **Charts**: `src/components/charts/`
- **Layouts**: `src/app/(dashboard)/layout.tsx`, `src/app/(auth)/layout.tsx`
- **CSS/theme**: `src/app/globals.css`
- **Utils**: `src/lib/utils.ts`

---

## Key Rules

1. **Never use `mode="wait"`** on `AnimatePresence`
2. **Always use CSS variables** (`bg-background`, `text-foreground`) for semantic colors, zinc palette for custom surfaces
3. **Always use Pinar font** for Persian text — it's the global default
4. **Always use `cn()`** for class merging
5. **Use `data-slot`** attributes on all shadcn-style components
6. **Always add `dark:` variants** for every background, text, border, and hover class
7. **Jalali dates** for all date fields, `dir="ltr"` for numeric inputs
8. **Tailwind v4** — no `tailwind.config.js`, all config in CSS
9. **Loading spinners** use the custom spinner class pattern, not third-party loaders
10. **Toast notifications** via `sonner` (`toast.success` / `toast.error`), not custom implementations
