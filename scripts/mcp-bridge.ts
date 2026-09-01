import readline from 'readline';
import type { ServerWebSocket } from 'bun';

type ExtensionResponse = {
  type?: string;
  requestId?: string;
  error?: string;
  data?: unknown;
};

type McpRequest = {
  method?: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
  };
  id?: string | number;
};

// Setup readline to communicate with the IDE (MCP client) over stdio
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

const pendingResponses = new Map<string, (res: ExtensionResponse) => void>();
let extensionSocket: ServerWebSocket<undefined> | null = null;

// Start the WebSocket server using Bun.serve() for the extension connection
const PORT = Number(process.env.PORT || 3000);
const server = Bun.serve({
  port: PORT,
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === '/extension') {
      const success = server.upgrade(req);
      if (success) return undefined;
      return new Response('WebSocket upgrade failed', { status: 400 });
    }
    return new Response('Cider4Me MCP Bridge is running. Connect to ws://localhost:PORT/extension from the browser extension.', { status: 200 });
  },
  websocket: {
    open(ws) {
      console.error('[Bridge] Browser extension connected via WebSocket');
      extensionSocket = ws;
    },
    message(ws, msg) {
      try {
        const parsed = JSON.parse(msg.toString());
        if (parsed.type === 'response' && parsed.requestId) {
          const resolve = pendingResponses.get(parsed.requestId);
          if (resolve) {
            pendingResponses.delete(parsed.requestId);
            resolve(parsed);
          }
        }
      } catch (err) {
        console.error('[Bridge] Error parsing WS message:', err instanceof Error ? err.message : err);
      }
    },
    close(ws) {
      console.error('[Bridge] Browser extension disconnected');
      if (extensionSocket === ws) {
        extensionSocket = null;
      }
    }
  }
});

console.error(`[Bridge] WebSocket server listening on ws://localhost:${server.port}/extension`);

// Handle incoming IDE requests from stdio
rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const request = JSON.parse(line);
    handleMcpRequestAsync(request);
  } catch (err) {
    console.error('[Bridge] Failed to parse input line:', err instanceof Error ? err.message : err);
  }
});

function sendStdout(msg: Record<string, unknown>) {
  process.stdout.write(JSON.stringify(msg) + '\n');
}

async function requestExtensionAsync(type: string): Promise<ExtensionResponse> {
  const requestId = Math.random().toString(36).substring(2, 9);
  return new Promise((resolve) => {
    pendingResponses.set(requestId, resolve);

    if (!extensionSocket) {
      pendingResponses.delete(requestId);
      resolve({ error: 'No browser extension is currently connected to the Cider4Me Bridge. Make sure the extension is active, the tab is loaded, and mcp bridge is enabled.' });
      return;
    }

    extensionSocket.send(JSON.stringify({ type, requestId }));

    setTimeout(() => {
      if (pendingResponses.has(requestId)) {
        pendingResponses.delete(requestId);
        resolve({ error: 'Request to browser extension timed out (5s)' });
      }
    }, 5000);
  });
}

async function handleMcpRequestAsync(req: McpRequest) {
  const { method, params, id } = req;
  if (!method) return;

  if (method === 'initialize') {
    sendStdout({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'cider4me-bridge',
          version: '0.1.0'
        }
      }
    });
  } else if (method === 'tools/list') {
    sendStdout({
      jsonrpc: '2.0',
      id,
      result: {
        tools: [
          {
            name: 'get_active_tab_context',
            description: 'Get the current page URL, page title, selected text context, and page text contents of the active browser tab in Cider4Me.',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          },
          {
            name: 'get_recent_conversations',
            description: 'Get the recent chat history and conversations from the Cider4Me browser extension.',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      }
    });
  } else if (method === 'tools/call') {
    const name = params?.name;
    if (name === 'get_active_tab_context') {
      const response = await requestExtensionAsync('get_active_tab_context');
      if (response.error) {
        sendStdout({
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [{ type: 'text', text: `Error: ${response.error}` }]
          }
        });
      } else {
        const contextStr = JSON.stringify(response.data, null, 2);
        sendStdout({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: contextStr }]
          }
        });
      }
    } else if (name === 'get_recent_conversations') {
      const response = await requestExtensionAsync('get_recent_conversations');
      if (response.error) {
        sendStdout({
          jsonrpc: '2.0',
          id,
          result: {
            isError: true,
            content: [{ type: 'text', text: `Error: ${response.error}` }]
          }
        });
      } else {
        const conversationsStr = JSON.stringify(response.data, null, 2);
        sendStdout({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: conversationsStr }]
          }
        });
      }
    } else {
      sendStdout({
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Method not found: ${name}`
        }
      });
    }
  } else {
    if (id !== undefined) {
      sendStdout({
        jsonrpc: '2.0',
        id,
        result: {}
      });
    }
  }
}
