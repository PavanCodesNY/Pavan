# Changelog

Every entry lists all files touched and what changed in each, so parallel agents can detect overlaps and avoid conflicts.

---

## 2026-04-15 — Add auto-documentation and CI/CD pipeline
**PR**: TBD | **Merged into**: `main` | **Branch**: `PavanCodesNY/istanbul-v1`

### Summary
Added auto-documentation system (docs/ folder with architecture, components, and changelog) that agents update on every PR. Added GitHub Actions CI pipeline running lint + build. Updated CLAUDE.md with documentation instructions.

### Files Changed

#### Created
- `.github/workflows/ci.yml` — GitHub Actions workflow: runs `npm run lint` and `npm run build` on push/PR to main, Node 22, working directory set to `pavan/`
- `docs/ARCHITECTURE.md` — Agent-readable overview: tech stack, project structure, design tokens (colors, easings, layout), animation approach, z-index layers, key patterns (Shell, PointerProvider, data-cursor, content veil, color bleed)
- `docs/COMPONENTS.md` — Inventory of all components with file paths, purposes, props, and animation details
- `docs/CHANGELOG.md` — This file. Running change log with file-level detail for conflict awareness

#### Modified
- `pavan/CLAUDE.md` — Added Auto-Documentation section with format template instructing agents to update docs/ on every PR, listing every file touched with descriptions

---

## 2026-04-14 — Add floating chat bar widget with Framer Motion
**PR**: [#1](https://github.com/PavanCodesNY/Pavan/pull/1) | **Merged into**: `main` | **Branch**: `PavanCodesNY/chat-bar-widget`

### Summary
Added a Wispr Flow-style floating chat widget (compact pill → input bar on hover → full chat panel after sending). Integrated Framer Motion across ChatBar, Nav, and Avatar for GPU-accelerated spring animations.

### Files Changed

#### Created
- `pavan/app/components/ChatBar.tsx` — New component exporting `ChatBar({ visible })`. 3-state widget (`compact` | `bar` | `expanded`) using Framer Motion springs. Handles hover expand, message state, keyboard shortcuts (Escape/Enter). Claude API integration scaffolded but not connected (TODO in `send` function).
- `pavan/app/components/ChatBar.module.css` — Styles for all 3 states: root container, pill trigger, bar input row, expanded panel (header, messages, input area). Responsive breakpoints at 480px and 900px.

#### Modified
- `pavan/app/components/Shell.tsx` — Added `import { ChatBar } from "./ChatBar"` and mounted `<ChatBar visible={loaded} />` in ShellInner return block between Avatar and content-veil div.
- `pavan/app/globals.css` — Added 3 CSS custom properties under `:root`: `--chat-surface: #f9f8f4`, `--chat-surface-elevated: #f7f6f2`, `--chat-user-bubble: rgba(11,11,10,0.03)`.
- `pavan/app/components/Nav.tsx` — Replaced static `data-active` background with Framer Motion `layoutId="nav-active"` sliding indicator. Added `motion` import, wrapped active background in `<motion.span>` with spring transition. Added `.activeBg` and `.label` classNames.
- `pavan/app/components/Nav.module.css` — Removed `background` from `.pill[data-active="true"]`, added `.activeBg` (absolute positioned, z-index -1, background ink) and `.label` (relative, z-index 1) rules.
- `pavan/app/components/Avatar.tsx` — Replaced `<div>` with `<motion.div>` from Framer Motion. Added `whileHover={{ scale: 1.12 }}`, `whileTap={{ scale: 0.95 }}` with spring transition.
- `pavan/app/components/Avatar.module.css` — Removed `transition: border-color 220ms` and `.wrap:hover` rule (now handled by Framer Motion inline).
- `pavan/package.json` — Added `framer-motion` dependency.
- `pavan/package-lock.json` — Lock file updated with framer-motion and its sub-dependencies (3 packages added).

### Dependencies Changed
- Added `framer-motion@11.x` — Spring-based animation library, GPU-accelerated transforms

### Patterns Introduced
- **Framer Motion for layout morphing**: Use `motion.div` with `animate={{ width, height, borderRadius }}` and spring transitions for container shape changes. See ChatBar for reference.
- **`layoutId` for sliding indicators**: Shared layout animations between sibling elements. See Nav `layoutId="nav-active"`.
- **`whileHover`/`whileTap` springs**: Declarative hover/tap interactions. See Avatar for reference.
- **ChatBar z-index 60**: New layer between Nav/Avatar (40) and CustomCursor (80).

---

## 2026-04-14 — Portfolio Landing v0.0.2
**Commit**: `5113454` | **Merged into**: `main`

### Summary
Second iteration of the portfolio landing page with refined content and styling.

### Files Changed

#### Modified
- `pavan/app/page.tsx` — Updated home page content and layout
- `pavan/app/page.module.css` — Refined page styles
- `pavan/app/components/*` — Various component refinements from v0.0.1

---

## 2026-04-14 — v0.0.1
**Commit**: `e0caef9` | **Merged into**: `main`

### Summary
Initial project setup with full design system, custom animation engine, and all core components.

### Files Changed

#### Created
- `pavan/app/layout.tsx` — Root layout wrapping pages in Shell provider, loads ClashDisplay + Instrument Serif fonts
- `pavan/app/page.tsx` — Home page with BreathingProse content
- `pavan/app/globals.css` — Design tokens (ink/paper palette, easings, layout metrics), base reset, content veil, bleed classes
- `pavan/app/components/Shell.tsx` — Root client wrapper: PointerProvider, loading state, color bleed orchestration (staggered setTimeout chain)
- `pavan/app/components/Nav.tsx` — Fixed top-left nav pills (Home, Playground) with active state
- `pavan/app/components/Nav.module.css` — Pill styles, hover/active transitions, 480px responsive
- `pavan/app/components/Avatar.tsx` — Fixed top-right avatar circle with Image fallback
- `pavan/app/components/Avatar.module.css` — 40px circle, border hover, 480px responsive
- `pavan/app/components/CustomCursor.tsx` — Custom pointer (ring + dot) with spring physics via PointerProvider
- `pavan/app/components/CustomCursor.module.css` — Fixed z-80, pointer-events none, data-hover ring expansion
- `pavan/app/components/HersheyLoader.tsx` — SVG stroke animation loader, RAF-based, calls onComplete when done
- `pavan/app/components/BreathingProse.tsx` — Paragraph reveals (IntersectionObserver + clip-path) with cursor proximity breathing
- `pavan/app/components/BreathingProse.module.css` — Staggered reveal transitions, proximity opacity var
- `pavan/app/components/MagneticLine.tsx` — Word/letter spans magnetically attracted to cursor via spring physics
- `pavan/app/components/MagneticLine.module.css` — Inline transform styles per span
- `pavan/app/components/PretextText.tsx` — Text rendering via @chenglou/pretext
- `pavan/app/components/Footer.tsx` — Footer with rule line controlled by --rule-opacity
- `pavan/app/components/Footer.module.css` — Rule opacity transition
- `pavan/app/components/PointerProvider.tsx` — Mouse tracking context with RAF subscription pattern
- `pavan/lib/spring.ts` — Spring step physics utility (stiffness/damping/mass calculations)
- `pavan/lib/pretext-helpers.ts` — Text animation helper utilities
- `pavan/next.config.ts` — Turbopack bundler configuration
- `pavan/tsconfig.json` — TypeScript strict mode, bundler resolution, path aliases
- `pavan/eslint.config.mjs` — ESLint with next/core-web-vitals + typescript
- `pavan/package.json` — Project dependencies and scripts

### Patterns Introduced
- **Shell wrapper**: All pages wrapped in Shell → PointerProvider. Fixed UI (Nav, Avatar, CustomCursor) rendered at shell level.
- **`data-cursor=""`**: Add to any interactive element to trigger custom cursor ring hover effect.
- **CSS Modules only**: No Tailwind classes in JSX. All component styles in `.module.css` files using CSS custom properties.
- **PointerProvider subscription**: Components call `usePointer()` to get `subscribe(tickCallback)` for per-frame pointer tracking.
- **Content veil**: `.content-veil[data-loaded="true"]` fades in page content after loader completes.
- **Color bleed timing**: Shell adds `bleed-links` (500ms), `bleed-cursor` (4500ms), `bleed-rule` (7500ms) classes to body after load.
