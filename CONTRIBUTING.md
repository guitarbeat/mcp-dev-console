# Contributing to MCP Dev Console

Thanks for your interest in contributing! Here's how to get started.

## Development Setup

This is a [Tasklet](https://tasklet.ai) instant app. To develop locally:

1. Clone the repository
2. Copy `.env.example` to `.env` and configure your MCP server
3. Open in a Tasklet workspace — the app runs in the preview panel

## Project Structure

```
app.tsx                    # Main app component
types.ts                   # Shared TypeScript types
styles.css                 # Custom styles (DaisyUI extensions)
components/
├── ToolSidebar.tsx        # Tool browser with search & categories
├── RequestPanel.tsx       # Request builder & response viewer
└── HistoryBar.tsx         # Request history timeline
utils/
├── mcp.ts                 # MCP client (session, JSON-RPC, transport)
└── presets.ts             # Tool category definitions
```

## Guidelines

### Code Style
- TypeScript strict mode
- Functional React components with hooks
- DaisyUI + Tailwind for styling (no raw CSS unless necessary)
- Keep components focused — one responsibility per file

### Commits
- Use [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` — new feature
  - `fix:` — bug fix
  - `refactor:` — code restructuring
  - `docs:` — documentation only
  - `style:` — formatting, no logic change

### Pull Requests
1. Fork the repo and create a feature branch
2. Keep changes focused — one PR per feature/fix
3. Update the README if adding new features
4. Test with at least one MCP server before submitting

## Adding Tool Presets

To add presets for a new MCP server, edit `utils/presets.ts`:

```typescript
export const MY_SERVER_PRESETS: Record<string, ToolPreset> = {
  'my-tool': {
    description: 'What this tool does',
    category: 'My Category',
    args: { param1: 'default-value' }
  }
};
```

## Reporting Bugs

Use [GitHub Issues](../../issues) with the **Bug Report** template. Include:
- Steps to reproduce
- Expected vs actual behavior
- MCP server type (if relevant)
- Screenshots if applicable

## Feature Requests

Use [GitHub Issues](../../issues) with the **Feature Request** template. Describe:
- The problem you're trying to solve
- Your proposed solution
- Alternatives you've considered
