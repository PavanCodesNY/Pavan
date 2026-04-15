import express from "express";
import cors from "cors";
import { query } from "@anthropic-ai/claude-code";
import { SYSTEM_PROMPT } from "./system-prompt.js";

const app = express();
const PORT = process.env.PORT || 3001;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000"];

app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Chat endpoint — streams response from Claude via CLI subscription
app.post("/chat", async (req, res) => {
  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages array required" });
  }

  // Build the prompt from conversation history
  const conversationContext = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  const prompt = `${SYSTEM_PROMPT}\n\nConversation so far:\n${conversationContext}\n\nRespond to the user's latest message.`;

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Transfer-Encoding", "chunked");
  res.setHeader("Cache-Control", "no-cache");

  try {
    // query() returns an AsyncGenerator<SDKMessage>
    const conversation = query({
      prompt,
      options: {
        maxTurns: 1,
      },
    });

    // Iterate the async generator — extract text from assistant messages
    for await (const message of conversation) {
      if (message.type === "assistant") {
        // Assistant messages contain an array of content blocks
        for (const block of message.message.content) {
          if (block.type === "text") {
            res.write(block.text);
          }
        }
      }
    }

    res.end();
  } catch (err) {
    if (err.name === "AbortError") {
      res.end();
      return;
    }
    console.error("Chat error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.end();
    }
  }
});

app.listen(PORT, () => {
  console.log(`Chat API running on port ${PORT}`);
});
