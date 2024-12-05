# Contributing Guide for LLMs

## Quick Checklist

- [ ] **Project Structure**
  - [ ] Directory follows `src/server-{name}` pattern
  - [ ] Contains `src/index.ts`, `package.json`, `tsconfig.json`, `README.md`, `LICENSE`

- [ ] **Package Configuration**
  - [ ] Name follows `@mcp-get-community/server-{name}` format
  - [ ] Required dependencies installed
  - [ ] Author set to "Michael Latman <https://michaellatman.com>"
  - [ ] MIT license specified
  - [ ] Repository information included
  - [ ] Publishing configuration:
    - [ ] `"private": false` set
    - [ ] `"bin"` field configured for npx execution
    - [ ] `"files"` field specifies publishable files
    - [ ] `"publishConfig"` set to public access
    - [ ] `"prepublishOnly"` script added

- [ ] **TypeScript Setup**
  - [ ] ES modules support configured
  - [ ] Strict mode enabled
  - [ ] No TypeScript errors

- [ ] **Server Implementation**
  - [ ] Required SDK imports
  - [ ] Zod schemas for tools
  - [ ] Tool descriptions and schemas
  - [ ] Proper error handling
  - [ ] Request handlers implemented

- [ ] **Documentation**
  - [ ] Clear server description
  - [ ] Features list
  - [ ] Installation instructions
  - [ ] Configuration example
  - [ ] Tool documentation
  - [ ] Example requests/responses
  - [ ] Development instructions

- [ ] **Final Steps**
  - [ ] MIT License file created
  - [ ] Root README.md updated
  - [ ] All tests passing
  - [ ] Code properly formatted

This guide walks through the steps for creating a new MCP server in this repository. Follow these steps in order.

## Step 0: Check Existing Servers

Before creating a new server, check the existing servers in the `src` directory for reference:
- [server-llm-txt](src/server-llm-txt) - Example of a server that handles file fetching and searching
- [server-curl](src/server-curl) - Example of a server that makes HTTP requests

These servers demonstrate:
- Proper project structure
- TypeScript configuration
- Error handling patterns
- Documentation standards
- Tool schema definitions
- Request/response formatting

Use them as templates and adapt their patterns to your needs.

## Step 1: Project Structure

Create a new directory in the `src` folder with your server name, following the pattern `server-{name}`. Your directory should have this structure:

```
src/server-{name}/
├── src/
│   └── index.ts       # Main server implementation
├── package.json       # Dependencies and metadata
├── tsconfig.json      # TypeScript configuration
├── README.md         # Documentation
└── LICENSE           # MIT License
```

## Step 2: Package Configuration

Create a `package.json` with:
- Name format: `@mcp-get-community/server-{name}`
- Required dependencies: `@modelcontextprotocol/sdk`, `zod`, `zod-to-json-schema`
- TypeScript development dependencies
- MIT license
- Author and repository information

Example:
```json
{
  "name": "@mcp-get-community/server-{name}",
  "version": "0.1.0",
  "description": "MCP server for ...",
  "main": "dist/index.js",
  "type": "module",
  "private": false,
  "bin": {
    "@mcp-get-community/server-{name}": "./dist/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  },
  "license": "MIT",
  "author": "Michael Latman <https://michaellatman.com>",
  "homepage": "https://github.com/mcp-get-community/server-{name}#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/mcp-get-community/server-{name}.git"
  },
  "bugs": {
    "url": "https://github.com/mcp-get-community/server-{name}/issues"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "prepublishOnly": "npm run build"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "1.0.1",
    "zod": "^3.22.4",
    "zod-to-json-schema": "^3.22.3"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0"
  }
}
```

The package configuration includes several important fields for npm publishing:
- `private`: Must be set to `false` to allow publishing
- `bin`: Makes the server executable via npx, pointing to the compiled JavaScript file
- `files`: Specifies which files should be included in the published package
- `publishConfig`: Ensures the package is published with public access
- `prepublishOnly`: Automatically builds TypeScript before publishing

## Step 3: TypeScript Configuration

Create a `tsconfig.json` with ES modules support:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Step 4: Server Implementation

Create `src/index.ts` with:
1. Required imports from `@modelcontextprotocol/sdk`
2. Zod schemas for tool inputs
3. Tool definitions with descriptions and schemas
4. Server setup with name and version
5. Tool implementation functions
6. Request handlers for tools and listing

Basic template:
```typescript
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

// Define your tool schemas
const YourToolSchema = z.object({
  // ... your schema fields
});

const tools = {
  your_tool: {
    description: "Description of what your tool does",
    inputSchema: zodToJsonSchema(YourToolSchema)
  }
};

const server = new Server({
  name: "@mcp-get-community/server-{name}",
  version: "0.1.0",
  author: "Michael Latman <https://michaellatman.com>"
}, {
  capabilities: {
    tools
  }
});

// Implement your tool functionality
async function yourToolFunction(options: z.infer<typeof YourToolSchema>) {
  // ... your implementation
}

server.setRequestHandler(CallToolRequestSchema, async (request: CallToolRequest) => {
  try {
    if (!request.params.arguments) {
      throw new Error("Arguments are required");
    }

    switch (request.params.name) {
      case "your_tool": {
        const args = YourToolSchema.parse(request.params.arguments);
        const result = await yourToolFunction(args);
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
      const issues = error.issues.map((issue: z.ZodIssue) => 
        `${issue.path.join('.')}: ${issue.message}`).join(', ');
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
  console.error("Server running on stdio");
}

runServer().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
```

## Step 5: Documentation

Create a README.md with:
1. Description of your server
2. Features list
3. Installation instructions using `npx @michaellatman/mcp-get@latest install`
4. Configuration example for `mcpServers` in JSON
5. Tool documentation with parameter descriptions
6. Example requests and responses
7. Development instructions

Example structure:
```markdown
# @mcp-get-community/server-{name}

Description of your server.

## Features

- Feature 1
- Feature 2
- ...

## Installation

```bash
npx @michaellatman/mcp-get@latest install @mcp-get-community/server-{name}
```

## Usage

```json
{
  "mcpServers": {
    "@mcp-get-community/server-{name}": {
      "runtime": "node",
      "command": "npx",
      "args": [
        "-y",
        "@mcp-get-community/server-{name}"
      ]
    }
  }
}
```

Tool documentation and examples...
```

## Step 6: License

Create a LICENSE file with the MIT license:
```
MIT License

Copyright (c) {year} Michael Latman <https://michaellatman.com>

Permission is hereby granted...
```

## Step 7: Update Root README

Add your server to the Available Servers section in the root README.md:
```markdown
- **[Your Server](src/server-{name})** - A brief description of what your server does.
```

## Step 8: Testing

1. Install dependencies: `npm install`
2. Build the project: `npm run build`
3. Test your server with actual LLM requests
4. Verify all TypeScript types are correct
5. Ensure error handling works properly

## Publishing

Once your server is ready:
1. Submit a pull request to this repository
2. Ensure all files are properly formatted and documented
3. Wait for review and approval

Your server will be automatically listed on the MCP Get registry once merged. 