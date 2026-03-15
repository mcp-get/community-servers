# @mcp-get-community/server-writbase

An MCP stdio proxy for [WritBase](https://github.com/Writbase/writbase) — an MCP-native task management system for AI agent fleets.

WritBase provides a Postgres-backed control plane with multi-agent permissions, full provenance, inter-agent delegation, and 11 MCP tools out of the box. This package bridges MCP stdio transport to WritBase's remote streamable-HTTP endpoint so any MCP client can connect.

## Installation

```bash
npx @michaellatman/mcp-get@latest install @mcp-get-community/server-writbase
```

## Configuration

Two environment variables are required:

| Variable | Description |
|---|---|
| `WRITBASE_URL` | Full MCP endpoint URL (e.g. `https://<ref>.supabase.co/functions/v1/mcp-server`) |
| `WRITBASE_AGENT_KEY` | Agent bearer token (`wb_<key_id>_<secret>`) |

### Usage

```json
{
  "mcpServers": {
    "@mcp-get-community/server-writbase": {
      "runtime": "node",
      "command": "npx",
      "args": [
        "-y",
        "@mcp-get-community/server-writbase"
      ],
      "env": {
        "WRITBASE_URL": "https://<ref>.supabase.co/functions/v1/mcp-server",
        "WRITBASE_AGENT_KEY": "wb_<key_id>_<secret>"
      }
    }
  }
}
```

## Available MCP Tools

WritBase exposes 11 tools through this proxy:

**Worker tools** — `info`, `get_tasks`, `add_task`, `update_task`

**Manager tools** — `manage_agent_keys`, `manage_agent_permissions`, `get_provenance`, `manage_projects`, `manage_departments`, `subscribe`, `discover_agents`

Tool availability depends on the permissions granted to your agent key.

## How It Works

This package is a lightweight stdio-to-HTTP proxy (~120 LOC). It:

1. Connects to your WritBase instance via `StreamableHTTPClientTransport`
2. Exposes a local `StdioServerTransport` for MCP clients
3. Forwards all MCP messages (tool calls, resource/prompt listings) transparently

No business logic runs locally — all task management happens on your WritBase server.

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

## Links

- [WritBase repository](https://github.com/Writbase/writbase) (Apache 2.0)
- [WritBase documentation](https://github.com/Writbase/writbase#readme)

## License

MIT
