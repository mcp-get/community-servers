# MCP Get Community Servers

This repository contains a collection of community-maintained Model Context Protocol (MCP) servers. All servers are automatically listed on the [MCP Get registry](https://mcp-get.com) and can be viewed and installed via CLI:

```bash
npx @michaellatman/mcp-get@latest list
```

> **Note:** While we review all servers in this repository, they are maintained by their respective creators who are responsible for their functionality and maintenance.

## Available Servers

- **[LLM.txt Server](src/server-llm-txt)** - A server for searching and retrieving content from [LLM.txt](https://llmstxt.org/) files. Provides tools for listing available files, fetching content, and performing contextual searches.

## Development

To run in development mode with automatic recompilation:

```bash
npm install
npm run watch
```

## Contributing

We welcome contributions! Please feel free to submit a Pull Request.

## License

While this repository's structure and documentation are licensed under the MIT License, individual servers may have their own licenses. Please check each server's documentation in the [src](src) directory for its specific license terms.

## Support

If you find these servers useful, please consider starring the repository!
