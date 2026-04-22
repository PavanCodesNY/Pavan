# Chat API Playbook — PKNY End-to-End

Complete reference for how the PKNY chat on `pavankumarny.me` actually works, from the user typing a message to markdown rendering on screen.

---

## 1. What PKNY Is

A chat widget on the portfolio that talks to Claude using Pavan's **Claude Code subscription** — no API key, no OpenRouter, no per-token billing. The Claude CLI runs inside a Docker container on Pavan's Mac, exposed to the internet through a Cloudflare Tunnel at `chat.pavankumarny.me`. The frontend (hosted on Vercel) streams responses over a chunked HTTP connection.

---

## 2. Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ Browser on pavankumarny.me                                       │
│  ChatBar.tsx — fetch POST https://chat.pavankumarny.me/          │
│  Body: {"messages":[{"role":"user","content":"..."}]}            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Cloudflare DNS                                                   │
│  chat.pavankumarny.me → CNAME → <tunnel-id>.cfargotunnel.com     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Cloudflare Edge (lax01 / lax10)                                  │
│  TLS terminated here. Routes over QUIC to local daemon.          │
└──────────────────────────────────────────────────────────────────┘
                              ↓  4 persistent QUIC connections
┌──────────────────────────────────────────────────────────────────┐
│ cloudflared daemon on Pavan's Mac (launchd, KeepAlive=true)      │
│  /etc/cloudflared/config.yml ingress rule:                       │
│    chat.pavankumarny.me → http://localhost:3099                  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Docker host port-forward 3099 → container port 3001              │
│  Container: chat-api (restart:always)                            │
│  Volume: claude-auth → /root/.claude (persists Claude login)     │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ Express server (chat-api/server.js)                              │
│  POST /   → validates messages → builds prompt with SYSTEM_PROMPT│
│  Streams text chunks via Transfer-Encoding: chunked              │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│ @anthropic-ai/claude-code SDK → query()                          │
│  AsyncGenerator<SDKMessage>                                      │
│  Uses Claude Code CLI auth (subscription, no API key)            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
                       ← text blocks stream back up the chain ←
```

---

## 3. Request Lifecycle (step by step)

1. **User types in ChatBar** (bottom-center widget on the site). On submit, ChatBar sets `status="expanded"`, appends the user message to state, then calls `streamResponse(allMessages)`.

2. **ChatBar creates an `AbortController`** so the stream can be cancelled if the user collapses or navigates away. The ref `abortRef.current = controller` is also used on component unmount.

3. **Fetch call:**
   ```js
   fetch(CHAT_API_URL, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ messages: allMessages }),
     signal: controller.signal,
   })
   ```
   `CHAT_API_URL` comes from `process.env.NEXT_PUBLIC_CHAT_API_URL` (set in Vercel → `https://chat.pavankumarny.me`).

4. **DNS lookup:** `chat.pavankumarny.me` resolves to Cloudflare edge IPs via a CNAME to the tunnel. Cloudflare terminates TLS at the edge and keeps the connection open over QUIC to the local `cloudflared` daemon.

5. **Ingress match:** cloudflared reads its config, matches the hostname to `http://localhost:3099`, and forwards the HTTP request there.

6. **Docker port-forward:** host port 3099 maps to container port 3001 where the Express server listens.

7. **Express handler (`POST /`):**
   - `cors` middleware checks `Origin` against `ALLOWED_ORIGINS` allowlist
   - `express.json()` parses the body
   - Validates `messages` is an array — returns 400 if not
   - Builds a single prompt string: `SYSTEM_PROMPT + conversationContext + "Respond to the user's latest message."`
   - Sets streaming headers: `Content-Type: text/plain`, `Transfer-Encoding: chunked`, `Cache-Control: no-cache`

8. **Call to Claude Code SDK:**
   ```js
   const conversation = query({ prompt, options: { maxTurns: 1 } });
   ```
   This returns an `AsyncGenerator<SDKMessage>`. The SDK invokes the installed `claude` CLI, which uses the saved auth tokens from `/root/.claude/` (the persistent Docker volume).

9. **Stream loop:** server iterates messages, extracts `text` blocks from `message.message.content[]`, writes each chunk to the HTTP response with `res.write(block.text)`. Client receives them in real-time.

10. **Frontend stream reader:** ChatBar reads the `ReadableStream` from `res.body.getReader()` using a `TextDecoder`. Each chunk is appended to the placeholder assistant message's `content` field in state. While streaming, the message shows a `LoadingMessage` (cycling Gen-Z phrases).

11. **Stream ends:** server calls `res.end()`. Frontend flips `isStreaming=false` on the last message. `TypewriterMessage` now plays a one-time character-by-character reveal. When complete, it calls `onSeen`, which adds the index to `seenRef` so the message renders as plain `ReactMarkdown` from that point on (survives re-renders without retyping).

12. **Abort path:** if the user collapses the bar or unmounts the component, `abortRef.current.abort()` is called. The server catches `AbortError` and gracefully ends the response.

---

## 4. The Six Layers — Deep Dive

### 4.1 Frontend (Next.js on Vercel)

**File:** `pavan/app/components/ChatBar.tsx`

Three-state state machine using Framer Motion for layout morphing:
- `compact` — 140×36 pill at bottom center
- `bar` — input bar (half viewport wide) when hovered
- `expanded` — full chat panel (up to 520×460) once a message is sent

Hover listeners:
- `handleMouseEnter`: compact → bar (or expanded if messages exist)
- `handleMouseLeave`: collapse back to compact (blocked while streaming)

Key state:
- `messages: Message[]` — conversation array
- `isStreaming: boolean` — disables input, prevents collapse
- `seenRef: Set<number>` — tracks which messages have played their typewriter

**File:** `pavan/app/components/ChatMessage.tsx`

Render logic:
```
isWaiting       → <LoadingMessage />       (Gen-Z phrases cycle)
seen            → <ReactMarkdown />        (markdown, no animation)
!isStreaming    → <TypewriterMessage />    (one-time reveal, calls onSeen)
isStreaming     → <LoadingMessage />       (don't show raw text mid-stream)
```

Why typewrite-once: prevents the reveal from replaying on every re-render (e.g., when window resizes or state updates elsewhere).

**Env var:** `NEXT_PUBLIC_CHAT_API_URL` — set in Vercel dashboard to `https://chat.pavankumarny.me`. For local dev: `pavan/.env.local` with `http://localhost:3099`.

### 4.2 DNS (Cloudflare)

`chat.pavankumarny.me` → CNAME to `<tunnel-id>.cfargotunnel.com`. Added automatically when you run `cloudflared tunnel route dns chat-api chat.pavankumarny.me`.

**Important contrast with the site domain:**
- `pavankumarny.me` → A `76.76.21.21` → **Proxy OFF** (grey cloud). Vercel handles TLS; orange cloud breaks it.
- `chat.pavankumarny.me` → CNAME to tunnel → **Proxy ON** (managed by tunnel automatically). Cloudflare MUST be in the path because that's how tunnels work.

Don't touch this record manually — the tunnel owns it.

### 4.3 Cloudflare Tunnel (the protocol)

Replaces: port forwarding, dynamic DNS, ngrok, a VPS proxy.

Why it's better:
- **Zero inbound ports open** on your home network / router
- **Free** (no bandwidth or request limits that matter at this scale)
- **Stable hostname** — unlike ngrok's rotating URL on the free plan
- **Auto failover** — 4 persistent connections to 2 edge datacenters; if one edge drops, traffic seamlessly moves

The tunnel is identified by a UUID (`cea3352a-fdf0-4f19-b96c-161ebdcb65e2` for us). Credentials are a JSON file with an origin cert — store it at `/etc/cloudflared/` so the launchd-run daemon (which runs as root with a different home) can find it.

### 4.4 cloudflared daemon (launchd)

**Plist:** `/Library/LaunchDaemons/com.cloudflare.cloudflared.plist`

Critical keys:
```xml
<key>ProgramArguments</key>
<array>
  <string>/opt/homebrew/bin/cloudflared</string>
  <string>--config</string>
  <string>/etc/cloudflared/config.yml</string>
  <string>tunnel</string>
  <string>run</string>
</array>
<key>RunAtLoad</key><true/>
<key>KeepAlive</key><true/>
```

**Known bug:** `sudo cloudflared service install` installs a plist with NO arguments — it runs `cloudflared` bare, which does nothing. That's why we manually wrote this plist. If you ever re-run `service install`, verify the plist arguments include `tunnel run`.

**Logs:**
- `/Library/Logs/com.cloudflare.cloudflared.out.log`
- `/Library/Logs/com.cloudflare.cloudflared.err.log`

**Config file:** `/etc/cloudflared/config.yml`
```yaml
tunnel: cea3352a-fdf0-4f19-b96c-161ebdcb65e2
credentials-file: /etc/cloudflared/cea3352a-fdf0-4f19-b96c-161ebdcb65e2.json

ingress:
  - hostname: chat.pavankumarny.me
    service: http://localhost:3099
  - service: http_status:404
```

The `http_status:404` catch-all is required — cloudflared refuses to start without a final fallback rule.

### 4.5 Docker container

**File:** `chat-api/Dockerfile`
```dockerfile
FROM node:22-slim
WORKDIR /app
RUN npm install -g @anthropic-ai/claude-code     # Claude CLI
COPY package.json package-lock.json* ./
RUN npm install --production
COPY . .
EXPOSE 3001
ENV PORT=3001
CMD ["node", "server.js"]
```

**File:** `chat-api/docker-compose.yml`
```yaml
services:
  chat-api:
    build: .
    container_name: chat-api
    restart: always
    ports:
      - "3099:3001"
    volumes:
      - claude-auth:/root/.claude
    environment:
      - PORT=3001
      - ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,...,https://pavankumarny.me,https://www.pavankumarny.me

volumes:
  claude-auth:
```

**Why each setting:**
- `restart: always` — auto-restarts on crash OR machine reboot
- `3099:3001` — 3099 host-side (what cloudflared targets) → 3001 inside container
- `claude-auth` volume — persists `/root/.claude` across container rebuilds so you don't re-authenticate every time
- `ALLOWED_ORIGINS` — comma-separated CORS allowlist, consumed by server.js

### 4.6 Express server

**File:** `chat-api/server.js`

Two endpoints:
- `GET /health` — returns `{"status":"ok"}` (add a monitor if you want uptime alerts)
- `POST /` — the chat endpoint

Chat endpoint flow:
1. Validates `{messages}` is an array
2. Flattens conversation into a single prompt string
3. Prepends `SYSTEM_PROMPT`
4. Sets chunked streaming headers
5. Calls `query({prompt, options: {maxTurns: 1}})`
6. Iterates the `AsyncGenerator`, writing only `text`-type content blocks
7. Handles `AbortError` gracefully (client disconnected)

**Why `POST /` and not `POST /chat`:** we changed this so `NEXT_PUBLIC_CHAT_API_URL` can be just `https://chat.pavankumarny.me` without a path suffix — cleaner env var.

---

## 5. The System Prompt

**File:** `chat-api/system-prompt.js`

Contains:
- Full Pavan bio (India → US, Granite Bay HS, UCSD, research, Cisco, Cliqk, Clean)
- Hackathon track record
- Technical skills
- Personality rules (concise, real, no fabrication, no politics)
- Example tone lines

**Why the whole bio every request:** each `query()` call is independent (new Claude session). There's no conversation persistence on the model side, only what we stuff into the prompt. The SYSTEM_PROMPT + conversation history are sent fresh every time.

**Token cost:** ~2K tokens per request just for the bio. Acceptable because we're on the subscription plan (not paying per token).

**To update:** edit the file → `docker compose up -d --build` → done. No redeploy on Vercel needed.

---

## 6. Configuration File Reference

| File | Purpose | Edit triggers rebuild? |
|------|---------|------------------------|
| `chat-api/server.js` | Express server, endpoints, stream logic | Yes |
| `chat-api/system-prompt.js` | PKNY bio + personality | Yes |
| `chat-api/Dockerfile` | Container recipe | Yes |
| `chat-api/docker-compose.yml` | Ports, volumes, env vars, CORS | Yes |
| `chat-api/package.json` | Deps (express, cors, @anthropic-ai/claude-code) | `npm install` then rebuild |
| `/etc/cloudflared/config.yml` | Tunnel ingress rules | `launchctl kickstart -k system/com.cloudflare.cloudflared` |
| `/etc/cloudflared/<uuid>.json` | Tunnel credentials | Never edit by hand |
| `/Library/LaunchDaemons/com.cloudflare.cloudflared.plist` | launchd service definition | `launchctl bootout` then `bootstrap` |
| Vercel env var `NEXT_PUBLIC_CHAT_API_URL` | Frontend API URL | Redeploy on Vercel |

---

## 7. Runtime State Commands

```bash
# Docker container
docker ps --filter name=chat-api
docker logs chat-api --tail 50
docker stats chat-api --no-stream

# cloudflared daemon
ps aux | grep cloudflared | grep -v grep
launchctl print system/com.cloudflare.cloudflared | head -30
cloudflared tunnel info chat-api
tail -50 /Library/Logs/com.cloudflare.cloudflared.err.log

# End-to-end tests
curl http://localhost:3099/health                       # Docker direct
curl https://chat.pavankumarny.me/health                # Via tunnel

# Full chat roundtrip
curl -X POST https://chat.pavankumarny.me/ \
  -H "Content-Type: application/json" \
  -H "Origin: https://pavankumarny.me" \
  -d '{"messages":[{"role":"user","content":"say hi"}]}'
```

---

## 8. Setup from Scratch (fresh machine)

### Step 1 — Install prerequisites
```bash
brew install --cask docker
open -a Docker                  # Start Docker Desktop
# In Docker Desktop → Settings → General → check "Start Docker Desktop when you sign in"
brew install cloudflare/cloudflare/cloudflared
```

### Step 2 — Clone the repo
```bash
git clone https://github.com/PavanCodesNY/Pavan.git
cd Pavan/chat-api
```

### Step 3 — Build and start the container
```bash
docker compose up -d --build
docker logs -f chat-api         # should see "Chat API running on port 3001"
```

### Step 4 — Authenticate Claude CLI (one-time)
```bash
docker exec -it chat-api claude auth login
# Follow the browser link. Token is stored in the claude-auth volume.
```

### Step 5 — Test locally
```bash
curl -X POST http://localhost:3099/ \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
```

### Step 6 — Create Cloudflare Tunnel
```bash
cloudflared tunnel login                            # browser auth, pick pavankumarny.me
cloudflared tunnel create chat-api                  # note the UUID it prints
cloudflared tunnel route dns chat-api chat.pavankumarny.me
```

### Step 7 — Move config to system location
```bash
sudo mkdir -p /etc/cloudflared
sudo cp ~/.cloudflared/<UUID>.json /etc/cloudflared/
cat <<EOF | sudo tee /etc/cloudflared/config.yml
tunnel: <UUID>
credentials-file: /etc/cloudflared/<UUID>.json

ingress:
  - hostname: chat.pavankumarny.me
    service: http://localhost:3099
  - service: http_status:404
EOF
```

### Step 8 — Install launchd service with correct plist
```bash
cat <<'EOF' | sudo tee /Library/LaunchDaemons/com.cloudflare.cloudflared.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key><string>com.cloudflare.cloudflared</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/cloudflared</string>
        <string>--config</string>
        <string>/etc/cloudflared/config.yml</string>
        <string>tunnel</string>
        <string>run</string>
    </array>
    <key>RunAtLoad</key><true/>
    <key>KeepAlive</key><true/>
    <key>StandardOutPath</key><string>/Library/Logs/com.cloudflare.cloudflared.out.log</string>
    <key>StandardErrorPath</key><string>/Library/Logs/com.cloudflare.cloudflared.err.log</string>
    <key>ThrottleInterval</key><integer>5</integer>
</dict>
</plist>
EOF

sudo launchctl bootstrap system /Library/LaunchDaemons/com.cloudflare.cloudflared.plist
sudo launchctl kickstart -k system/com.cloudflare.cloudflared
```

### Step 9 — Verify end-to-end
```bash
curl https://chat.pavankumarny.me/health
```

### Step 10 — Point Vercel at the tunnel
In the Vercel dashboard for the portfolio project:
- Settings → Environment Variables
- Add `NEXT_PUBLIC_CHAT_API_URL` = `https://chat.pavankumarny.me`
- Redeploy

---

## 9. Failure Modes (every bug we actually hit)

| Symptom | Root cause | Fix |
|---------|------------|-----|
| `error code: 1033` in browser/curl | Tunnel process down or disconnected from Cloudflare edge | `sudo launchctl kickstart -k system/com.cloudflare.cloudflared`. Verify with `ps aux \| grep cloudflared`. |
| `502 Bad Gateway` | Tunnel up, but Docker container down | `docker ps` → if missing: `docker compose up -d` from `chat-api/`. |
| `500 Internal Server Error` | Claude CLI auth expired | `docker exec -it chat-api claude auth login`. |
| Request hangs, no response | Plist installed without `tunnel run` arguments; cloudflared running but idle | Check `launchctl print system/com.cloudflare.cloudflared \| grep -A 8 arguments`. Rewrite the plist (Step 8 above), bootout, bootstrap, kickstart. |
| `CORS error` in browser console | Origin not in `ALLOWED_ORIGINS` | Edit `docker-compose.yml` env var, `docker compose up -d --build`. |
| Site (not chat) shows SSL error | Cloudflare proxy set to ON for `pavankumarny.me` A record (conflicts with Vercel) | Turn proxy OFF (grey cloud) for main domain — but keep it ON for `chat.` since the tunnel requires it. |
| Empty body from `docker logs`, container keeps restarting | Dockerfile or server.js syntax error | `docker logs chat-api` without the filter; usually shows a Node stack trace. |
| Everything dies after reboot | Docker Desktop not set to autostart | Docker Desktop → Settings → General → "Start Docker Desktop when you sign in". |

---

## 10. How to Update Anything

| What | How |
|------|-----|
| Bio / personality | Edit `chat-api/system-prompt.js` → `docker compose up -d --build` from `chat-api/`. No Vercel redeploy needed. |
| CORS origins | Edit `chat-api/docker-compose.yml` `ALLOWED_ORIGINS` → rebuild container. |
| Server code (endpoints, streaming) | Edit `chat-api/server.js` → rebuild. |
| Tunnel hostname or port | Edit `/etc/cloudflared/config.yml` → `sudo launchctl kickstart -k system/com.cloudflare.cloudflared`. |
| Frontend chat URL | Vercel → Settings → Environment Variables → update `NEXT_PUBLIC_CHAT_API_URL` → redeploy. |
| Claude auth (if expired) | `docker exec -it chat-api claude auth login`. |
| ChatBar appearance / behavior | Edit `pavan/app/components/ChatBar.tsx` + `.module.css` → commit → push (Vercel auto-deploys). |
| Typewriter speed / loading phrases | Edit `pavan/app/components/ChatMessage.tsx` → commit → push. |

---

## 11. Security Posture

**What's protected:**
- HTTPS end-to-end (Cloudflare edge + tunnel is TLS-wrapped even though the last hop is plain HTTP to `localhost:3099`)
- CORS allowlist blocks random origins from calling the API
- No Anthropic API key to leak — auth lives in a Docker volume, never in env vars or code
- Cloudflare Tunnel means zero inbound ports opened on the home router

**What's NOT protected (accepted risk):**
- **No rate limiting.** A motivated attacker who finds the URL can spam requests, burning Pavan's Claude subscription quota. Mitigation: add `express-rate-limit` or Cloudflare WAF rate limit rules if abuse happens.
- **No authentication on `POST /`.** Anyone who hits the endpoint with a valid CORS origin (or no `Origin` header from `curl`) gets a response. Mitigation: for the upcoming Private Section, add a JWT middleware. The public PKNY chat doesn't need auth.
- **Claude-side guardrails.** PKNY can still be coaxed into off-topic chats; the system prompt mitigates but doesn't eliminate this.

---

## 12. Cost

| Item | Tier | Cost/mo |
|------|------|---------|
| Vercel (static site) | Hobby | $0 |
| Cloudflare DNS | Free | $0 |
| Cloudflare Tunnel | Free | $0 |
| GitHub Actions (highlight pipeline) | Free tier (2000 min) | $0 |
| Claude Max subscription | Paid | $100 |
| `pavankumarny.me` domain | Annual | ~$1 |
| Mac running Docker + tunnel | Existing | $0 (electricity) |

**Total marginal cost: ~$100/mo**, almost all of it the Claude subscription which Pavan would pay for anyway.

---

## See Also
- `docs/PLAYBOOK.md` — general site ops (highlights pipeline, iOS Shortcut, deployment)
- `docs/ARCHITECTURE.md` — design tokens and frontend architecture
- `docs/ROADMAP-private-voice-blog.md` — next build: authed private section
