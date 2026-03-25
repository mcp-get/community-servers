# @mcp-get-community/server-operant-mcp

An MCP server for security testing, powered by [operant-mcp](https://github.com/operantlabs/operant-mcp). Provides 51 tools for penetration testing, network forensics, memory analysis, and vulnerability assessment.

## Features

- **Penetration Testing**: SQL injection, XSS, SSRF, CSRF, path traversal, command injection
- **Network Forensics**: PCAP analysis, DNS analysis, TLS inspection, credential extraction
- **Memory Analysis**: Rootkit detection, volatility analysis for Windows and Linux
- **Vulnerability Assessment**: Authentication brute force, IDOR testing, deserialization attacks
- **Reconnaissance**: DNS enumeration, directory brute force, S3 bucket discovery, Git secrets scanning
- **Cloud Security**: CloudTrail analysis, cloud metadata SSRF testing

## Installation

```bash
npx @michaellatman/mcp-get@latest install @mcp-get-community/server-operant-mcp
```

## Usage

```json
{
  "mcpServers": {
    "@mcp-get-community/server-operant-mcp": {
      "runtime": "node",
      "command": "npx",
      "args": [
        "-y",
        "@mcp-get-community/server-operant-mcp"
      ]
    }
  }
}
```

The server provides a tool called `operant_run` that accepts the following parameters:

- `tool` (required): The operant-mcp tool name to execute (e.g., `recon_quick`, `sqli_login_bypass`, `xss_reflected_test`)
- `args` (optional): Arguments to pass to the tool as key-value pairs

### Available Tools

Some of the 51 available security tools include:

- `recon_quick` - Quick reconnaissance scan
- `recon_dns` - DNS enumeration
- `sqli_login_bypass` - SQL injection login bypass
- `sqli_union_extract` - SQL injection union-based extraction
- `xss_reflected_test` - Reflected XSS testing
- `ssrf_test` - Server-side request forgery testing
- `pcap_overview` - PCAP file analysis overview
- `pcap_extract_credentials` - Extract credentials from PCAP
- `memory_detect_rootkit` - Memory-based rootkit detection
- `cors_test` - CORS misconfiguration testing
- `path_traversal_test` - Path traversal vulnerability testing

### Example Request

```json
{
  "tool": "recon_quick",
  "args": {
    "target": "example.com"
  }
}
```

### Example Response

```json
{
  "tool": "recon_quick",
  "output": "Scan results for example.com...",
  "errors": null
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
