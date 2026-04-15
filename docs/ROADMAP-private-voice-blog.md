# Private Section + Voice Blog Pipeline

## Context
Pavan wants a password-protected "Private" tab in the playground for personal brain dumps. Content must NEVER be in the Vercel static build — it lives only on the Docker server. He also wants an iOS Shortcut where he records a voice memo, it gets transcribed, sent to Claude to format as a blog post, and auto-saved to the private section.

## Architecture: Two Systems

### System 1: Private Section

**Security approach: Server-side auth via chat-api.** Private content lives on the Docker server only — never in git, never in the Vercel build. The frontend page is an empty client-side shell that fetches content after password authentication.

**Why not client-side password gate?** Content would be baked into the static HTML bundle. Anyone can view-source or inspect the JS bundle to read everything. Not secure.

**How it works:**
1. User visits `/playground/private` → sees password input
2. Submits password → `POST chat.pavankumarny.me/private/auth` → server bcrypt-compares → returns JWT (24h expiry)
3. JWT stored in React state only (not localStorage — lost on tab close)
4. Frontend fetches post list via `GET /private/posts` with JWT header
5. Clicks post → fetches content via `GET /private/posts/:slug` with JWT

**Backend (chat-api additions):**

| File | Purpose |
|------|---------|
| `chat-api/routes/private.js` | `POST /private/auth`, `GET /private/posts`, `GET /private/posts/:slug` |
| `chat-api/middleware/auth.js` | JWT verification middleware |
| `chat-api/content/private/` | Directory for private `.md` files (on Docker server, NOT in git) |

**Frontend (Next.js additions):**

| File | Purpose |
|------|---------|
| `app/playground/private/page.tsx` | Client component: password gate → post list → post detail |
| `app/playground/private/page.module.css` | Styles matching existing playground aesthetic |
| `app/playground/components/PlaygroundNav.tsx` | Add "Private" tab to TABS array |

**New npm deps for chat-api:** `jsonwebtoken`, `bcrypt`, `express-rate-limit`

**New env vars in docker-compose.yml:**
- `PRIVATE_PASSWORD_HASH` — bcrypt hash of chosen password
- `JWT_SECRET` — random 64-char string

**Security hardening:**
- Rate limiting on `/private/auth` (5 attempts per IP per 15 min)
- `helmet` middleware for security headers
- HTTPS enforced via Cloudflare Tunnel
- CORS restricts to pavankumarny.me only
- JWT in memory only, not localStorage

### System 2: Voice Blog Pipeline

**Flow:**
```
iPhone: Record voice memo
  → iOS Shortcuts: Transcribe audio (built-in)
    → POST chat.pavankumarny.me/blog/create (with API key + transcript)
      → chat-api: Claude formats transcript into blog post
        → Saves .md to chat-api/content/private/
          → Instantly available in private section (no deploy needed)
```

**Backend (chat-api additions):**

| File | Purpose |
|------|---------|
| `chat-api/routes/blog.js` | `POST /blog/create` — validates API key, sends to Claude, saves .md |
| `chat-api/prompts/blog-format.js` | System prompt for Claude: convert voice transcript to polished blog |

**Blog formatting prompt rules:**
- Convert raw voice transcript to polished blog post
- Generate frontmatter (title, date, excerpt)
- Preserve Pavan's voice and tone
- Clean up filler words, false starts, repetition
- Structure with paragraphs, keep it authentic

**New env var:** `BLOG_API_KEY` — random API key for iOS Shortcut auth

**iOS Shortcut: "Voice Blog"**
1. **Record Audio**
2. **Transcribe Audio** (iOS built-in, iOS 17+)
3. **Ask for Input** — optional title
4. **Get Contents of URL** — POST to `chat.pavankumarny.me/blog/create` with `Authorization: Bearer {BLOG_API_KEY}`, body: `{"transcript": "...", "title": "..."}`
5. **Show Notification** — "Blog saved!"

## Implementation Order

### Phase 1: Private auth backend
1. `npm install jsonwebtoken bcrypt express-rate-limit` in chat-api
2. Create `chat-api/middleware/auth.js` — JWT verify
3. Create `chat-api/routes/private.js` — auth + content endpoints
4. Create `chat-api/content/private/` with a test post
5. Add env vars to docker-compose.yml
6. Mount routes in server.js
7. Rebuild container, test auth flow with curl

### Phase 2: Private frontend
1. Add "Private" to PlaygroundNav TABS
2. Create `app/playground/private/page.tsx` — password gate + post list + post detail (all client-side)
3. Create `app/playground/private/page.module.css`
4. Push to main, verify on site

### Phase 3: Voice blog backend
1. Create `chat-api/prompts/blog-format.js`
2. Create `chat-api/routes/blog.js` — transcript → Claude → save .md
3. Add BLOG_API_KEY env var
4. Mount routes, rebuild container

### Phase 4: iOS Shortcut
1. Create "Voice Blog" shortcut with 5 steps above
2. Test end-to-end: record → transcribe → format → appears in private section

## Verification
1. Visit `/playground/private` → see password gate, no content in page source
2. Enter wrong password → rejected, rate limited after 5 tries
3. Enter correct password → see post list, click to expand
4. Close tab → must re-authenticate (JWT in memory only)
5. View page source / JS bundle → zero private content present
6. Record voice memo via shortcut → appears in private section within seconds
7. All existing pages (Public, Hire Me, Highlights) unaffected
