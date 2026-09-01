import browser from 'webextension-polyfill';
import { getSettings } from '../../lib/browser/storage';
import { siderLogError, siderLogInfo, siderLogWarn } from '../../lib/browser/sider-log';
import type { AppSettings } from '../../lib/shared/types';

let socket: WebSocket | null = null;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let currentUrl: string = '';
let isEnabled: boolean = false;
let isConnecting: boolean = false;

export async function initMcpBridgeClient(): Promise<void> {
  const settings = await getSettings();
  isEnabled = settings.mcpBridgeEnabled ?? false;
  currentUrl = settings.mcpBridgeUrl ?? 'ws://localhost:3000';

  if (isEnabled) {
    connectBridge();
  }

  // Watch for settings changes
  browser.storage.onChanged.addListener((changes) => {
    if (changes['settings.data']) {
      const newSettings = changes['settings.data'].newValue as Partial<AppSettings> | undefined;
      if (newSettings) {
        const nextEnabled = newSettings.mcpBridgeEnabled ?? false;
        const nextUrl = newSettings.mcpBridgeUrl ?? 'ws://localhost:3000';

        if (nextEnabled !== isEnabled || nextUrl !== currentUrl) {
          isEnabled = nextEnabled;
          currentUrl = nextUrl;
          disconnectBridge();
          if (isEnabled) {
            connectBridge();
          }
        }
      }
    }
  });
}

function disconnectBridge(): void {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  if (socket) {
    siderLogInfo('mcp-bridge', 'Disconnecting from bridge');
    socket.close();
    socket = null;
  }
  isConnecting = false;
}

function connectBridge(): void {
  if (socket || isConnecting) return;

  isConnecting = true;
  const wsUrl = currentUrl.endsWith('/extension') 
    ? currentUrl 
    : (currentUrl.replace(/\/$/, '') + '/extension');

  siderLogInfo('mcp-bridge', 'Connecting to bridge', { wsUrl });

  try {
    const ws = new WebSocket(wsUrl);
    socket = ws;

    ws.onopen = () => {
      siderLogInfo('mcp-bridge', 'Connection established successfully');
      isConnecting = false;
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, requestId } = message;

        if (!type || !requestId) {
          siderLogWarn('mcp-bridge', 'Invalid message format received', { data: event.data });
          return;
        }

        siderLogInfo('mcp-bridge', 'Received request', { type, requestId });

        if (type === 'get_active_tab_context') {
          await handleActiveTabContext(requestId);
        } else if (type === 'get_recent_conversations') {
          await handleRecentConversations(requestId);
        } else {
          ws.send(JSON.stringify({
            type: 'response',
            requestId,
            error: `Unsupported tool/request type: ${type}`
          }));
        }
      } catch (err: any) {
        siderLogError('mcp-bridge', 'Error parsing or handling bridge message', { error: String(err) });
      }
    };

    ws.onerror = (err) => {
      siderLogError('mcp-bridge', 'Socket error', { error: String(err) });
    };

    ws.onclose = () => {
      siderLogInfo('mcp-bridge', 'Socket closed');
      socket = null;
      isConnecting = false;
      if (isEnabled) {
        scheduleReconnect();
      }
    };
  } catch (err) {
    siderLogError('mcp-bridge', 'Failed to create WebSocket', { error: String(err) });
    isConnecting = false;
    scheduleReconnect();
  }
}

function scheduleReconnect(): void {
  if (reconnectTimeout) return;
  siderLogInfo('mcp-bridge', 'Scheduling reconnect in 3 seconds');
  reconnectTimeout = setTimeout(() => {
    reconnectTimeout = null;
    if (isEnabled) {
      connectBridge();
    }
  }, 3000);
}

async function handleActiveTabContext(requestId: string): Promise<void> {
  if (!socket) return;

  try {
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    if (!activeTab || !activeTab.id) {
      socket.send(JSON.stringify({
        type: 'response',
        requestId,
        error: 'No active tab found. Please make sure a browser window/tab is active.'
      }));
      return;
    }

    // Request context from content script on active tab
    const response = (await browser.tabs.sendMessage(activeTab.id, { type: 'GET_ACTIVE_TAB_CONTEXT' })) as
      | { success?: boolean; context?: unknown; error?: string }
      | undefined;
    if (response && response.success) {
      socket.send(JSON.stringify({
        type: 'response',
        requestId,
        data: response.context
      }));
    } else {
      socket.send(JSON.stringify({
        type: 'response',
        requestId,
        error: response?.error || 'Failed to parse page context.'
      }));
    }
  } catch (err: any) {
    socket.send(JSON.stringify({
      type: 'response',
      requestId,
      error: `Could not reach content script on the active tab: ${err.message}. Please refresh the page and try again.`
    }));
  }
}

async function handleRecentConversations(requestId: string): Promise<void> {
  if (!socket) return;

  try {
    const res = await browser.storage.local.get('chat.conversations');
    const conversations = res['chat.conversations'] || [];
    socket.send(JSON.stringify({
      type: 'response',
      requestId,
      data: conversations
    }));
  } catch (err: any) {
    socket.send(JSON.stringify({
      type: 'response',
      requestId,
      error: `Failed to fetch conversations: ${err.message}`
    }));
  }
}
