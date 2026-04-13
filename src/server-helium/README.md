# @mcp-get-community/server-helium

[![MCP Package](https://mcp-get.com/api/badge/%40mcp-get-community%2Fserver-helium)](https://mcp-get.com/packages/%40mcp-get-community%2Fserver-helium)

Stdio MCP server that bridges to the hosted **Helium MCP** at [Helium Trades](https://heliumtrades.com). The upstream service provides real-time news with bias scoring across thousands of sources, balanced multi-perspective synthesis, live market data, AI-assisted options pricing, trading-strategy context, and meme search. No API key is required for the public tier (subject to upstream limits, including free query allowance).

Upstream MCP URL (streamable HTTP): `https://heliumtrades.com/mcp`

This package uses `@modelcontextprotocol/sdk` streamable HTTP first, with an HTTP+SSE fallback for older deployments.

## Tools (upstream)

The tool list is loaded dynamically from the remote server. As of listing, upstream includes:

- `search_news`
- `search_balanced_news`
- `get_source_bias`
- `get_bias_from_url`
- `get_all_source_biases`
- `get_ticker`
- `get_option_price`
- `get_top_trading_strategies`
- `search_memes`

## Installation

```bash
npx @michaellatman/mcp-get@latest install @mcp-get-community/server-helium
```

## Configuration

Default remote URL is `https://heliumtrades.com/mcp`. Override with:

```bash
export HELIUM_MCP_URL="https://heliumtrades.com/mcp"
```

Example `mcpServers` entry:

```json
{
  "mcpServers": {
    "@mcp-get-community/server-helium": {
      "runtime": "node",
      "command": "npx",
      "args": ["-y", "@mcp-get-community/server-helium"]
    }
  }
}
```

## Maintainer

Service and API: [Helium Trades](https://heliumtrades.com) (Conner Lambden). This bridge package follows the [mcp-get community-servers](https://github.com/mcp-get/community-servers) layout.

## Development

```bash
npm install
npm run build
```

## License

MIT
