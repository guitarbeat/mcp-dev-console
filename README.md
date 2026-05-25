# MCP Dev Console

> A Postman-style tool explorer for [Model Context Protocol](https://modelcontextprotocol.io/) servers.

Browse, test, and debug any MCP server's tools through an interactive UI. Connect to any MCP-compatible server, explore its tool catalog, craft requests with a JSON editor, and inspect responses — all in real time.

---

## Monorepo Structure

```
├── apps/
│   └── web/                 # React UI (Tasklet instant app)
│       ├── app.tsx          # Root component — layout, connection, state
│       ├── components/      # UI panels
│       │   ├── ToolSidebar  # Tool browser with search + categories
│       │   ├── RequestPanel # Schema viewer, JSON editor, executor
│       │   └── HistoryBar   # Request log with replay
│       ├── utils/
│       │   └── presets.ts   # Quick-launch tool configurations
│       ├── types.ts         # UI-specific types
│       └── styles.css       # DaisyUI + custom styles
│
├── packages/
│   └── mcp-client/          # Protocol client library
│       └── src/
│           ├── client.ts    # HTTP+SSE transport, session mgmt
│           ├── types.ts     # MCP protocol types
│           └── index.ts     # Public API barrel
│
├── .github/
│   ├── workflows/ci.yml     # Type checking + formatting
│   ├── ISSUE_TEMPLATE/      # Bug report + feature request forms
│   └── pull_request_template.md
│
├── CONTRIBUTING.md           # Dev setup + contribution guide
└── LICENSE                   # MIT
```

## Packages

### `@mcp-dev-console/web`

The interactive UI built with React 19 + DaisyUI. Runs as a [Tasklet](https://tasklet.ai) instant app.

**Features:**
- 🔍 **Tool Browser** — Searchable sidebar grouped by category
- ✏️ **Request Builder** — Auto-generated form from tool JSON Schema, with raw JSON editor
- ▶️ **One-Click Execute** — Call any tool and see formatted + raw responses
- 📜 **History** — Timestamped log of every request with one-click replay
- ⚡ **Presets** — Configurable quick-launch shortcuts for common operations
- ⚙️ **Connection Modal** — Server URL + bearer token configuration

### `@mcp-dev-console/mcp-client`

Lightweight MCP client with:
- JSON-RPC 2.0 request/response handling
- Automatic `Mcp-Session-Id` tracking
- SSE response stream parsing
- Cold-start resilience (Render, Railway, etc.)

## Quick Start

### As a Tasklet Instant App

1. Clone this repo
2. Copy `apps/web/` to your Tasklet apps folder
3. Open in Tasklet — the app auto-connects when you provide a server URL and token

### Development

```bash
git clone https://github.com/guitarbeat/mcp-dev-console.git
cd mcp-dev-console
cp .env.example .env   # Configure your MCP server URL + token
```

### Type Check

```bash
cd packages/mcp-client && npx tsc --noEmit
cd apps/web && npx tsc --noEmit
```

## MCP Protocol Flow

```
Client                          Server
  │                               │
  ├── initialize ────────────────►│
  │◄──────────── serverInfo ──────┤  ← Mcp-Session-Id captured
  │                               │
  ├── notifications/initialized ─►│
  │                               │
  ├── tools/list ────────────────►│
  │◄──────────── tool catalog ────┤  ← Populates sidebar
  │                               │
  ├── tools/call { name, args } ─►│
  │◄──────────── result ──────────┤  ← Response panel
```

## Adding Presets

Edit `apps/web/utils/presets.ts`:

```ts
export const PRESETS: PresetCall[] = [
  {
    id: "my-preset",
    label: "My Custom Query",
    description: "Fetch something useful",
    icon: "🔎",
    tool: "my-tool-name",
    args: { param: "value" },
    category: "Custom",
  },
];
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19 |
| Styling | DaisyUI 4 + Tailwind |
| Icons | Lucide React |
| Transport | HTTP + SSE via curl |
| Protocol | MCP (JSON-RPC 2.0) |
| CI | GitHub Actions |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for dev setup, code style, and PR guidelines.

## License

[MIT](LICENSE)
