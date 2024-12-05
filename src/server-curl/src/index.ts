#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest
} from "@modelcontextprotocol/sdk/types.js";
import fetch from "node-fetch";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Define schema for curl request options
const CurlOptionsSchema = z.object({
  url: z.string().url().describe("The URL to make the request to"),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).default('GET')
    .describe("HTTP method to use"),
  headers: z.record(z.string()).optional()
    .describe("HTTP headers to include in the request"),
  body: z.string().optional()
    .describe("Request body (for POST, PUT, PATCH requests)"),
  timeout: z.number().min(0).max(300000).optional().default(30000)
    .describe("Request timeout in milliseconds (max 300000ms/5min)")
});

const tools = {
  curl: {
    description: "Make an HTTP request to any URL with customizable method, headers, and body.",
    inputSchema: zodToJsonSchema(CurlOptionsSchema)
  }
};

const server = new Server({
  name: "@mcp-get-community/server-curl",
  version: "0.1.0",
  author: "MCP Community"
}, {
  capabilities: {
    tools
  }
});

async function makeCurlRequest(options: z.infer<typeof CurlOptionsSchema>) {
  const { url, method, headers, body, timeout } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        ...headers,
        'User-Agent': '@mcp-get-community/server-curl'
      },
      body: body,
      signal: controller.signal
    });

    const responseBody = await response.text();
    const responseHeaders = Object.fromEntries(response.headers.entries());

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeout}ms`);
      }
      throw new Error(`Curl request failed: ${error.message}`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "curl": {
        const args = CurlOptionsSchema.parse(request.params.arguments);
        const result = await makeCurlRequest(args);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
      throw new Error(`Invalid arguments: ${issues}`);
    }
    throw error;
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }))
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Curl MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
}); 