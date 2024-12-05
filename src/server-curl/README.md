# @mcp-get-community/server-curl

An MCP server that allows LLMs to make HTTP requests to any URL using a curl-like interface.

## Features

- Make HTTP requests to any URL
- Support for all common HTTP methods (GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS)
- Customizable headers and request body
- Configurable timeout
- Full response information including status, headers, and body

## Installation

```bash
npx @michaellatman/mcp-get@latest install @mcp-get-community/server-curl
```

## Usage

```json
{
  "mcpServers": {
    "@mcp-get-community/server-curl": {
      "runtime": "node",
      "command": "npx",
      "args": [
        "-y",
        "@mcp-get-community/server-curl"
      ]
    }
  }
}
```

The server provides a single tool called `curl` that accepts the following parameters:

- `url` (required): The URL to make the request to
- `method` (optional): HTTP method to use (default: 'GET')
- `headers` (optional): Object containing HTTP headers
- `body` (optional): Request body for POST/PUT/PATCH requests
- `timeout` (optional): Request timeout in milliseconds (default: 30000, max: 300000)

### Example Request

```json
{
  "url": "https://api.example.com/data",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer token123"
  },
  "body": "{\"key\": \"value\"}",
  "timeout": 5000
}
```

### Example Response

```json
{
  "status": 200,
  "statusText": "OK",
  "headers": {
    "content-type": "application/json",
    "server": "nginx"
  },
  "body": "{\"result\": \"success\"}"
}
```

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode
npm run dev
```

## License

MIT 