#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import {
  CallToolRequestSchema,
  CallToolResultSchema,
  ListToolsRequestSchema,
  ListToolsResultSchema,
} from '@modelcontextprotocol/sdk/types.js';

const DEFAULT_HELIUM_MCP_URL = 'https://heliumtrades.com/mcp';

async function connectUpstream(): Promise<{ client: Client; transport: Transport }> {
  const baseUrl = new URL(process.env.HELIUM_MCP_URL ?? DEFAULT_HELIUM_MCP_URL);
  const clientInfo = { name: 'helium-upstream-client', version: '0.1.0' };

  try {
    const client = new Client(clientInfo, { capabilities: {} });
    const transport = new StreamableHTTPClientTransport(baseUrl);
    await client.connect(transport);
    return { client, transport };
  } catch (firstError) {
    console.error(
      'Helium MCP: streamable HTTP failed, trying SSE transport:',
      firstError instanceof Error ? firstError.message : firstError
    );
    const client = new Client(clientInfo, { capabilities: {} });
    const transport = new SSEClientTransport(baseUrl);
    await client.connect(transport);
    return { client, transport };
  }
}

async function main(): Promise<void> {
  const upstream = await connectUpstream();

  const server = new Server(
    {
      name: '@mcp-get-community/server-helium',
      version: '0.1.0',
      title: 'Helium MCP',
      websiteUrl: 'https://heliumtrades.com',
      description:
        'Bridge to Helium Trades hosted MCP (news, bias, markets, options, memes). Maintained by Helium; packaged for mcp-get.',
    },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return await upstream.client.request({ method: 'tools/list', params: {} }, ListToolsResultSchema);
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    return await upstream.client.request(
      {
        method: 'tools/call',
        params: {
          name: request.params.name,
          arguments: request.params.arguments ?? {},
        },
      },
      CallToolResultSchema
    );
  });

  const stdio = new StdioServerTransport();
  await server.connect(stdio);

  const closeUpstream = async (): Promise<void> => {
    try {
      await upstream.transport.close();
    } catch {
      // ignore shutdown errors
    }
  };

  process.once('SIGINT', () => {
    void closeUpstream().finally(() => process.exit(0));
  });
  process.once('SIGTERM', () => {
    void closeUpstream().finally(() => process.exit(0));
  });
}

main().catch((error: unknown) => {
  console.error('Helium MCP bridge failed to start:', error);
  process.exit(1);
});
