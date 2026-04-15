# Chat API

Minimal Express server that powers the portfolio chat widget using your Claude Code subscription. No API key needed — it uses the Claude CLI auth. Runs as a Docker container on your local machine 24/7, exposed to the internet via Cloudflare Tunnel (free).

## Architecture

```
[Vercel Frontend] → fetch POST /chat → [Cloudflare Tunnel] → [Docker on your Mac] → Claude CLI
```

## Setup (one-time)

### 1. Build and run the Docker container

```bash
cd chat-api
docker build -t chat-api .
docker run -d \
  --name chat-api \
  --restart always \
  -p 3001:3001 \
  -v claude-auth:/root/.claude \
  -e ALLOWED_ORIGINS="https://pavankumarny.me,https://www.pavankumarny.me" \
  chat-api
```

`--restart always` ensures the container restarts on crash or machine reboot.

### 2. Authenticate Claude CLI (first time only)

```bash
docker exec -it chat-api claude auth login
```

Follow the browser link to complete OAuth. Tokens are stored in the `claude-auth` Docker volume and persist across container restarts.

### 3. Expose to the internet with Cloudflare Tunnel (free)

Install cloudflared:

```bash
brew install cloudflare/cloudflare/cloudflared
```

Login to Cloudflare (one-time):

```bash
cloudflared tunnel login
```

Create a named tunnel:

```bash
cloudflared tunnel create chat-api
```

Create the config file at `~/.cloudflared/config.yml`:

```yaml
tunnel: chat-api
credentials-file: /Users/you/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: chat.pavankumarny.me
    service: http://localhost:3001
  - service: http_status:404
```

Add the DNS record:

```bash
cloudflared tunnel route dns chat-api chat.pavankumarny.me
```

Run the tunnel (use `--restart always` in Docker or a launchd plist to keep it alive):

```bash
cloudflared tunnel run chat-api
```

Or run cloudflared as a service so it survives reboots:

```bash
sudo cloudflared service install
```

### 4. Point the frontend to your tunnel

In Vercel dashboard, set the environment variable:

```
NEXT_PUBLIC_CHAT_API_URL=https://chat.pavankumarny.me/chat
```

Or for local dev, in `pavan/.env.local`:

```
NEXT_PUBLIC_CHAT_API_URL=http://localhost:3001/chat
```

## Quick alternative: ngrok (no custom domain needed)

If you don't have a domain or don't want to set up Cloudflare:

```bash
brew install ngrok
ngrok http 3001
```

Copy the `https://xxxx.ngrok-free.app` URL and set it as `NEXT_PUBLIC_CHAT_API_URL` in Vercel. Note: the ngrok URL changes each restart on the free tier, so Cloudflare Tunnel is better for permanence.

## Managing the container

```bash
docker logs chat-api          # View logs
docker restart chat-api       # Restart
docker stop chat-api          # Stop
docker start chat-api         # Start after stop
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `ALLOWED_ORIGINS` | `http://localhost:3000` | Comma-separated CORS origins for your Vercel domain |
