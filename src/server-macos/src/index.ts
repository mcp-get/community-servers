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
import { promisify } from 'util';
import { exec as execCallback } from 'child_process';

const exec = promisify(execCallback);

// Define schemas for macOS tools
const SystemInfoSchema = z.object({
  category: z.enum(['cpu', 'memory', 'disk', 'network', 'all'])
    .describe('Category of system information to retrieve')
});

const NotificationSchema = z.object({
  title: z.string().describe('Title of the notification'),
  message: z.string().describe('Content of the notification'),
  sound: z.boolean().optional().default(true).describe('Whether to play a sound')
});

interface SystemInfo {
  model?: string;
  cores?: number;
  total?: string;
  vmStat?: string;
  diskInfo?: string;
  networkInfo?: string;
}

const tools = {
  systemInfo: {
    description: "Retrieve system information from macOS using various system commands",
    inputSchema: zodToJsonSchema(SystemInfoSchema)
  },
  sendNotification: {
    description: "Send a native macOS notification",
    inputSchema: zodToJsonSchema(NotificationSchema)
  }
};

const server = new Server({
  name: "@mcp-get-community/server-macos",
  version: "0.1.0",
  author: "Michael Latman <https://michaellatman.com>"
}, {
  capabilities: {
    tools
  }
});

async function getSystemInfo(category: string): Promise<SystemInfo | { cpu: SystemInfo; memory: SystemInfo; disk: SystemInfo; network: SystemInfo }> {
  switch (category) {
    case 'cpu': {
      const { stdout } = await exec('sysctl -n machdep.cpu.brand_string && sysctl -n hw.ncpu');
      const [model, cores] = stdout.split('\n');
      return { model, cores: parseInt(cores) };
    }
    case 'memory': {
      const { stdout } = await exec('sysctl -n hw.memsize && vm_stat');
      const [totalBytes, vmStat] = stdout.split('\n', 2);
      const total = parseInt(totalBytes) / (1024 * 1024 * 1024);
      return { total: `${total.toFixed(2)} GB`, vmStat };
    }
    case 'disk': {
      const { stdout } = await exec('df -h /');
      return { diskInfo: stdout };
    }
    case 'network': {
      const { stdout } = await exec('ifconfig en0');
      return { networkInfo: stdout };
    }
    case 'all': {
      const [cpu, memory, disk, network] = await Promise.all([
        getSystemInfo('cpu') as Promise<SystemInfo>,
        getSystemInfo('memory') as Promise<SystemInfo>,
        getSystemInfo('disk') as Promise<SystemInfo>,
        getSystemInfo('network') as Promise<SystemInfo>
      ]);
      return { cpu, memory, disk, network };
    }
    default:
      throw new Error(`Unknown category: ${category}`);
  }
}

async function sendNotification(options: z.infer<typeof NotificationSchema>) {
  const { title, message, sound } = options;
  const soundFlag = sound ? 'default' : 'none';
  const script = `display notification "${message}" with title "${title}" sound name "${soundFlag}"`;
  await exec(`osascript -e '${script}'`);
  return { success: true, message: 'Notification sent' };
}

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "systemInfo": {
        const args = SystemInfoSchema.parse(request.params.arguments);
        const result = await getSystemInfo(args.category);
        return {
          content: [{
            type: "text",
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      case "sendNotification": {
        const args = NotificationSchema.parse(request.params.arguments);
        const result = await sendNotification(args);
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
  console.error("macOS MCP Server running on stdio");
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
}); 