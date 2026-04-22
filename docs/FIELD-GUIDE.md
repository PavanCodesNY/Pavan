# Field Guide — Build Your Own

A short, principle-first handbook for building a personal site with a self-hosted AI backend, automation pipelines, and free infrastructure. Learn the *why* so you can apply it anywhere.

---

## 1. Core Philosophy

Three ideas everything else flows from:

1. **Content is code.** Blog posts, highlights, bio — all live as markdown files in git. No CMS, no database.
2. **Self-host the AI.** Don't pay per token when you already pay for a subscription. Run the CLI in a container.
3. **Free infrastructure where possible.** Static hosting, DNS, tunnels, and CI are free from providers happy to have you.

If a decision contradicts these, question it first.

---

## 2. The Stack (picking one)

Optimize for: **time to live**, **not locked in**, **zero ops where possible**.

- **Frontend:** any SSG framework (Next.js, Astro, SvelteKit). Pick the one you already know — this is not where you learn a new tool.
- **Hosting:** Vercel, Netlify, or Cloudflare Pages. All free. Auto-deploy on git push.
- **Domain:** wherever you buy it, move DNS to Cloudflare. Better admin UI + free tunnel later.
- **Backend:** Docker on your own machine. Or a $5/mo VPS if you don't want a machine always on.

---

## 3. Static Site Hosting

Static sites are cheaper, faster, and more reliable than servers. Ship static unless you have a real reason not to.

- Pages and content compile at build time.
- Each page is a `.html` file + some JS. No server runs per request.
- Deploy = upload files. Rollback = redeploy the previous commit.

Gotchas:
- If your app is in a **subdirectory**, hosts often fail to auto-detect the framework. Set it manually.
- Env vars are injected at build time. A change requires a redeploy.

---

## 4. Content Pipeline (files, not a CMS)

Store content as markdown with YAML frontmatter:

```
---
title: Hello
date: 2026-04-15
---

Body text.
```

Read it at build time with a small function (`fs.readdirSync` + a frontmatter parser). Render in your framework.

Why this beats a CMS:
- Git is your version control, backup, and audit log.
- You can edit on any device with any text editor.
- No vendor can deprecate your data.
- Adding a new post is `git push`.

---

## 5. Dynamic Features on a Static Site

A static site can still do live things by calling an external API from the client.

Pattern:
```
[Static frontend] ──fetch──> [Separate backend] ──> [Third-party service]
```

The frontend stays static. Only the API server (small, cheap, swappable) is dynamic. Examples: chat, search, analytics, forms.

Env var on the frontend holds the backend URL. Change the backend — redeploy the frontend once.

---

## 6. Self-Hosting an AI Backend

Why: per-token AI API bills scale badly. A subscription (Claude Max/Pro, ChatGPT Plus) is a flat fee. The CLIs for these products are usable from code.

Recipe:
1. **Dockerize** a small Express/Fastify server.
2. In the image, install the AI CLI (`claude`, whatever).
3. **Mount a volume** for the CLI's auth directory (`~/.claude`, `~/.config/...`) so login persists across rebuilds.
4. Log in once with `docker exec -it <container> <cli> auth login`.
5. Server endpoint calls the CLI's SDK (`query()`) and **streams** output to the HTTP response.

Stream with `Transfer-Encoding: chunked` and plain text. The frontend reads `response.body.getReader()` and appends chunks as they arrive. Feels like typing in real time.

---

## 7. Exposing localhost to the Internet

You have a backend running on your laptop. How does the internet reach it?

Options (ranked):

| Option | Setup | Inbound ports | Stable URL | Cost |
|--------|-------|---------------|------------|------|
| **Cloudflare Tunnel** | Medium | None | Yes | Free |
| ngrok | Easy | None | Paid tier | Free tier rotates |
| Port forward + DDNS | Hard | 80/443 open | Yes | Free |
| VPS reverse proxy | Medium | None local | Yes | ~$5/mo |

Pick Cloudflare Tunnel unless you have a reason not to. It's free, stable, and opens zero ports on your router.

---

## 8. Cloudflare Tunnel — Mental Model

Tunnels reverse the usual direction: your laptop **dials out** to Cloudflare's edge, keeping a persistent connection open. Requests come in through that connection, not through an open port on your network.

Flow:
```
User → Cloudflare edge (TLS terminates here) → QUIC tunnel → your cloudflared daemon → localhost:PORT
```

Config file (`config.yml`) says "route hostname X to localhost:Y". DNS for that hostname is a CNAME to the tunnel, auto-managed.

Two things that will bite you:
- Run it as a **system service** (launchd/systemd) so it survives reboots.
- Service runs as **root** — put config and credentials in `/etc/cloudflared/`, not your home directory.

---

## 9. DNS 101 (when proxy ON, when OFF)

Cloudflare DNS has an "orange cloud" (proxy) and "grey cloud" (DNS only). Get this right or nothing works.

- **Proxy ON** when Cloudflare is *serving* the traffic: tunnels, Workers, Pages.
- **Proxy OFF** when another provider handles TLS: Vercel, Netlify, VPS with its own cert. If you proxy through Cloudflare on top of another provider, you usually get an SSL loop.

Rule of thumb: only one TLS terminator per hostname.

---

## 10. Keeping Services Running

Three layers of auto-restart:

1. **Process manager inside the service.** Docker's `restart: always` for containers. systemd's `Restart=always` for Linux services.
2. **OS service manager.** launchd (macOS) or systemd (Linux) with `KeepAlive=true` / `Restart=always`. This respawns the process if it crashes or the machine reboots.
3. **The machine itself.** If your backend runs on your laptop, enable "start Docker/app on login" in the OS settings. Otherwise you reboot and nothing comes back up.

Always verify layer 3 last — it's the one people forget.

---

## 11. Automation Pipelines

Anything you do twice, automate. Generic pattern:

```
[Trigger] → [Transform] → [Commit/Deploy]
```

Examples:
- **iOS Shortcut → GitHub Action → Vercel deploy.** Shortcut hits GitHub's `workflow_dispatch` API with inputs. Action runs a script. Script commits, pushes, and Vercel rebuilds.
- **Voice memo → transcribe → format with AI → save.** Each step is a small function the next one calls.

Tools that compose well:
- **GitHub Actions** — free CI with a simple `workflow_dispatch` trigger you can invoke from any HTTP client.
- **iOS Shortcuts** — surprisingly capable HTTP client + system integration on a phone.
- **A small Express endpoint** — for anything Actions is too slow for.

Design pipelines so each step has a clear input/output contract. You can swap implementations later.

---

## 12. Debugging Methodology

When something breaks, **test each layer from the inside out**:

1. Does the process run locally? (`curl http://localhost:PORT`)
2. Does the tunnel/proxy forward? (`curl https://your-subdomain/`)
3. Does DNS resolve correctly? (`dig your-domain`)
4. Does the frontend call the right URL? (browser Network tab)
5. Does the response get rendered? (console, React DevTools)

Fix the lowest failing layer first. Nine times out of ten, the problem is layer 1 or 2, not the fancy frontend code.

Keep a failure-mode cheat sheet (symptom → cause → fix). Every bug you hit is a bug you'll hit again.

---

## 13. Security Thinking

Not "is it secure" — ask "what am I protecting, from whom?"

Minimal posture for a personal site with a self-hosted API:
- **HTTPS end-to-end.** Free with Cloudflare / Vercel / Let's Encrypt.
- **CORS allowlist** on the backend. Reject random origins.
- **No secrets in git.** Env vars and tokens go in platform settings, not `.env` files you commit.
- **No inbound ports open.** Tunnels instead of port forwards.

Accepted risks (explicitly documented, not ignored):
- Unauthenticated endpoints → someone can spam them. Fix later with rate limiting.
- Your subscription is tied to a process → if compromised, rotate the auth.

Write your accepted risks down. If a risk becomes real, you already know the fix.

---

## 14. Cost Thinking

For a personal stack in 2026:

| Item | Cost |
|------|------|
| Static hosting (Vercel/Netlify Hobby) | $0 |
| DNS (Cloudflare) | $0 |
| Tunnel (Cloudflare) | $0 |
| CI/CD (GitHub Actions free tier) | $0 |
| Domain | ~$12/year |
| AI subscription | $20–$100/month |
| Machine to host the backend | already own one |

Total: **~$20–$100/month**, almost all optional. The domain is the only unavoidable cost.

If you don't need AI, the whole thing is $1/month.

---

## 15. When to Scale Out

Your laptop is not a server. Graduate when:

- **Reliability matters.** You can't be home to reboot when it crashes.
- **Latency matters.** Users on other continents wait on your home upload speed.
- **You need uptime.** 99% (three days/year down) is hard from a laptop. 99.9% requires redundancy.

Upgrade path, cheapest first:
1. **Always-on Mac Mini / mini-PC** at home. ~$300 one-time.
2. **$5/mo VPS** (DigitalOcean, Hetzner). Same Docker setup, public IP. No tunnel needed.
3. **Managed container service** (Fly.io, Railway, Render). Auto-scale + zero ops.
4. **Serverless**. Usually last, because cold starts hurt streaming endpoints.

Don't skip ahead. Most side projects never outgrow step 1.

---

## 16. Meta-Principles

A few beliefs that shape every decision above:

- **Write it down.** The playbook is part of the product. You will forget.
- **Small and swappable beats big and integrated.** Every layer is replaceable in an afternoon.
- **Free until there's a reason.** Scale when you have users, not before.
- **Own your data.** Markdown files in git is the most portable format that exists.
- **Automate when it hurts, not before.** Build manual twice, automate third time.

---

## See Also

- `CHAT-API-PLAYBOOK.md` — specific deep-dive for this site's chat system
- `PLAYBOOK.md` — operational runbook for day-to-day ops
- `ARCHITECTURE.md` — design tokens and frontend architecture
- `ROADMAP-private-voice-blog.md` — next build: authed private section + voice-to-blog pipeline
