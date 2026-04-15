# Changelog

Every entry lists all files touched and what changed in each, so parallel agents can detect overlaps and avoid conflicts.

---

## 2026-04-15 — Post-merge fixes, Vercel deployment, Cloudflare Tunnel, iOS Shortcut
**Commits**: `e0d1c68`..`2d8c695` + `highlight-bot` commits | **Direct to**: `main`

### Summary
Series of fixes after PR #6 merge: Framer Motion nav animations, lint fixes, page transitions (added then removed — too slow), Vercel deployment with custom domain, Cloudflare Tunnel for chat API, iOS Shortcut for highlight pipeline, and scraper bug fixes for X/Twitter posts.

### Files Changed

#### Modified
- `pavan/app/components/Nav.tsx` — Added `LayoutGroup id="main-nav"` wrapper to isolate layoutId from PlaygroundNav. Fixed active matching: Playground pill now uses `startsWith` so it stays active on sub-routes.
- `pavan/app/components/Nav.module.css` — Removed `background` from active state (handled by motion.span activeBg)
- `pavan/app/components/Shell.tsx` — Added then removed PageTransition wrapper (caused visible delay on route changes)
- `pavan/app/playground/components/PlaygroundNav.tsx` — Added Framer Motion `layoutId="playground-tab-active"` sliding indicator with spring physics. Wrapped in `LayoutGroup id="playground-tabs"` to prevent cross-contamination with main Nav.
- `pavan/app/playground/components/PlaygroundNav.module.css` — Added `isolation: isolate` on `.tab` to fix z-index stacking for activeBg. Added `.activeBg` and `.label` classes for layered sliding indicator.
- `pavan/app/playground/layout.tsx` — Added PageEnter wrapper for smooth entrance animation. Removed PlaygroundTransition (was causing pop-in/pop-out).
- `pavan/app/playground/hire-me/page.tsx` — Escaped apostrophe: `I'll` → `I&apos;ll` (ESLint `react/no-unescaped-entities`)
- `pavan/app/playground/highlights/HighlightCard.tsx` — Moved image above text in card layout
- `pavan/app/globals.css` — Added `scroll-behavior: smooth` on `html`
- `pavan/scripts/add-highlight.ts` — Added URL validation (rejects non-URLs). Added fxtwitter JSON API fallback for X posts (X blocks og meta tags for bots). Tries `og:description`, `twitter:description`, `description` meta tags before fallback.
- `.github/workflows/add-highlight.yml` — Added `permissions: contents: write` (GitHub Actions bot couldn't push without it)
- `chat-api/server.js` — Changed chat endpoint from `POST /chat` to `POST /` for cleaner URL (`chat.pavankumarny.me` instead of `chat.pavankumarny.me/chat`)

#### Created
- `pavan/app/components/PageEnter.tsx` — Client component: gentle fade + 8px slide-up on mount (400ms, ease-ink curve). No exit animation — navigation stays instant.
- `pavan/content/highlights/2026-04-15-here-we-go-fdotinc-if-you-are-a-builder-.md` — First highlight added via iOS Shortcut pipeline (X post, auto-scraped)
- `pavan/public/highlights/2026-04-15-here-we-go-fdotinc-if-you-are-a-builder-.jpg` — Auto-downloaded image from X post via fxtwitter API

#### Deleted
- `pavan/app/components/PageTransition.tsx` — Removed: AnimatePresence mode="wait" caused visible delay between Home ↔ Playground
- `pavan/app/playground/components/PlaygroundTransition.tsx` — Removed: same issue within playground tabs

### Bugs Found & Fixed

1. **ESLint `react/no-unescaped-entities`** — `I'll` in hire-me page. Fix: `I&apos;ll`
2. **PlaygroundNav active tab invisible** — `z-index: -1` on activeBg was clipped by parent stacking context. Fix: added `isolation: isolate` on `.tab`
3. **Nav ↔ PlaygroundNav layoutId clash** — Both navs shared the same Framer Motion layout context, causing the active pill to teleport between them on route change. Fix: wrapped each in separate `LayoutGroup` with unique `id`
4. **Nav Playground pill not active on sub-routes** — `pathname === "/playground"` didn't match `/playground/public`. Fix: `pathname.startsWith("/playground")`
5. **AnimatePresence page transitions too slow** — `mode="wait"` blocks new page until exit completes, creating visible pop-in/pop-out. Fix: removed entirely, replaced with mount-only `PageEnter` animation
6. **Vercel 404 NOT_FOUND** — Framework not detected (showed as "Other" instead of "Next.js") because `package.json` is in `pavan/` subdirectory, not repo root. Fix: manually set Framework Preset to Next.js in Vercel Build & Deployment settings
7. **Cloudflare proxy conflict** — Orange cloud (proxy enabled) caused SSL conflicts with Vercel. Fix: 1-click fix in Vercel to disable Cloudflare proxy (DNS only / grey cloud)
8. **GitHub Action push permission denied** — `github-actions[bot]` can't push by default. Fix: added `permissions: contents: write` to workflow YAML
9. **iOS Shortcut sent text instead of URL** — User typed "It's the one with the latest copied link" instead of pasting URL. Fix: added URL validation (`/^https?:\/\/.+/`) with clear error message
10. **X/Twitter scraping fails** — X blocks all og/meta tags for server-side scrapers. `fxtwitter.com` HTML also strips them. Fix: use `api.fxtwitter.com` JSON API which returns `tweet.text` and `tweet.media.photos[0].url`
11. **Chat API endpoint mismatch** — Frontend fetched `NEXT_PUBLIC_CHAT_API_URL` directly, but server expected `/chat` path. Fix: changed server endpoint from `POST /chat` to `POST /` so `chat.pavankumarny.me` works without path suffix

### Infrastructure Setup

#### Vercel Deployment
- **Project**: PavanCodesNY/Pavan on Vercel
- **Root Directory**: `pavan` (not `./` — the Next.js app is in a subdirectory)
- **Framework Preset**: Next.js (must be set manually — auto-detect fails for subdirectory projects)
- **Environment Variables**: `NEXT_PUBLIC_CHAT_API_URL` = `https://chat.pavankumarny.me`
- **Auto-deploy**: Pushes to `main` trigger rebuild + deploy

#### Custom Domain (Cloudflare DNS → Vercel)
- `pavankumarny.me` → A record `76.76.21.21` (Cloudflare proxy OFF)
- `www.pavankumarny.me` → CNAME `cname.vercel-dns.com` (Cloudflare proxy OFF)
- **Critical**: Cloudflare proxy must be OFF (grey cloud). Vercel handles SSL. Orange cloud causes certificate conflicts.

#### Chat API (Docker + Cloudflare Tunnel)
- **Container**: `docker compose up -d --build` in `chat-api/`
- **Port mapping**: host 3099 → container 3001
- **Claude auth**: `docker exec -it chat-api claude auth login` (one-time, tokens persist in `claude-auth` Docker volume)
- **Cloudflare Tunnel setup**:
  1. `brew install cloudflare/cloudflare/cloudflared`
  2. `cloudflared tunnel login` (authenticates via browser, select `pavankumarny.me`)
  3. `cloudflared tunnel create chat-api` (creates tunnel + credentials JSON)
  4. Config at `~/.cloudflared/config.yml`: tunnel ID, credentials path, ingress `chat.pavankumarny.me` → `http://localhost:3099`
  5. `cloudflared tunnel route dns chat-api chat.pavankumarny.me` (adds CNAME in Cloudflare)
  6. `cloudflared tunnel run chat-api` (starts tunnel)
  7. `sudo cloudflared service install` (survives reboots)

#### iOS Shortcut ("Add Highlight")
- **Action 1**: Ask for Input → "Paste the Post URL" (type: URL)
- **Action 2**: Dispatch Workflow → Owner: `PavanCodesNY`, Workflow ID: `add-highlight.yml`, Repository: `Pavan`, Branch: `main`, Inputs: `{"url":"[Ask for Input]"}`, Account: `PavanCodesNY`
- **Action 3**: Show Notification → "Highlight Added!"
- **Pipeline**: Shortcut → GitHub API → Action runs scraper → commits .md + image → pushes to main → Vercel auto-deploys → live in ~60 seconds

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
