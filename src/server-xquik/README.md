# @mcp-get-community/server-xquik

An MCP server for authenticated requests to the [Xquik](https://docs.xquik.com/api-reference/overview) REST API.

## Features

- Call documented Xquik `/api/v1/x/*` REST endpoints
- Search X posts through `GET /api/v1/x/tweets/search`
- Search X users through `GET /api/v1/x/users/search`
- Configure API key and API base URL with environment variables

## Installation

```bash
npx @michaellatman/mcp-get@latest install @mcp-get-community/server-xquik
```

## Configuration

Create an API key in Xquik, then set it in the server environment.

```json
{
  "mcpServers": {
    "@mcp-get-community/server-xquik": {
      "runtime": "node",
      "command": "npx",
      "args": [
        "-y",
        "@mcp-get-community/server-xquik"
      ],
      "env": {
        "XQUIK_API_KEY": "xq_your_api_key"
      }
    }
  }
}
```

Optional environment variables:

- `XQUIK_API_KEY`: Required. Your Xquik API key.
- `XQUIK_API_BASE_URL`: Optional. Defaults to `https://xquik.com`.

## Tools

### xquik_request

Calls a documented Xquik API path under `/api/v1/x/`.

Parameters:

- `path` (required): API path, for example `/api/v1/x/tweets/search`
- `method` (optional): `GET`, `POST`, `PATCH`, or `DELETE`
- `query` (optional): Query string parameters
- `body` (optional): JSON request body for non-GET requests
- `timeoutMs` (optional): Request timeout in milliseconds

### search_x_posts

Searches X posts through Xquik.

Parameters:

- `q` (required): Search query
- `queryType` (optional): `Latest` or `Top`
- `cursor` (optional): Pagination cursor
- `limit` (optional): Result limit
- `sinceTime` (optional): Lower time bound
- `untilTime` (optional): Upper time bound
- `timeoutMs` (optional): Request timeout in milliseconds

### search_x_users

Searches X users by name or username.

Parameters:

- `q` (required): Search query
- `cursor` (optional): Pagination cursor
- `timeoutMs` (optional): Request timeout in milliseconds

## Development

```bash
npm install
npm run build
```

## License

MIT
