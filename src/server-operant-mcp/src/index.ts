#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Schema for running operant-mcp tools
const OperantToolSchema = z.object({
  tool: z.string().describe("The operant-mcp tool name to execute (e.g., recon_quick, sqli_login_bypass, xss_reflected_test)"),
  args: z.record(z.string()).optional().describe("Arguments to pass to the tool as key-value pairs")
});

const tools = {
  operant_run: {
    description: "Run an operant-mcp security testing tool. Provides 51 tools for penetration testing, network forensics, memory analysis, and vulnerability assessment including SQL injection, XSS, SSRF, CSRF, path traversal, PCAP analysis, and more.",
    inputSchema: zodToJsonSchema(OperantToolSchema)
  }
};

const server = new Server({
  name: "@mcp-get-community/server-operant-mcp",
  version: "0.1.0",
  author: "MCP Community"
}, {
  capabilities: {
    tools
  }
});

async function runOperantTool(options: z.infer<typeof OperantToolSchema>) {
  const { tool, args } = options;
  const cmdArgs = ['operant-mcp', '--tool', tool];

  if (args) {
    for (const [key, value] of Object.entries(args)) {
      cmdArgs.push(`--${key}`, value);
    }
  }

  try {
    const { stdout, stderr } = await execFileAsync('npx', cmdArgs, {
      timeout: 120000
    });
    return {
      tool,
      output: stdout,
      errors: stderr || undefined
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`operant-mcp tool '${tool}' failed: ${error.message}`);
    }
    throw error;
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "operant_run": {
        const args = OperantToolSchema.parse(request.params.arguments);
        const result = await runOperantTool(args);
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
  console.error("Operant MCP Security Server running on stdio");
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
