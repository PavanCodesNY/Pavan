# Components

All components live in `pavan/app/components/`. Every component uses CSS Modules for styling and is a client component (`"use client"`).

## Shell-Level (mounted in Shell.tsx, present on all pages)

### Shell
- **Path**: `components/Shell.tsx`
- **Purpose**: Root layout wrapper — provides PointerProvider, manages loading state, orchestrates color bleed timing
- **Key behavior**: Staggered `setTimeout` chain adds `bleed-links` (500ms), `bleed-cursor` (4500ms), `bleed-rule` (7500ms) to body after load

### Nav
- **Path**: `components/Nav.tsx` + `Nav.module.css`
- **Purpose**: Fixed top-left navigation pills (Home, Playground)
- **Animation**: Framer Motion `layoutId="nav-active"` — active indicator slides between pills with spring physics
- **Props**: None (reads pathname via `usePathname`)

### Avatar
- **Path**: `components/Avatar.tsx` + `Avatar.module.css`
- **Purpose**: Fixed top-right avatar image (40x40 circle)
- **Animation**: Framer Motion `whileHover` scale 1.12x, `whileTap` scale 0.95x with spring
- **Fallback**: Shows "PK" initials if image fails to load

### CustomCursor
- **Path**: `components/CustomCursor.tsx` + `CustomCursor.module.css`
- **Purpose**: Custom pointer with ring + dot, spring-follows mouse position
- **Animation**: Custom spring physics via PointerProvider RAF subscription
- **Behavior**: Ring expands on `[data-cursor]` element hover

### ChatBar
- **Path**: `components/ChatBar.tsx` + `ChatBar.module.css`
- **Purpose**: Floating chat widget at bottom-center (Wispr Flow style)
- **Animation**: Framer Motion spring for container morphing between 3 states
- **States**: `compact` (140x36 pill) → `bar` (50vw input bar on hover) → `expanded` (full chat panel after sending message)
- **Props**: `visible?: boolean` — controls rendering (tied to Shell loaded state)
- **Note**: Claude API integration not yet connected (TODO in send function)

### HersheyLoader
- **Path**: `components/HersheyLoader.tsx`
- **Purpose**: SVG stroke animation loader that plays on home route load
- **Animation**: Manual RAF with stroke-dashoffset, fades out on completion
- **Props**: `onComplete: () => void`

## Content Components (used in pages)

### BreathingProse
- **Path**: `components/BreathingProse.tsx` + `BreathingProse.module.css`
- **Purpose**: Animated prose paragraphs with clip-path reveal and cursor-proximity breathing effect
- **Animation**: IntersectionObserver for reveals, PointerProvider subscription for proximity-based opacity

### MagneticLine
- **Path**: `components/MagneticLine.tsx` + `MagneticLine.module.css`
- **Purpose**: Links with word/letter spans that magnetically attract toward cursor
- **Animation**: Custom spring physics per span via PointerProvider

### PretextText
- **Path**: `components/PretextText.tsx`
- **Purpose**: Text rendering using @chenglou/pretext library

### Footer
- **Path**: `components/Footer.tsx` + `Footer.module.css`
- **Purpose**: Page footer with rule line
- **Animation**: Rule opacity controlled by `--rule-opacity` CSS property (set by Shell bleed timing)

## Context Providers

### PointerProvider
- **Path**: `components/PointerProvider.tsx`
- **Purpose**: Tracks mouse position, provides RAF-based subscription system for components needing per-frame pointer updates
- **Pattern**: `usePointer()` hook returns subscribe function; components register tick callbacks
