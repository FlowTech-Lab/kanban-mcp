# MCP Kanban Task Management

An MCP (Model Context Protocol) tool set providing kanban-based task management for AI-driven development. The AI agent documents and persists its work as tasks on kanban boards, both during planning and execution sessions.

## Highlights

- Column capacity and work-in-progress (WIP) limits
- Move tasks between columns and **reorder tasks within a column** (MCP tool + Web UI drag-and-drop)
- Embedded SQLite database; no external DB required
- Web UI (React, Tailwind CSS) for viewing and editing boards and tasks — responsive (mobile and narrow desktop), New York dark theme
- Predefined MCP prompts for starting and resuming workflows
- **Global deployment**: MCP server over SSE/Streamable HTTP for remote clients (e.g. Cursor from any machine)
- **Docker Compose**: Web UI, API, and MCP SSE server in one stack with a shared database

## Usage

Use the MCP prompts to start a project or to make progress on an existing project. Alternatively, ask the LLM assistant to record its plan by creating a kanban board. To resume work, ask the assistant to locate the board and continue from the next task.

---

## Deployment Modes

| Mode | Use case | MCP client config |
|------|----------|--------------------|
| **Local (stdio)** | Same machine as repo; MCP client spawns the server | `command` + `args` (node or docker) |
| **Global (SSE)** | Remote clients; one central server; shared boards | `type: "sse"` + `url` (recommended for multi-machine) |

The same database can be used by the Web UI and the MCP server so that boards are visible in the browser and editable by the AI from any connected client.

---

## Installation

### Prerequisites

- Node.js 18+ (Node 20+ recommended for Web UI; required for React Router 7)
- npm

### Local build (stdio or SSE from host)

```sh
git clone <repo-url>
cd kanban-mcp

npm ci --prefix shared/db
npm run build --prefix shared/db

npm ci --prefix mcp-server
npm run build --prefix mcp-server
```

For **Web UI and API** (optional):

```sh
npm ci --prefix web-ui
npm ci --prefix web-server
npm run build --prefix web-ui
npm run build --prefix web-server
```

---

## MCP Client Configuration

### Option 1: Local stdio (same machine as repo)

Add to your MCP client config (e.g. Cursor: Settings → MCP, or `~/.cursor/mcp.json`):

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

Replace paths with the actual repo and data directory. The data folder is created if it does not exist.

### Option 2: Local stdio via Docker

Build the MCP image:

```sh
docker build -t mcp/mcp-kanban .
```

Configure the MCP client:

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

### Option 3: Global deployment (MCP over SSE)

Use this when the MCP client (e.g. Cursor) runs on a different machine than the server, or when you want one central Kanban instance for all projects and clients.

The MCP server exposes a **Streamable HTTP** transport (SSE) so clients connect by URL. No shared filesystem is required.

#### 3a. Run with Docker Compose (recommended)

From the repo root:

```sh
docker compose up -d
```

This starts:

- **Web UI and API** on port **8221** (e.g. `http://<host>:8221`)
- **MCP SSE server** on port **8222** (e.g. `http://<host>:8222`)

Both services use the same volume `./data` for the SQLite database.

**After changing the Web UI** (responsive, theme, etc.), rebuild the web image so the container serves the new build:

```sh
docker compose build --no-cache web && docker compose up -d web
```

In your MCP client (e.g. Cursor), add:

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
        "reorder-task-in-column",
        "delete-task",
        "get-board-info",
        "get-task-info",
        "list-boards"
      ]
    }
  }
}
```

Replace `<host>` with the hostname or IP of the machine running Docker Compose (e.g. `192.168.0.252`). Clients on the same network can use this URL; ensure port 8222 is reachable (firewall, VPN, etc.).

#### 3b. Run MCP SSE server manually (no Docker)

On the machine that hosts the database:

```sh
cd /path/to/kanban-mcp
MCP_KANBAN_DB_FOLDER_PATH=/path/to/data npm run start:sse --prefix mcp-server
```

The server listens on `http://0.0.0.0:8222` by default. Override with `MCP_SSE_PORT` and `MCP_SSE_HOST` if needed.

Then configure the MCP client with `type: "sse"` and `url: "http://<host>:8222/sse"` as above.

**Requirements for SSE mode:** `@modelcontextprotocol/sdk` 1.25 or later (included in this repo’s mcp-server).

---

## Web UI

The Web UI is responsive: boards scroll horizontally on narrow viewports (mobile or reduced desktop window); vertical scroll is available where needed.

**Web UI features:**

- List all boards (name, goal, created/updated dates) and open or delete a board
- View a board with its columns (On Hold, To Do, In Progress, Done) and task cards
- Drag and drop tasks between columns (respects WIP limits; API move with optional reason)
- Drag and drop within a column to reorder tasks (e.g. put a card first in To Do)
- Open a task in a side panel: markdown content, edit content, navigate previous/next task
- Delete board with confirmation dialog
- Success and error notifications (e.g. move failed when column is full)

### With Docker Compose

After `docker compose up -d`, open:

- **Web UI:** `http://<host>:8221`

The UI and the MCP server share the same `./data` directory, so boards and tasks are identical in both.

### Without Docker (local run)

Build once (see Installation), then:

```sh
MCP_KANBAN_DB_FOLDER_PATH=/path/to/data npm run start --prefix web-server
```

Open `http://localhost:8221`. Use the same `MCP_KANBAN_DB_FOLDER_PATH` for the MCP server if you want a shared database.

---

## Global vs project-local usage

- **Global (centralized):** One Kanban instance (one DB, one Web UI, one MCP SSE server). All projects and clients point to the same MCP URL or DB path. Suited for a single shared backlog across teams or machines.
- **Project-local:** One DB (and optionally one UI) per project; each workspace uses its own `MCP_KANBAN_DB_FOLDER_PATH` or its own SSE URL. Suited for isolated boards per repo.

See [docs/CURSOR_MCP_AND_USAGE.md](docs/CURSOR_MCP_AND_USAGE.md) for detailed configuration examples and notes.

---

## API

### Tools

| Tool | Description | Main inputs |
|------|-------------|-------------|
| **create-kanban-board** | Create a new board with default columns (On Hold, To Do, In Progress, Done). | `name`, `projectGoal` |
| **add-task-to-board** | Add a task to the board’s landing column (To Do). Content is markdown. | `boardId`, `title`, `content` |
| **move-task** | Move a task to another column; respects WIP limits. | `taskId`, `targetColumnId`, `reason` (optional) |
| **update-task** | Update the markdown content of an existing task. | `taskId`, `content` |
| **reorder-task-in-column** | Change a task’s position within its column (0 = first). | `taskId`, `position` (0-based) |
| **delete-task** | Delete a task. | `taskId` |

**Reorder within a column:** To change the order of a task in its column (e.g. put a card first in To Do), use **reorder-task-in-column** with `taskId` and `position` (0-based: 0 = first, 1 = second, …). Example: after `get-board-info` you see a task in To Do with ID `abc-123` at position 2; call `reorder-task-in-column` with `taskId: "abc-123"` and `position: 0` to move it to the top of the column.

**Reorder vs move:** `move-task` only moves a task *between* columns (and does nothing if the task is already in the target column). Use **reorder-task-in-column** for order changes within the same column.
| **get-board-info** | Return board metadata, columns, and tasks (no task body). | `boardId` |
| **get-task-info** | Return full task including markdown content. | `taskId` |
| **list-boards** | List all boards (name, id, creation time, goal). | None |

### HTTP API (Web server)

The web server (port 8221) exposes a REST API used by the Web UI. Same database as the MCP server.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/boards` | List all boards |
| GET | `/api/boards/:boardId` | Get board with columns and tasks |
| DELETE | `/api/boards/:boardId` | Delete a board |
| GET | `/api/tasks/:taskId` | Get task (full content) |
| PUT | `/api/tasks/:taskId` | Update task content (`body: { content }`) |
| POST | `/api/tasks/:taskId/move` | Move task to another column (`body: { targetColumnId, reason? }`) |
| POST | `/api/tasks/:taskId/reorder` | Reorder task within its column (`body: { position }`, 0-based) |

### Prompts

| Prompt | Description | Input |
|--------|-------------|-------|
| **create-kanban-based-project** | Create a board for a project, then ask the user to break it into tasks and add them. | `description` |
| **make-progress-on-a-project** | Find the project’s board, pick the next task, and work on it (move columns as needed). | `project` (project identifier) |

---

## Project structure

```
kanban-mcp/
├── mcp-server/       # MCP server (stdio + SSE entry points)
├── shared/db/         # SQLite access layer
├── web-server/        # HTTP API + static Web UI
├── web-ui/            # React + Tailwind UI
├── docker-compose.yml # Web + MCP SSE with shared ./data
├── Dockerfile        # MCP server image (stdio; use entrypoint for SSE)
└── Dockerfile.web    # Web UI + API image
```

---

## License

MIT. See [LICENSE](LICENSE).
