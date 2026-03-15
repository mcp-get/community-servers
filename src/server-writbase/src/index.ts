#!/usr/bin/env node

/**
 * WritBase MCP Stdio Proxy
 *
 * Bridges MCP stdio transport to a remote WritBase streamable-HTTP endpoint.
 * All MCP messages are forwarded transparently — no business logic lives here.
 *
 * Required env vars:
 *   WRITBASE_URL       – Full MCP endpoint URL (e.g. https://<ref>.supabase.co/functions/v1/mcp-server)
 *   WRITBASE_AGENT_KEY – Bearer token (wb_<key_id>_<secret>)
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ListPromptsRequestSchema,
  type CallToolRequest,
  type ListToolsRequest,
  type ListResourcesRequest,
  type ListPromptsRequest,
} from "@modelcontextprotocol/sdk/types.js";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const WRITBASE_URL = process.env.WRITBASE_URL;
const WRITBASE_AGENT_KEY = process.env.WRITBASE_AGENT_KEY;

if (!WRITBASE_URL) {
  console.error("Error: WRITBASE_URL environment variable is required.");
  console.error("Set it to your WritBase MCP endpoint URL.");
  process.exit(1);
}

if (!WRITBASE_AGENT_KEY) {
  console.error("Error: WRITBASE_AGENT_KEY environment variable is required.");
  console.error("Set it to your WritBase agent key (wb_<key_id>_<secret>).");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Remote client (stdio proxy → WritBase HTTP)
// ---------------------------------------------------------------------------

const remoteTransport = new StreamableHTTPClientTransport(
  new URL(WRITBASE_URL),
  {
    requestInit: {
      headers: {
        Authorization: `Bearer ${WRITBASE_AGENT_KEY}`,
      },
    },
  }
);

const remoteClient = new Client(
  { name: "writbase-stdio-proxy", version: "0.1.0" },
  { capabilities: {} }
);

// ---------------------------------------------------------------------------
// Local stdio server
// ---------------------------------------------------------------------------

const localServer = new Server(
  {
    name: "@mcp-get-community/server-writbase",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ---------------------------------------------------------------------------
// Proxy handlers — forward every request to the remote server
// ---------------------------------------------------------------------------

localServer.setRequestHandler(ListToolsRequestSchema, async (_req: ListToolsRequest) => {
  const result = await remoteClient.listTools();
  return { tools: result.tools };
});

localServer.setRequestHandler(CallToolRequestSchema, async (req: CallToolRequest) => {
  const result = await remoteClient.callTool({
    name: req.params.name,
    arguments: req.params.arguments,
  });
  return {
    content: result.content as Array<{ type: string; text: string }>,
    isError: result.isError,
  };
});

// Forward resource/prompt listing if the remote supports them (graceful no-op)
localServer.setRequestHandler(ListResourcesRequestSchema, async (_req: ListResourcesRequest) => {
  try {
    const result = await remoteClient.listResources();
    return { resources: result.resources };
  } catch {
    return { resources: [] };
  }
});

localServer.setRequestHandler(ListPromptsRequestSchema, async (_req: ListPromptsRequest) => {
  try {
    const result = await remoteClient.listPrompts();
    return { prompts: result.prompts };
  } catch {
    return { prompts: [] };
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  // Connect to remote WritBase server first
  await remoteClient.connect(remoteTransport);
  console.error("Connected to WritBase at", WRITBASE_URL);

  // Then expose local stdio transport
  const stdioTransport = new StdioServerTransport();
  await localServer.connect(stdioTransport);
  console.error("WritBase MCP stdio proxy running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
