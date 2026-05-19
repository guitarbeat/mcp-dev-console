# MCP Dev Console

A Postman-style developer console for testing and debugging [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers. Built as a [Tasklet](https://tasklet.ai) instant app.

![MCP Dev Console](https://img.shields.io/badge/MCP-Dev%20Console-blue) ![TypeScript](https://img.shields.io/badge/TypeScript-React-3178c6) ![License](https://img.shields.io/badge/License-MIT-green)

## Features

- **Tool Browser** — Browse all MCP tools with search and category grouping
- **Request Builder** — JSON editor with auto-populated schemas from tool definitions
- **Response Viewer** — Syntax-highlighted responses with timing metrics
- **Request History** — Track past requests with status badges and response times
- **Connection Settings** — Configurable server URL and bearer token auth
- **Cold Start Detection** — Automatic retry on 503 responses (common with sleeping servers)
- **Preset Categories** — Tools organized by domain (accounts, transactions, budgets, etc.)

## Architecture

```
app.tsx                    # Main app — connection state, layout, tool selection
types.ts                   # Shared TypeScript types
styles.css                 # Custom styles (extends DaisyUI)
tasklet.config.json        # Tasklet app manifest

components/
├── ToolSidebar.tsx        # Left panel — search, category filters, tool list
├── RequestPanel.tsx       # Center panel — schema viewer, JSON editor, response
└── HistoryBar.tsx         # Bottom bar — request history with status/timing

utils/
├── mcp.ts                 # MCP client — session management, JSON-RPC, tool calls
└── presets.ts             # Tool category definitions and preset configurations
```

## How It Works

The console communicates with MCP servers using the [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http). It:

1. **Initializes** a session via `initialize` JSON-RPC call
2. **Extracts** the `Mcp-Session-Id` from response headers for session continuity
3. **Fetches** the tool list via `tools/list`
4. **Executes** tool calls via `tools/call` with user-provided arguments

All HTTP communication goes through the Tasklet sandbox (`run_command` + `curl`), which handles auth headers and session management.

## Setup

### As a Tasklet Instant App

1. Copy the files to `/agent/home/apps/mcp-dev-console/`
2. Open in Tasklet's preview panel
3. The app auto-connects using the default server URL and token in `app.tsx`

### Configuration

Edit the default connection settings in `app.tsx`:

```typescript
const [serverUrl, setServerUrl] = useState("https://your-mcp-server.com/mcp");
const [bearerToken, setBearerToken] = useState("your-token-here");
```

Or use the ⚙️ Settings modal in the app UI to change them at runtime.

## Requirements

- [Tasklet](https://tasklet.ai) environment (provides React, DaisyUI, and sandbox execution)
- An MCP server with Streamable HTTP transport

## Tech Stack

- **React 18** + **TypeScript** — UI framework
- **DaisyUI** + **Tailwind CSS** — Styling
- **JSON-RPC 2.0** — MCP protocol communication
- **curl** — HTTP transport (via Tasklet sandbox)

## License

MIT
