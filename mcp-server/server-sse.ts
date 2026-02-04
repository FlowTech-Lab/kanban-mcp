/**
 * MCP server over SSE/HTTP for remote connection (e.g. Cursor with type "sse" + url).
 * Set MCP_SSE=1 before loading server.js so stdio is not started.
 */
process.env.MCP_SSE = "1";

import { createServer, IncomingMessage, ServerResponse } from "http";
import { randomUUID } from "crypto";
import { createDBInstance } from "@kanban-mcp/db";
import { KanbanDB } from "@kanban-mcp/db";

const folderPath = process.env.MCP_KANBAN_DB_FOLDER_PATH ?? "./db";
const port = Number(process.env.MCP_SSE_PORT) || 8222;
const host = process.env.MCP_SSE_HOST || "0.0.0.0";

const db = createDBInstance(folderPath);
const kanbanDB = new KanbanDB(db);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SessionEntry = { transport: any; mcpServer: any };

const sessionMap = new Map<string, SessionEntry>();

async function getOrCreateSession(
  sessionId: string | undefined
): Promise<SessionEntry | null> {
  if (sessionId) {
    const entry = sessionMap.get(sessionId);
    return entry ?? null;
  }
  const { StreamableHTTPServerTransport } = await import(
    "@modelcontextprotocol/sdk/server/streamableHttp.js"
  );
  const { createMcpServer } = await import("./server.js");
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });
  const mcpServer = createMcpServer(kanbanDB);
  await mcpServer.connect(transport);
  return { transport, mcpServer };
}

const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  const sessionId = req.headers["mcp-session-id"];
  const sid = (Array.isArray(sessionId) ? sessionId[0] : sessionId) as string | undefined;

  const entry = await getOrCreateSession(sid);
  if (!entry) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Session not found" }));
    return;
  }

  await entry.transport.handleRequest(req, res);

  if (entry.transport.sessionId && !sessionMap.has(entry.transport.sessionId)) {
    sessionMap.set(entry.transport.sessionId, entry);
  }
});

async function main() {
  // Ensure server.js is loaded with MCP_SSE set (no-op, just for side effect)
  await import("./server.js");
  httpServer.listen(port, host, () => {
    console.error(`Kanban MCP SSE server at http://${host}:${port}/ (use this URL in Cursor MCP config)`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

async function shutdown() {
  console.error("Shutting down Kanban MCP SSE server...");
  httpServer.close();
  kanbanDB.close();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
