# MCP Dev Console

A Postman-style developer console for testing and debugging [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers. Built as a [Tasklet](https://tasklet.ai) instant app.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-React_18-3178c6.svg)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-2025--03--26-blue.svg)](https://modelcontextprotocol.io/)

## Features

| Feature | Description |
|---------|-------------|
| 🔍 **Tool Browser** | Search and browse all MCP tools with category grouping |
| 📝 **Request Builder** | JSON editor with auto-populated schemas from tool definitions |
| 📊 **Response Viewer** | Syntax-highlighted JSON responses with error detection |
| ⏱️ **Timing Metrics** | Response time tracking for every request |
| 📜 **Request History** | Scrollable history bar with status badges |
| ⚙️ **Connection Settings** | Configurable server URL and bearer token via modal |
| 🔄 **Cold Start Detection** | Automatic retry on 503 responses (common with sleeping servers) |
| 📁 **Preset Categories** | Tools organized by domain — extensible for any MCP server |

## Screenshots

> 📸 Coming soon — screenshots of the three-panel layout, tool browser, and response viewer.

<!-- Uncomment when screenshots are added:
![Tool Browser](docs/screenshots/tool-browser.png)
![Request Builder](docs/screenshots/request-builder.png)
-->

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/guitarbeat/mcp-dev-console.git
```

### 2. Configure your MCP server

```bash
cp .env.example .env
# Edit .env with your MCP server URL and token
```

### 3. Open in Tasklet

Copy the files to your Tasklet workspace:

```
/agent/home/apps/mcp-dev-console/
```

The app will appear in the preview panel. It auto-connects on launch using the settings modal (⚙️).

### 4. Start testing

1. **Browse** tools in the left sidebar
2. **Select** a tool to see its schema
3. **Edit** the JSON arguments
4. **Execute** and inspect the response

## Architecture

```
mcp-dev-console/
├── app.tsx                     # Main app — connection state, layout, tool routing
├── types.ts                    # Shared TypeScript interfaces
├── styles.css                  # Custom styles (extends DaisyUI)
├── components/
│   ├── ToolSidebar.tsx         # Left panel — search, categories, tool list
│   ├── RequestPanel.tsx        # Center panel — schema, editor, response viewer
│   └── HistoryBar.tsx          # Bottom bar — request history timeline
├── utils/
│   ├── mcp.ts                  # MCP client — session mgmt, JSON-RPC, transport
│   └── presets.ts              # Tool category presets (extensible)
├── .env.example                # Configuration template
├── .github/
│   ├── ISSUE_TEMPLATE/         # Bug report & feature request templates
│   └── pull_request_template.md
├── CONTRIBUTING.md             # Contribution guidelines
└── LICENSE                     # MIT License
```

## How It Works

The console communicates with MCP servers using the [Streamable HTTP transport](https://modelcontextprotocol.io/specification/2025-03-26/basic/transports#streamable-http):

```
┌─────────────┐    initialize     ┌─────────────┐
│  Dev Console │ ──────────────►  │  MCP Server  │
│              │ ◄──────────────  │              │
│              │  session-id      │              │
│              │                  │              │
│              │   tools/list     │              │
│              │ ──────────────►  │              │
│              │ ◄──────────────  │              │
│              │   tool schemas   │              │
│              │                  │              │
│              │   tools/call     │              │
│              │ ──────────────►  │              │
│              │ ◄──────────────  │              │
│              │   result/error   │              │
└─────────────┘                  └─────────────┘
```

1. **Initialize** — Handshake via `initialize` JSON-RPC, captures `Mcp-Session-Id` header
2. **Discover** — Fetches full tool catalog via `tools/list`
3. **Execute** — Sends `tools/call` with user-provided arguments
4. **Display** — Renders response with syntax highlighting and error detection

## Customizing Presets

The tool presets in `utils/presets.ts` organize tools into categories. To add presets for your own MCP server:

```typescript
// utils/presets.ts
export const TOOL_PRESETS: Record<string, ToolPreset> = {
  'my-tool': {
    description: 'What this tool does',
    category: '🔧 My Category',
    args: { param: 'default-value' }
  },
  // ... more tools
};
```

Tools not matching any preset are automatically grouped under "Other".

## Tech Stack

- **React 18** + **TypeScript** — UI framework
- **DaisyUI** + **Tailwind CSS** — Component styling
- **JSON-RPC 2.0** — MCP protocol wire format
- **curl** — HTTP transport via Tasklet sandbox

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, code style, and PR guidelines.

## License

[MIT](LICENSE) © Aaron L Woods
