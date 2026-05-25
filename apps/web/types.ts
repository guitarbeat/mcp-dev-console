// Re-export protocol types from the mcp-client package
export type {
  ServerConfig,
  McpTool,
  SchemaProperty,
  ConnectionStatus,
} from "../../packages/mcp-client/src/types";

// ── UI-specific types ──

export interface LogEntry {
  id: number;
  timestamp: Date;
  method: string;
  direction: "sent" | "received";
  body: string;
  status: "success" | "error";
  durationMs?: number;
}

export interface HistoryEntry {
  id: number;
  timestamp: Date;
  toolName: string;
  args: string;
  durationMs: number;
  status: "success" | "error";
  response: string;
  responseSize: number;
}

export interface PresetCall {
  id: string;
  label: string;
  description: string;
  icon: string;
  tool: string;
  args: Record<string, unknown>;
  category: string;
}

export type ResponseTab = "formatted" | "raw" | "curl";
