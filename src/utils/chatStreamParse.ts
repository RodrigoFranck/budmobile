/**
 * Parse one SSE line. Returns delta content when present.
 */
export function parseSseDataLine(line: string): string | null {
  const trimmed = line.replace(/\r$/, '').trim();
  if (!trimmed || trimmed.startsWith(':')) return null;
  if (!trimmed.startsWith('data:')) return null;

  const jsonStr = trimmed.startsWith('data: ')
    ? trimmed.slice(6).trim()
    : trimmed.slice(5).trim();

  if (!jsonStr || jsonStr === '[DONE]') return null;

  try {
    const parsed = JSON.parse(jsonStr) as {
      choices?: Array<{ delta?: { content?: string } }>;
    };
    const content = parsed.choices?.[0]?.delta?.content;
    return typeof content === 'string' && content.length > 0 ? content : null;
  } catch {
    return null;
  }
}

/**
 * Feed incremental SSE text into a line buffer.
 * Keeps the trailing partial line until a newline arrives — avoids dropping mid-token JSON.
 */
export function consumeSseBuffer(
  buffer: string,
  chunk: string,
  onDelta: (deltaText: string) => void,
  options?: { flush?: boolean },
): string {
  const combined = buffer + chunk;
  const parts = combined.split('\n');
  const incomplete = options?.flush ? '' : (parts.pop() ?? '');

  for (const part of parts) {
    const content = parseSseDataLine(part);
    if (content) onDelta(content);
  }

  return incomplete;
}

export function readChatErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === 'object' && 'error' in payload) {
    const error = (payload as { error?: unknown }).error;
    if (typeof error === 'string' && error.trim()) return error;
  }
  return fallback;
}

function readJsonAssistantContent(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;

  const record = payload as {
    content?: unknown;
    choices?: Array<{ message?: { content?: unknown } }>;
  };

  if (typeof record.content === 'string' && record.content.trim()) {
    return record.content;
  }

  const messageContent = record.choices?.[0]?.message?.content;
  if (typeof messageContent === 'string' && messageContent.trim()) {
    return messageContent;
  }

  return null;
}

/**
 * Read a full chat-text body: JSON `{ content }` (new function) or OpenAI SSE (deployed function).
 */
export function extractAssistantContent(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('{')) {
    try {
      const content = readJsonAssistantContent(JSON.parse(trimmed));
      if (content) return content;
    } catch {
      // Fall through to SSE — a streamed body can start with `{` inside a data line.
    }
  }

  let content = '';
  const normalized = trimmed.endsWith('\n') ? trimmed : `${trimmed}\n`;
  consumeSseBuffer('', normalized, (delta) => {
    content += delta;
  }, { flush: true });

  return content.trim() ? content : null;
}

export function parseChatErrorPayload(body: string, fallback: string): string {
  try {
    return readChatErrorMessage(JSON.parse(body), fallback);
  } catch {
    return fallback;
  }
}
