FROM node:22-slim

WORKDIR /app

# Install Claude CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Copy package files and install deps
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy server code
COPY . .

EXPOSE 3001

ENV PORT=3001

CMD ["node", "server.js"]
