# @mcp-get-community/server-macos

A Model Context Protocol server that provides macOS-specific system information and operations.

## Features

- System information retrieval (CPU, Memory, Disk, Network)
- Native macOS notifications

## Installation

```bash
npx @michaellatman/mcp-get@latest install @mcp-get-community/server-macos
```

## Configuration

Add this to your configuration:

```json
{
  "mcpServers": {
    "@mcp-get-community/server-macos": {
      "runtime": "node",
      "command": "npx",
      "args": [
        "-y",
        "@mcp-get-community/server-macos"
      ]
    }
  }
}
```

## Tools

### systemInfo

Retrieves system information from macOS.

Parameters:
- `category` (required): One of 'cpu', 'memory', 'disk', 'network', or 'all'

Example:
```json
{
  "name": "systemInfo",
  "arguments": {
    "category": "cpu"
  }
}
```

### sendNotification

Sends a native macOS notification.

Parameters:
- `title` (required): Title of the notification
- `message` (required): Content of the notification
- `sound` (optional): Whether to play a sound (default: true)

Example:
```json
{
  "name": "sendNotification",
  "arguments": {
    "title": "Hello",
    "message": "This is a test notification",
    "sound": true
  }
}
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Run in development mode:
```bash
npm run dev
```

## License

MIT 