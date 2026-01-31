# Kanban MCP: Cursor configuration and usage

This document describes how to configure the Kanban MCP in Cursor (or any MCP client) and how to choose between global (centralized) and project-local usage.

---

## 1. Cursor MCP configuration

Cursor reads MCP server configuration from user or workspace settings (e.g. Settings → MCP, or the MCP configuration file used by your client). The examples below use the standard `mcpServers` object.

### Option A: Local stdio (Node)

Use when Cursor and the Kanban repo run on the same machine. The client spawns the MCP server process.

```json
{
  "mcpServers": {
    "kanban-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/kanban-mcp/mcp-server/dist/server.js"],
      "env": {
        "MCP_KANBAN_DB_FOLDER_PATH": "/absolute/path/to/kanban-mcp/data"
      }
    }
  }
}
```

Replace paths with your repo and data directory. Build the MCP server once (see README Installation).

### Option B: Local stdio (Docker)

Use when you prefer to run the MCP server in a container on the same machine.

```json
{
  "mcpServers": {
    "kanban-mcp": {
      "command": "docker",
      "args": [
        "run", "--rm", "-i",
        "-v", "/absolute/path/to/data:/mcp",
        "mcp/mcp-kanban"
      ]
    }
  }
}
```

Build the image once: `docker build -t mcp/mcp-kanban .` from the repo root.

### Option C: Global deployment (SSE)

Use when Cursor runs on a different machine than the Kanban server, or when you want one central Kanban instance for all workspaces. The MCP server runs in SSE (Streamable HTTP) mode and is reached by URL.

**1. On the host that runs the Kanban server**

Start the stack (recommended):

```sh
cd /path/to/kanban-mcp
docker compose up -d
```

This starts the Web UI on port 8221 and the MCP SSE server on port 8222, both using the same `./data` volume.

Or run only the MCP SSE server (after building the mcp-server):

```sh
MCP_KANBAN_DB_FOLDER_PATH=/path/to/data npm run start:sse --prefix mcp-server
```

The server listens on `http://0.0.0.0:8222` by default. Override with `MCP_SSE_PORT` and `MCP_SSE_HOST` if needed.

**2. In Cursor (any machine)**

Add to your MCP configuration (e.g. `~/.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "kanban-mcp": {
      "type": "sse",
      "url": "http://<host>:8222/sse",
      "timeout": 30000,
      "alwaysAllow": [
        "create-kanban-board",
        "add-task-to-board",
        "move-task",
        "update-task",
        "delete-task",
        "get-board-info",
        "get-task-info",
        "list-boards"
      ]
    }
  }
}
```

Replace `<host>` with the hostname or IP of the machine where the MCP SSE server runs (e.g. `192.168.0.252`). Ensure port 8222 is reachable from the machine running Cursor (network, firewall, VPN).

**Web UI (global):** Open `http://<host>:8221` in a browser to view and edit the same boards. The UI and MCP server share the same database when using Docker Compose or the same `MCP_KANBAN_DB_FOLDER_PATH`.

---

## 2. Global vs project-local usage

### Global (centralized) mode

- **Setup:** One Kanban instance: one database directory (e.g. `./data`), one Web UI (port 8221), one MCP server. For remote clients, use the MCP SSE server (port 8222).
- **Cursor config:** Same MCP config for all workspaces: either the same `MCP_KANBAN_DB_FOLDER_PATH` (stdio) or the same SSE `url`.
- **Result:** One shared set of boards. The AI can create and update tasks from any project; all boards are visible in the Web UI. Suited for a single company or team backlog, or a personal global todo.

### Project-local mode

- **Setup:** One database per project (e.g. `./data` or `./.kanban` in each repo). Optionally one Web UI instance per project or a shared UI pointing at different data directories.
- **Cursor config:** `MCP_KANBAN_DB_FOLDER_PATH` (or SSE URL) points to the current project’s data directory, so each workspace uses its own boards.
- **Result:** Boards are isolated per project. Suited when each repo should have its own kanban and no shared backlog.

### When to use which

| Need | Mode |
|------|------|
| Single shared backlog across projects and machines | Global (SSE recommended; one URL for all clients). |
| One board per repo, no sharing | Project-local (one DB path or URL per workspace). |
| Same machine, one shared backlog | Global with stdio (same `MCP_KANBAN_DB_FOLDER_PATH` in Cursor for all workspaces). |

---

## 3. Modifications from the original project

This repo includes the following additions and changes:

- **Docker Compose:** `docker-compose.yml` defines two services: `web` (UI + API, port 8221) and `mcp-sse` (MCP over SSE, port 8222). Both mount the same `./data` volume so the database is shared.
- **MCP SSE server:** A second entry point `server-sse.ts` runs the MCP server with the Streamable HTTP transport (SSE). It listens on a configurable host/port (default `0.0.0.0:8222`). The Docker image built from the root `Dockerfile` is used for `mcp-sse` with an overridden `entrypoint` so that `server-sse.js` runs instead of `server.js` (stdio).
- **SDK:** The MCP server uses `@modelcontextprotocol/sdk` 1.25+ for Streamable HTTP support. The original stdio transport is unchanged.
- **Web server:** The web server accepts configurable `HOST` and `PORT` (environment variables) so it can bind to `0.0.0.0` in Docker and be reached from other machines.
- **Documentation:** This file and the README describe global (SSE) and project-local usage and the required Cursor (or generic MCP client) configuration.

The original behaviour (local stdio, single Docker image for MCP only) remains available as described in the README (Options 1 and 2).

---

## 4. References

- [Model Context Protocol – Transports](https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/transports/)
- [Connect to remote MCP servers](https://modelcontextprotocol.io/docs/develop/connect-remote-servers)
- Cursor MCP settings: Settings → MCP in Cursor, or the project/user MCP configuration file.
