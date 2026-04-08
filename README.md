# TikTak MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server for the [TikTak](https://tiktakme.com) time tracking and invoicing API. Connect your AI assistant to manage customers, track time, and create invoices.

## Features

**32 tools** across 7 categories:

| Category | Tools | Examples |
|----------|-------|---------|
| **Customers** | 6 | List, create, bulk import, update, archive |
| **Services** | 5 | List, create, update, archive |
| **Time Tracking** | 9 | Start/stop/continue timers, log entries, running timers |
| **Invoices** | 8 | Create draft, edit line items, change status, view uninvoiced entries |
| **Dashboard** | 1 | Hours, revenue, top customers, daily breakdown |
| **Exports** | 2 | PDF/Excel for log entries and invoices |
| **Settings** | 1 | Company details, defaults (read-only) |

**4 resources** for ambient context: customers, services, running timers, settings.

## Prerequisites

- Node.js 18+
- A TikTak account with an API key (Settings > API Keys, requires Admin role)

## Installation

### Claude Desktop

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tiktak": {
      "command": "npx",
      "args": ["-y", "tiktak-mcp-server"],
      "env": {
        "TIKTAK_API_KEY": "tk_your_api_key_here"
      }
    }
  }
}
```

### Claude Code (CLI)

```bash
claude mcp add tiktak -- npx -y tiktak-mcp-server
```

Then set `TIKTAK_API_KEY` in your environment.

### OpenAI / Gemini / Other MCP Clients

Use the same stdio pattern:

```json
{
  "command": "npx",
  "args": ["-y", "tiktak-mcp-server"],
  "env": {
    "TIKTAK_API_KEY": "tk_your_api_key_here"
  }
}
```

### Global Install

```bash
npm install -g tiktak-mcp-server
tiktak-mcp-server
```

### Docker

```bash
docker run -e TIKTAK_API_KEY=tk_your_key tiktak-mcp-server
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TIKTAK_API_KEY` | Yes | — | Your TikTak API key (`tk_` prefixed) |
| `TIKTAK_API_URL` | No | `https://api.tiktakme.com` | API base URL (for self-hosted or dev) |

## Example Workflows

### Import customers from a spreadsheet

> "Here's my customer list: Acme Corp (VAT: BE0123456789, Brussels), Widget Inc (Amsterdam)..."

The AI will use `create_customers_bulk` to import them all at once.

### Track time

> "Start a timer for Acme Corp on the Consulting service"

Uses `list_customers` → `list_services` → `start_timer`.

> "Stop my running timer"

Uses `get_running_timers` → `stop_timer`.

### Create an invoice

> "Create an invoice for Acme Corp for all uninvoiced work"

Uses `get_uninvoiced_entries` → `create_invoice` (as Draft).

### Dashboard overview

> "How many hours did I track this month? What's my outstanding revenue?"

Uses `get_dashboard_stats`.

## Development

```bash
git clone https://github.com/user/tiktak-mcp-server.git
cd tiktak-mcp-server
npm install
npm run dev  # requires TIKTAK_API_KEY env var
```

### Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx tiktak-mcp-server
```

### Build

```bash
npm run build  # outputs dist/index.js
```

## API Key Security

- API keys are created in the TikTak app by Admin or Owner users
- Keys use the `tk_` prefix and are hashed (SHA256) server-side
- The full key is shown only once at creation — store it securely
- Keys can be revoked anytime in the TikTak app
- Rate limits apply per key (based on your plan tier)

## License

MIT
