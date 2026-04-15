# Changelog

Every entry lists all files touched and what changed in each, so parallel agents can detect overlaps and avoid conflicts.

---

## 2026-04-15 — Playground blog hub with highlights pipeline
**PR**: [#6](https://github.com/PavanCodesNY/Pavan/pull/6) | **Merged into**: `main` | **Branch**: `PavanCodesNY/playground-blog`

### Summary
Turned `/playground` from a "Soon." placeholder into a tabbed content hub with three sections: Public (blog), Hire Me (recruiter page), and Highlights (unified social cards for LinkedIn/X/Instagram). Highlights are powered by markdown files in `content/highlights/` read at build time. Added a scraper script and GitHub Action so new highlights can be added from an iOS Shortcut — paste a URL, auto-scrape text + image, commit, Vercel deploys.

### Files Changed

#### Modified
- `pavan/app/playground/page.tsx` — Replaced "Soon." placeholder with `redirect("/playground/public")`
- `pavan/tsconfig.json` — Added `"scripts"` to `exclude` array (prevents BigInt build errors from scraper)

#### Created
- `pavan/app/playground/layout.tsx` — Shared playground layout with PlaygroundNav + Footer
- `pavan/app/playground/playground.module.css` — Column layout matching home page pattern
- `pavan/app/playground/components/PlaygroundNav.tsx` — Client component: 3 pill-style tabs (Public, Hire Me, Highlights) with active state via `usePathname`
- `pavan/app/playground/components/PlaygroundNav.module.css` — Tab styles matching Nav.tsx pattern
- `pavan/app/playground/data/posts.ts` — Blog post data type and seed content (title, date, slug, body)
- `pavan/app/playground/data/highlights.ts` — `getHighlights()` reads `.md` files from `content/highlights/` at build time, parses frontmatter (platform, date, url, image)
- `pavan/app/playground/public/page.tsx` — Blog list: reverse-chronological entries with date, title, excerpt
- `pavan/app/playground/public/page.module.css` — Blog list styles (entry cards with border-bottom)
- `pavan/app/playground/public/[slug]/page.tsx` — Individual blog post with `generateStaticParams` for SSG
- `pavan/app/playground/public/[slug]/page.module.css` — Article styles (header, body paragraphs)
- `pavan/app/playground/hire-me/page.tsx` — Centered "Not right now." with subtitle
- `pavan/app/playground/hire-me/page.module.css` — Hire Me page styles
- `pavan/app/playground/highlights/page.tsx` — Maps `getHighlights()` → HighlightCard components
- `pavan/app/playground/highlights/page.module.css` — Outline cards, line-clamp truncation, image wrapper, platform icon styles
- `pavan/app/playground/highlights/HighlightCard.tsx` — Server component: platform SVG icons (LinkedIn/X/Instagram), next/image for optional images, "View original" link
- `pavan/app/playground/highlights/HighlightBody.tsx` — Client component: 5-line CSS line-clamp with "Read more"/"Read less" toggle
- `pavan/content/highlights/2026-04-14-i-am-excited-to-announced-that-clean-is-.md` — Real LinkedIn post (scraped from URL)
- `pavan/content/highlights/2026-04-10-geography.md` — Placeholder X post
- `pavan/content/highlights/2026-04-05-hardest-part.md` — Placeholder LinkedIn post
- `pavan/public/highlights/2026-04-14-i-am-excited-to-announced-that-clean-is-.jpg` — Scraped og:image from LinkedIn post (73KB)
- `pavan/scripts/add-highlight.ts` — Scraper: fetches URL, extracts og:description + og:image + date from activity ID, downloads image, writes frontmatter `.md` file
- `.github/workflows/add-highlight.yml` — GitHub Action: `workflow_dispatch` with `url` input, runs scraper, commits + pushes

#### Deleted
- `pavan/app/playground/page.module.css` — Removed `.soon` class (no longer needed)

### Patterns Introduced
- **Markdown-based content**: Highlights stored as `.md` files with YAML frontmatter in `content/highlights/`. Parsed at build time by `getHighlights()` — no CMS, no database.
- **Unified social card**: Single `HighlightCard` component renders LinkedIn, X, and Instagram posts identically. Platform differentiated only by SVG icon. Adding a new platform requires zero code changes.
- **CSS line-clamp truncation**: `HighlightBody` uses `-webkit-line-clamp: 5` with JS overflow detection to conditionally show "Read more" toggle.
- **Scraper → GitHub Action → Vercel pipeline**: `workflow_dispatch` accepts a URL, scraper creates `.md` + downloads image, commits to main, Vercel auto-deploys. Triggered from iOS Shortcut via GitHub's "Dispatch Workflow" action.
- **PlaygroundNav sub-navigation**: Tabs within `/playground` using `startsWith` matching for active states, separate from the global Nav.

---

## 2026-04-15 — Add squiggly underlines, dark mode, avatar prank, and PKNY chat
**PR**: [#4](https://github.com/PavanCodesNY/Pavan/pull/4) | **Merged into**: `main` | **Branch**: `PavanCodesNY/squiggly-prank`

### Summary
Added wavy blue underlines on all links, a dark/light mode toggle triggered by clicking the avatar (with typewriter easter egg), subtle avatar glow animation, chat typewriter fixes, and renamed the chat agent to PKNY with a refreshed system prompt.

### Files Changed

#### Modified
- `pavan/app/components/MagneticLine.module.css` — Replaced `border-bottom` with `text-decoration: underline wavy` in blue (#2563eb), transitioning from transparent on bleed-links
- `pavan/app/components/PretextText.module.css` — Same wavy blue underline treatment for body paragraph links
- `pavan/app/components/Avatar.tsx` — Added dark/light mode prank: click triggers full-screen overlay with typewriter "hello again", then toggles theme. Merged with Framer Motion `motion.div` for hover/tap springs. Restores saved theme from localStorage on mount.
- `pavan/app/components/Avatar.module.css` — Added subtle glow keyframe animation, theme-switch overlay styles (overlay, caret, prankText), and related keyframes. Removed CSS hover rule (Framer Motion handles it).
- `pavan/app/globals.css` — Added `html.dark` CSS variables (ink, paper, chat-surface variants inverted), `color-scheme: dark`, and dark mode `::selection` styles
- `pavan/app/layout.tsx` — Added inline `<script>` in `<head>` to apply dark class from localStorage before first paint (prevents FOUC). Added `suppressHydrationWarning` on `<html>`.
- `pavan/app/components/Shell.tsx` — Added commented-out ArrowGuide import and render (WIP)
- `pavan/app/components/ChatBar.tsx` — Renamed chat title to "PKNY", empty state to "Ask PKNY anything.", added `seen`/`onSeen` props to ChatMessage, tracks seen messages via Set ref to prevent typewriter replay
- `pavan/app/components/ChatMessage.tsx` — Fixed typewriter: plays fully via `onComplete` callback instead of instant `setTimeout(0)`. Shows loading phrases during streaming instead of raw text. Moved synchronous setState out of effect body to fix React Compiler lint error.
- `chat-api/system-prompt.js` — Rewrote system prompt: renamed agent to PKNY, added personality guidelines, example tone, and expanded bio details

#### Created
- `pavan/app/components/ArrowGuide.tsx` — Canvas-based animated arrow guide component (commented out, WIP)
- `pavan/app/components/ArrowGuide.module.css` — Styles for arrow guide overlay (commented out, WIP)

### Patterns Introduced
- **Dark mode via class toggle**: `html.dark` class on `<html>` element, toggled via JS, persisted in localStorage. Inline head script prevents flash of wrong theme.
- **Typewriter-once pattern**: ChatBar tracks seen message indices in a `Set` ref, passes `seen`/`onSeen` to ChatMessage so typewriter only plays on first render, not on re-mount.
- **Wavy underlines**: `text-decoration: underline wavy` with `text-decoration-color` transition, decoupled from `--accent` to allow independent color (#2563eb blue).

---

## 2026-04-15 — Performance enhancements + Claude Code chat integration
**PR**: TBD | **Merged into**: `main` | **Branch**: `PavanCodesNY/istanbul-v2`

### Summary
Enabled React Compiler for auto-memoization. Added streaming Claude Code chat integration via Docker backend using the user's CLI subscription. Added streaming-aware markdown rendering with Gen Z typewriter loading animation. Created full Docker backend with Cloudflare Tunnel setup for zero-cost hosting.

### Files Changed

#### Created
- `pavan/app/components/ChatMessage.tsx` — New component for rendering chat messages. User messages render plain text. Assistant messages show Gen Z loading phrases while waiting, typewriter animation on first response, then full markdown (react-markdown + remark-gfm) after completion.
- `pavan/app/components/ChatMessage.module.css` — Styles for message bubbles, streaming cursor blink animation, loading phrase italic style, and markdown prose (headings, code, links, lists, tables, blockquotes).
- `pavan/.env.example` — Documents `NEXT_PUBLIC_CHAT_API_URL` env var pointing to Docker backend at `chat.pavankumarny.me`.
- `chat-api/server.js` — Express server using `@anthropic-ai/claude-code` SDK `query()` function. POST `/chat` endpoint accepts messages array, streams assistant response as chunked text. CORS configured for allowed origins.
- `chat-api/system-prompt.js` — System prompt for the AI persona with Pavan's bio and response guidelines.
- `chat-api/package.json` — Backend dependencies: `@anthropic-ai/claude-code`, `cors`, `express`.
- `chat-api/Dockerfile` — Node 22 slim image with Claude CLI installed globally, exposes port 3001.
- `chat-api/docker-compose.yml` — Docker Compose config with restart always, port 3099:3001, claude-auth volume, CORS origins for localhost and pavankumarny.me.
- `chat-api/README.md` — Setup guide: Docker build, Claude auth, Cloudflare Tunnel to `chat.pavankumarny.me`, pm2 alternative, environment variables.
- `chat-api/.gitignore` — Ignores node_modules.

#### Modified
- `pavan/next.config.ts` — Added `reactCompiler: true` for automatic component memoization.
- `pavan/app/components/ChatBar.tsx` — Replaced TODO with streaming fetch to `NEXT_PUBLIC_CHAT_API_URL`. Added `isStreaming` state, AbortController for cleanup, disabled input during streaming, prevents collapse during streaming. Uses ChatMessage component instead of inline message rendering.
- `pavan/app/components/ChatBar.module.css` — Removed `.message`, `.messageUser`, `.messageAssistant` rules (migrated to ChatMessage.module.css).
- `pavan/package.json` — Added `react-markdown`, `remark-gfm`, `babel-plugin-react-compiler` dependencies.
- `pavan/package-lock.json` — Lock file updated with new dependencies.

### Dependencies Changed
- Added `react-markdown@^9` — Markdown rendering for assistant messages
- Added `remark-gfm` — GitHub Flavored Markdown support (tables, strikethrough, etc.)
- Added `babel-plugin-react-compiler` (devDep) — Required by Next.js `reactCompiler` config
- Backend: `@anthropic-ai/claude-code`, `express@5`, `cors`

### Patterns Introduced
- **Streaming-aware rendering**: During streaming show raw text, after completion render full markdown. Prevents re-parsing AST on every token.
- **Typewriter animation**: `useTypewriter` hook for character-by-character reveal on first response only (not on re-renders).
- **Loading phrases**: `useLoadingPhrases` hook cycles through Gen Z phrases with type/erase animation while waiting for API response.
- **Docker backend for CLI subscription**: Chat API runs as Docker container on local machine, exposed via Cloudflare Tunnel. Uses `query()` from `@anthropic-ai/claude-code` SDK — no API key needed.
- **`NEXT_PUBLIC_CHAT_API_URL`**: Configurable chat backend URL via environment variable.

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
