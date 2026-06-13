#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolRequest,
} from "@modelcontextprotocol/sdk/types.js";
import fetch, { type Response } from "node-fetch";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

const API_KEY_ENV = "XQUIK_API_KEY";
const API_BASE_URL_ENV = "XQUIK_API_BASE_URL";
const DEFAULT_API_BASE_URL = "https://xquik.com";
const SERVER_NAME = "@mcp-get-community/server-xquik";
const SERVER_VERSION = "0.1.0";

const QueryValueSchema = z.union([z.string(), z.number(), z.boolean()]);
const QuerySchema = z.record(z.union([QueryValueSchema, z.array(QueryValueSchema)]));
const JsonBodySchema = z.union([
  z.record(z.unknown()),
  z.array(z.unknown()),
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);

const XquikRequestSchema = z.object({
  path: z
    .string()
    .startsWith("/api/v1/x/")
    .describe("Xquik API path under /api/v1/x/"),
  method: z
    .enum(["GET", "POST", "PATCH", "DELETE"])
    .default("GET")
    .describe("HTTP method to use"),
  query: QuerySchema.optional().describe("Query string parameters"),
  body: JsonBodySchema.optional().describe("JSON request body"),
  timeoutMs: z
    .number()
    .int()
    .min(1000)
    .max(60000)
    .default(30000)
    .describe("Request timeout in milliseconds"),
});

const SearchXPostsSchema = z.object({
  q: z.string().min(1).describe("X search query"),
  queryType: z.enum(["Latest", "Top"]).optional().describe("Sort order"),
  cursor: z.string().optional().describe("Pagination cursor"),
  limit: z.number().int().min(1).max(200).optional().describe("Result limit"),
  sinceTime: z.string().optional().describe("Lower time bound"),
  untilTime: z.string().optional().describe("Upper time bound"),
  timeoutMs: z
    .number()
    .int()
    .min(1000)
    .max(60000)
    .default(30000)
    .describe("Request timeout in milliseconds"),
});

const SearchXUsersSchema = z.object({
  q: z.string().min(1).describe("Name or username query"),
  cursor: z.string().optional().describe("Pagination cursor"),
  timeoutMs: z
    .number()
    .int()
    .min(1000)
    .max(60000)
    .default(30000)
    .describe("Request timeout in milliseconds"),
});

type XquikRequest = z.infer<typeof XquikRequestSchema>;
type SearchXPosts = z.infer<typeof SearchXPostsSchema>;
type SearchXUsers = z.infer<typeof SearchXUsersSchema>;
type Query = z.infer<typeof QuerySchema>;

const tools = {
  xquik_request: {
    description: "Call a documented Xquik REST API path under /api/v1/x/.",
    inputSchema: zodToJsonSchema(XquikRequestSchema),
  },
  search_x_posts: {
    description: "Search X posts through Xquik.",
    inputSchema: zodToJsonSchema(SearchXPostsSchema),
  },
  search_x_users: {
    description: "Search X users by name or username through Xquik.",
    inputSchema: zodToJsonSchema(SearchXUsersSchema),
  },
};

const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
    author: "MCP Community",
  },
  {
    capabilities: {
      tools,
    },
  },
);

function getApiKey(): string {
  const apiKey = process.env[API_KEY_ENV];
  if (apiKey === undefined || apiKey.trim() === "") {
    throw new Error(
      `${API_KEY_ENV} is required. Create an API key at https://xquik.com and set it in the server environment.`,
    );
  }
  return apiKey;
}

function getApiBaseUrl(): string {
  const apiBaseUrl = process.env[API_BASE_URL_ENV];
  return apiBaseUrl === undefined || apiBaseUrl.trim() === ""
    ? DEFAULT_API_BASE_URL
    : apiBaseUrl;
}

function appendQuery(url: URL, query: Query | undefined): void {
  if (query === undefined) return;
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }
    url.searchParams.set(key, String(value));
  }
}

function createRequestBody(body: XquikRequest["body"]): string | undefined {
  if (body === undefined) return undefined;
  return typeof body === "string" ? body : JSON.stringify(body);
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text === "") return null;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) return text;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function callXquikApi(input: XquikRequest): Promise<unknown> {
  if (input.method === "GET" && input.body !== undefined) {
    throw new Error("GET requests cannot include a body");
  }

  const apiKey = getApiKey();
  const url = new URL(input.path, getApiBaseUrl());
  appendQuery(url, input.query);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs);
  const body = createRequestBody(input.body);

  try {
    const response = await fetch(url, {
      method: input.method,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": SERVER_NAME,
        "x-api-key": apiKey,
      },
      body,
      signal: controller.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      body: await parseResponseBody(response),
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Xquik request timed out after ${input.timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function compactQuery(query: Query): Query {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => value !== undefined && value !== ""),
  );
}

function searchPostsInput(input: SearchXPosts): XquikRequest {
  return {
    method: "GET",
    path: "/api/v1/x/tweets/search",
    query: compactQuery({
      q: input.q,
      queryType: input.queryType ?? "Latest",
      cursor: input.cursor ?? "",
      limit: input.limit ?? "",
      sinceTime: input.sinceTime ?? "",
      untilTime: input.untilTime ?? "",
    }),
    timeoutMs: input.timeoutMs,
  };
}

function searchUsersInput(input: SearchXUsers): XquikRequest {
  return {
    method: "GET",
    path: "/api/v1/x/users/search",
    query: compactQuery({
      q: input.q,
      cursor: input.cursor ?? "",
    }),
    timeoutMs: input.timeoutMs,
  };
}

function toolResponse(result: unknown) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

server.setRequestHandler(
  CallToolRequestSchema,
  async (request: CallToolRequest) => {
    try {
      if (request.params.arguments === undefined) {
        throw new Error("Arguments are required");
      }

      switch (request.params.name) {
        case "xquik_request": {
          const args = XquikRequestSchema.parse(request.params.arguments);
          return toolResponse(await callXquikApi(args));
        }
        case "search_x_posts": {
          const args = SearchXPostsSchema.parse(request.params.arguments);
          return toolResponse(await callXquikApi(searchPostsInput(args)));
        }
        case "search_x_users": {
          const args = SearchXUsersSchema.parse(request.params.arguments);
          return toolResponse(await callXquikApi(searchUsersInput(args)));
        }
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        const issues = error.issues
          .map((issue: z.ZodIssue) => `${issue.path.join(".")}: ${issue.message}`)
          .join(", ");
        throw new Error(`Invalid arguments: ${issues}`);
      }
      throw error;
    }
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: Object.entries(tools).map(([name, tool]) => ({
      name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  };
});

async function runServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("Xquik MCP Server running on stdio\n");
}

runServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Server error: ${message}\n`);
  process.exit(1);
});
