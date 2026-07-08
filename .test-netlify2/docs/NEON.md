# Neon + Cursor

Foundry uses Neon Postgres. The **Cursor plugin** is separate from the app connection string — it gives the AI assistant MCP tools to manage your Neon project (run SQL, create branches, list databases).

## App database (already configured)

`.env` should have:

- `DATABASE_URL` — pooled string (`-pooler` in hostname) for runtime
- `DIRECT_URL` — direct string (no `-pooler`) for Prisma migrations

Run migrations: `npm run setup:neon`

## Cursor Neon plugin (recommended)

**Option A — Marketplace (easiest)**

1. In Cursor chat, run: `/add-plugin neon-postgres`
2. Or open [cursor.com/marketplace/neon](https://cursor.com/marketplace/neon) → **Add to Cursor**
3. Prompt: `Get started with Neon` and complete OAuth

**Option B — CLI auto-setup**

```bash
npx neon@latest init
```

This authenticates via browser, creates an API key, and configures the Neon MCP server + agent skills for Cursor.

## What the plugin gives you

- **Neon MCP server** — list projects, run SQL, create branches from chat
- **neon-postgres skills** — ORM setup, branching workflows, connection best practices
- **VS Code extension** (bundled) — database explorer in the sidebar

## Manual MCP config (if needed)

Create `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "neon": {
      "command": "npx",
      "args": ["-y", "@neondatabase/mcp-server-neon", "start", "YOUR_NEON_API_KEY"]
    }
  }
}
```

Get an API key from [console.neon.tech](https://console.neon.tech) → Account → API keys.

Then enable the server in **Cursor Settings → Tools & MCP**.

## Netlify

Add the same `DATABASE_URL` and `DIRECT_URL` in Netlify environment variables (not in git).
