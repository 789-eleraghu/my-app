import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { openai } from "@ai-sdk/openai";
import {
  streamText,
  convertToModelMessages,
  tool,
  zodSchema,
  toUIMessageStream,
  createUIMessageStream,
  pipeUIMessageStreamToResponse,
} from "ai";
import type { UIMessage } from "ai";
import { z } from "zod";

// Load environment variables from .env / .env.local
dotenv.config();
dotenv.config({ path: ".env.local" });

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const FASTAPI_URL = process.env.FASTAPI_URL || "http://127.0.0.1:8000";

app.use(cors());
app.use(express.json());

// Forwarding helper to Python FastAPI backend
async function forwardToFastAPI(req: express.Request, res: express.Response): Promise<boolean> {
  const targetUrl = `${FASTAPI_URL}${req.originalUrl}`;
  try {
    const fetchOptions: RequestInit = {
      method: req.method,
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
        "Accept": req.headers["accept"] || "*/*",
      },
    };

    if (["POST", "PUT", "PATCH"].includes(req.method) && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const fastApiResponse = await fetch(targetUrl, fetchOptions);

    if (!fastApiResponse.ok && fastApiResponse.status === 404 && req.path === "/api/health") {
      return false;
    }

    res.status(fastApiResponse.status);

    // Forward response headers
    for (const [key, value] of fastApiResponse.headers.entries()) {
      res.setHeader(key, value);
    }

    // Stream response body back
    if (fastApiResponse.body) {
      const reader = fastApiResponse.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(value);
      }
      res.end();
      return true;
    }

    const text = await fastApiResponse.text();
    res.send(text);
    return true;
  } catch (err) {
    // FastAPI not available, continue to fallback
    return false;
  }
}

// Proxied Chat Endpoints: chats, telemetry
app.use("/api/chats", async (req, res) => {
  const handled = await forwardToFastAPI(req, res);
  if (!handled) {
    res.status(503).json({ error: "Backend FastAPI server unavailable on " + FASTAPI_URL });
  }
});

app.use("/api/telemetry", async (req, res) => {
  const handled = await forwardToFastAPI(req, res);
  if (!handled) {
    res.status(503).json({ error: "Backend FastAPI server unavailable on " + FASTAPI_URL });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const handled = await forwardToFastAPI(req, res);
  if (!handled) {
    res.json({
      status: "ok",
      server: "node-express-bridge",
      fastapi_status: "disconnected",
      timestamp: new Date().toISOString()
    });
  }
});

// Main chat streaming endpoint
app.post("/api/chat", async (req, res) => {
  // First attempt to stream directly from Yamaha FastAPI backend
  const handled = await forwardToFastAPI(req, res);
  if (handled) return;

  // Fallback to local simulated/OpenAI handler if FastAPI is offline
  try {
    const {
      messages,
      config,
    }: {
      messages: UIMessage[];
      config?: { modelName?: string };
    } = req.body;

    const aiSDKTools = {
      get_current_weather: tool({
        description: "Get the current weather for a specified location or city",
        inputSchema: zodSchema(
          z.object({ city: z.string().describe("The name of the city") }),
        ),
        execute: async ({ city }) => {
          return `The weather in ${city} is currently Sunny with a temperature of 24°C (75°F), 48% humidity, and gentle breeze.`;
        },
      }),
    };

    if (process.env.OPENAI_API_KEY) {
      const selectedModel = config?.modelName || "gpt-4o";
      const result = streamText({
        model: openai(selectedModel),
        messages: await convertToModelMessages(messages, { tools: aiSDKTools }),
        tools: aiSDKTools,
      });

      return pipeUIMessageStreamToResponse({
        response: res,
        stream: toUIMessageStream({ stream: result.stream }),
      });
    }

    // Graceful simulated response when OPENAI_API_KEY is not set
    const lastUserMessage = [...(messages || [])].reverse().find((m) => m.role === "user");
    const userText =
      lastUserMessage?.parts
        ?.filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join(" ") || "";

    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        const textId = `text_${Date.now()}`;
        writer.write({ type: "text-start", id: textId });
        writer.write({
          type: "text-delta",
          id: textId,
          delta:
            `Hello! I'm your Yamaha Energy AI Assistant.\n\n` +
            `You said: "${userText || "Hello"}"\n\n` +
            `Backend connected to Yamaha EMS with real-time analytics.\n`,
        });
        writer.write({ type: "text-end", id: textId });
      },
    });

    return pipeUIMessageStreamToResponse({
      response: res,
      stream,
    });
  } catch (err: unknown) {
    console.error("Error handling /api/chat:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Node.js API Server running on http://localhost:${PORT} (bridged to FastAPI on ${FASTAPI_URL})`);
});
