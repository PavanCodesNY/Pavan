# Playbook — How Everything Works

This is the definitive guide to every system on pavankumarny.me. If you're rebuilding, debugging, or extending anything, start here.

---

## 1. Site Overview

| Layer | Tech | Location |
|-------|------|----------|
| Frontend | Next.js 16 + React 19 + Framer Motion | `pavan/` |
| Styling | CSS Modules + CSS custom properties | `pavan/app/**/*.module.css` |
| Fonts | Clash Display (display), Instrument Serif (body) | `pavan/public/fonts/` |
| Hosting | Vercel (static/SSG) | Auto-deploys from `main` |
| Chat API | Express.js + Claude CLI | `chat-api/` (Docker on local Mac) |
| Tunnel | Cloudflare Tunnel → `chat.pavankumarny.me` | `~/.cloudflared/config.yml` |
| Domain | `pavankumarny.me` via Cloudflare DNS → Vercel | Cloudflare dashboard |
| CI | GitHub Actions | `.github/workflows/` |

---

## 2. Local Development

```bash
cd pavan
npm install
npm run dev        # http://localhost:3000
npm run lint       # ESLint
npm run build      # Production build (verify before pushing)
```

---

## 3. Deployment Pipeline

**Push to `main` → Vercel auto-deploys → live in ~60 seconds.**

Vercel config:
- Root Directory: `pavan`
- Framework: Next.js (must be set manually — auto-detect fails for subdirectory projects)
- Env var: `NEXT_PUBLIC_CHAT_API_URL` = `https://chat.pavankumarny.me`

---

## 4. Adding a Highlight (LinkedIn/X/Instagram post)

### From iPhone (iOS Shortcut)
1. Open **"Add Highlight"** shortcut
2. Paste the post URL
3. Done — GitHub Action scrapes it, commits, Vercel deploys

### Manually
```bash
cd pavan
npx tsx scripts/add-highlight.ts "https://linkedin.com/posts/..."
git add content/highlights/ public/highlights/
git commit -m "Add highlight: post-name"
git push
```

### How the scraper works (`scripts/add-highlight.ts`)
1. Detects platform from URL (linkedin/x/instagram)
2. Fetches the page HTML
3. Extracts `og:description` for text (falls back to `twitter:description`, then `description`)
4. For X posts: uses `api.fxtwitter.com` JSON API (X blocks meta tags for bots)
5. Extracts `og:image` and downloads to `public/highlights/`
6. For LinkedIn: extracts date from activity ID (BigInt timestamp)
7. Writes `.md` file with YAML frontmatter to `content/highlights/`

### Content format (`content/highlights/*.md`)
```markdown
---
platform: linkedin
date: April 14, 2026
url: https://linkedin.com/posts/...
image: /highlights/2026-04-14-slug.jpg
---

Post text here...
```

### GitHub Action (`add-highlight.yml`)
- Trigger: `workflow_dispatch` with `url` input
- Runs: `npx tsx scripts/add-highlight.ts "$URL"`
- Commits + pushes to `main`
- Needs: `permissions: contents: write`

### iOS Shortcut config ("Add Highlight")
- Action 1: Ask for Input → "Paste the Post URL" (type: URL)
- Action 2: Dispatch Workflow → Owner: `PavanCodesNY`, Workflow ID: `add-highlight.yml`, Repository: `Pavan`, Branch: `main`, Inputs: `{"url":"[Ask for Input]"}`
- Action 3: Show Notification → "Highlight Added!"

---

## 5. Chat API (PKNY)

### Architecture
```
pavankumarny.me → fetch POST → chat.pavankumarny.me → Docker container → Claude CLI
```

### Starting / Restarting
```bash
cd chat-api
docker compose up -d --build    # Build and start
docker logs chat-api             # View logs
docker restart chat-api          # Restart
```

### First-time Claude auth
```bash
docker exec -it chat-api claude auth login
# Follow browser link to authenticate
# Tokens persist in claude-auth Docker volume
```

### System prompt
`chat-api/system-prompt.js` — contains Pavan's full bio, achievements, and personality rules. Update this file and rebuild the container whenever bio info changes.

### Endpoint
`POST /` — accepts `{"messages": [{"role": "user", "content": "..."}]}`, streams response as chunked text.

### CORS
Allowed origins set in `docker-compose.yml` → `ALLOWED_ORIGINS` env var. Currently: localhost:3000-3005, pavankumarny.me, www.pavankumarny.me.

---

## 6. Cloudflare Tunnel

### Config location
`~/.cloudflared/config.yml`:
```yaml
tunnel: <tunnel-id>
credentials-file: ~/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: chat.pavankumarny.me
    service: http://localhost:3099
  - service: http_status:404
```

### Commands
```bash
cloudflared tunnel run chat-api     # Start tunnel
cloudflared tunnel list             # List tunnels
cloudflared tunnel info chat-api    # Tunnel details
```

### Survives reboots
`sudo cloudflared service install` — registers as a macOS launchd service.

### DNS
`chat.pavankumarny.me` → CNAME to Cloudflare Tunnel (added via `cloudflared tunnel route dns`).

---

## 7. Domain & DNS (Cloudflare)

| Record | Type | Name | Content | Proxy |
|--------|------|------|---------|-------|
| Site | A | `@` | `76.76.21.21` | OFF (grey cloud) |
| WWW | CNAME | `www` | `cname.vercel-dns.com` | OFF (grey cloud) |
| Chat | CNAME | `chat` | `<tunnel-id>.cfargotunnel.com` | ON (managed by tunnel) |

**Critical: Cloudflare proxy must be OFF for Vercel domains.** Vercel handles SSL. Orange cloud causes certificate conflicts.

---

## 8. Playground Pages

| Tab | Route | Type | Content Source |
|-----|-------|------|---------------|
| Public | `/playground/public` | Static (SSG) | `pavan/app/playground/data/posts.ts` |
| Hire Me | `/playground/hire-me` | Static | Hardcoded in component |
| Highlights | `/playground/highlights` | Static | `pavan/content/highlights/*.md` |
| Private | `/playground/private` | Planned | `chat-api/content/private/` (server-side, see roadmap) |

### Navigation
`PlaygroundNav.tsx` — Framer Motion `layoutId` sliding pill indicator. Add tabs by pushing to the `TABS` array.

### Top Nav
`Nav.tsx` — Framer Motion `layoutId="nav-active"`. Both navs wrapped in separate `LayoutGroup` to prevent cross-contamination.

---

## 9. Animations

| What | How | File |
|------|-----|------|
| Nav pill slide | Framer Motion `layoutId` spring | `Nav.tsx`, `PlaygroundNav.tsx` |
| Playground entrance | `PageEnter` — fade + 8px slide-up on mount | `PageEnter.tsx` |
| Avatar hover/tap | Framer Motion `whileHover`/`whileTap` springs | `Avatar.tsx` |
| Chat bar morphing | Framer Motion `animate` width/height | `ChatBar.tsx` |
| Custom cursor | Spring physics via PointerProvider RAF | `CustomCursor.tsx` |
| Magnetic text | Spring physics per span | `MagneticLine.tsx` |
| Breathing prose | IntersectionObserver + pointer proximity | `BreathingProse.tsx` |
| Smooth scrolling | CSS `scroll-behavior: smooth` | `globals.css` |

**Rule: No AnimatePresence `mode="wait"` for page transitions.** It causes visible pop-in/pop-out delay. Use mount-only animations instead.

---

## 10. Common Bugs & Solutions

| Bug | Cause | Fix |
|-----|-------|-----|
| ESLint `react/no-unescaped-entities` | Apostrophes in JSX | Use `&apos;` |
| PlaygroundNav active tab invisible | `z-index: -1` clipped by stacking context | Add `isolation: isolate` on parent |
| Nav pills animate across navs | Shared Framer Motion layout context | Wrap in separate `LayoutGroup` with unique `id` |
| Playground pill not active on sub-routes | Exact match `===` instead of prefix | Use `startsWith` |
| Page transition too slow | `AnimatePresence mode="wait"` blocks render | Remove, use mount-only animation |
| Vercel 404 | Framework not detected for subdirectory project | Set Framework Preset to Next.js manually |
| Cloudflare proxy conflict | Orange cloud + Vercel = SSL error | Turn proxy OFF (grey cloud) for Vercel domains |
| GitHub Action can't push | Missing write permission | Add `permissions: contents: write` to workflow |
| X/Twitter scraping fails | X blocks meta tags for bots | Use `api.fxtwitter.com` JSON API |
| Chat endpoint mismatch | Frontend hits root, server expects `/chat` | Change server to `POST /` |

---

## 11. Prompt Templates

### Adding a new playground tab
```
Add a new tab called "[Name]" to the playground. Follow the existing pattern:
1. Add to TABS array in PlaygroundNav.tsx
2. Create app/playground/[name]/page.tsx and page.module.css
3. Match existing styling (--ink, --paper, --measure, --font-display, --font-body)
4. Use CSS Modules, no Tailwind in JSX
```

### Adding a new highlight scraper platform
```
Add support for [platform] posts in scripts/add-highlight.ts:
1. Add platform detection in detectPlatform()
2. Add meta tag extraction (og:description, og:image)
3. If the platform blocks meta tags, find a proxy API (like fxtwitter for X)
4. Test with: npx tsx scripts/add-highlight.ts "[url]"
```

### Updating PKNY's knowledge
```
Update chat-api/system-prompt.js with [new info]. Then:
1. Edit the system prompt
2. cd chat-api && docker compose up -d --build
3. git add chat-api/system-prompt.js && git commit && git push origin HEAD:main
The container rebuild makes it live instantly. The git push is for version control.
```

### Setting up Cloudflare Tunnel for a new subdomain
```
1. cloudflared tunnel route dns chat-api [subdomain].pavankumarny.me
2. Add ingress rule to ~/.cloudflared/config.yml:
   - hostname: [subdomain].pavankumarny.me
     service: http://localhost:[port]
3. Restart tunnel: cloudflared tunnel run chat-api
   (or restart the service if installed)
```

### Deploying a code change
```
1. Make changes in pavan/
2. npm run lint && npm run build (verify locally)
3. git add [files] && git commit -m "description"
4. git push origin HEAD:main
5. Vercel auto-deploys in ~60 seconds
```

### Debugging a failed GitHub Action
```
gh run list --repo PavanCodesNY/Pavan --workflow [workflow].yml --limit 5
gh run view [run-id] --repo PavanCodesNY/Pavan --log-failed
```

---

## 12. File Tree (key files only)

```
dublin-v1/
├── .github/workflows/
│   ├── ci.yml                    # Lint + build on push/PR
│   └── add-highlight.yml         # Scraper workflow_dispatch
├── chat-api/
│   ├── server.js                 # Express server (POST /)
│   ├── system-prompt.js          # PKNY bio + personality
│   ├── docker-compose.yml        # Port 3099→3001, CORS, volumes
│   └── Dockerfile                # Node 22 + Claude CLI
├── docs/
│   ├── CHANGELOG.md              # Every change with files touched
│   ├── COMPONENTS.md             # Component inventory
│   ├── ARCHITECTURE.md           # Tech stack + design tokens
│   ├── PLAYBOOK.md               # This file
│   └── ROADMAP-private-voice-blog.md  # Next sprint plan
└── pavan/
    ├── app/
    │   ├── components/           # Shell, Nav, Avatar, ChatBar, PageEnter
    │   ├── playground/
    │   │   ├── components/       # PlaygroundNav
    │   │   ├── data/             # posts.ts, highlights.ts
    │   │   ├── public/           # Blog list + [slug]
    │   │   ├── hire-me/          # "Not right now."
    │   │   └── highlights/       # HighlightCard, HighlightBody
    │   ├── globals.css           # Design tokens
    │   └── layout.tsx            # Root layout + fonts
    ├── content/highlights/       # .md files (build-time content)
    ├── public/highlights/        # Scraped images
    ├── scripts/add-highlight.ts  # URL → .md scraper
    └── tsconfig.json             # Excludes scripts/
```
