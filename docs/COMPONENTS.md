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
- **Purpose**: Fixed top-right avatar image (40x40 circle) + dark/light mode toggle easter egg
- **Animation**: Framer Motion `whileHover` scale 1.12x, `whileTap` scale 0.95x with spring. Subtle glow keyframe animation (3s cycle, accent-colored box-shadow).
- **Behavior**: Click triggers full-screen overlay with typewriter "hello again", then toggles `html.dark` class and persists to localStorage. Overlay color previews the target theme.
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
- **Chat agent**: Named "PKNY" with custom personality in `chat-api/system-prompt.js`
- **Typewriter**: First response typewriter-animates once per message; subsequent views render markdown directly. Tracks seen messages via `Set` ref.
- **Streaming**: Shows Gen Z loading phrases during streaming, reveals content via typewriter after completion.

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

### ChatMessage
- **Path**: `components/ChatMessage.tsx` + `ChatMessage.module.css`
- **Purpose**: Renders individual chat messages (user or assistant)
- **Sub-components**: `LoadingMessage` (Gen Z phrase type/erase loop), `TypewriterMessage` (character-by-character reveal with `onComplete` callback)
- **Props**: `role`, `content`, `isStreaming`, `seen`, `onSeen`

### PretextText
- **Path**: `components/PretextText.tsx`
- **Purpose**: Text rendering using @chenglou/pretext library

### Footer
- **Path**: `components/Footer.tsx` + `Footer.module.css`
- **Purpose**: Page footer with rule line
- **Animation**: Rule opacity controlled by `--rule-opacity` CSS property (set by Shell bleed timing)

## Playground Components (used in /playground routes)

### PlaygroundNav
- **Path**: `app/playground/components/PlaygroundNav.tsx` + `PlaygroundNav.module.css`
- **Purpose**: Tab navigation for playground sub-pages (Public, Hire Me, Highlights)
- **Animation**: None — pill transitions only (border-color, background, color)
- **Props**: None (reads pathname via `usePathname`, uses `startsWith` for active matching)

### HighlightCard
- **Path**: `app/playground/highlights/HighlightCard.tsx`
- **Purpose**: Unified outline card for social media posts (LinkedIn, X, Instagram)
- **Sub-components**: `PlatformIcon` (inline SVG icons, 14px)
- **Props**: `highlight: Highlight` (platform, date, content, optional url/image)
- **Image**: Uses `next/image` with `fill` + `sizes` for optimization

### HighlightBody
- **Path**: `app/playground/highlights/HighlightBody.tsx`
- **Purpose**: Post text with 5-line truncation and expand/collapse toggle
- **Animation**: None — CSS `-webkit-line-clamp` for truncation
- **Props**: `content: string`
- **Behavior**: Detects overflow via `scrollHeight > clientHeight`, shows "Read more"/"Read less" button

## Context Providers

### PointerProvider
- **Path**: `components/PointerProvider.tsx`
- **Purpose**: Tracks mouse position, provides RAF-based subscription system for components needing per-frame pointer updates
- **Pattern**: `usePointer()` hook returns subscribe function; components register tick callbacks
