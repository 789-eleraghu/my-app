# AI Chat Assistant (Vite + React + Node.js Backend)

A modern full-featured AI chat assistant interface built with **React 19**, **TypeScript**, **Vite**, **assistant-ui**, **Tailwind CSS v4**, and a dedicated **Node.js (Express)** backend.

## Architecture

- **Frontend**: Vite + React 19 + TypeScript (running on port `5173`)
  - Features: Multi-thread sidebar, Model Selector, Generative UI tools, Syntax highlighting, Split Workspace, Floating Bubble.
  - Development proxy: All `/api` requests are proxied by Vite to the backend on port `4000`.
- **Backend**: Node.js + Express + TypeScript (`server/index.ts`, running on port `4000`)
  - Handles `/api/chat` streaming responses via Vercel AI SDK (`streamText` + `pipeUIMessageStreamToResponse`).
  - Securely keeps `OPENAI_API_KEY` on the server side.
  - Built-in fallback simulation with interactive weather tool if `OPENAI_API_KEY` is not set.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. (Optional) Set up your OpenAI API key

Create a `.env` or `.env.local` file in the project root:

```env
OPENAI_API_KEY=your_openai_api_key_here
```

*(If no API key is provided, the backend automatically runs in graceful simulated mode with tool calling demonstrations.)*

### 3. Run the development environment

```bash
npm run dev
```

This starts both the **Vite React frontend** (`http://localhost:5173`) and the **Node.js backend** (`http://localhost:4000`) simultaneously using `concurrently`.

### Individual Scripts

- **`npm run dev:client`**: Run only the Vite frontend dev server.
- **`npm run dev:server`**: Run only the Node.js backend server with hot-reload (`tsx watch`).
- **`npm run build`**: Build the production bundle for the frontend (`dist/`).
- **`npm run preview`**: Preview the production build locally.
- **`npm run start`**: Start the backend server in production mode.
