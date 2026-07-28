export const VOICE_RESUME_WINDOW_MS = 3 * 60 * 1000;

export interface VoiceTranscriptMessage {
  role: 'user' | 'assistant' | 'context';
  content: string;
  createdAt?: string;
}

/**
 * Split transcript into reveal tokens while keeping stanza breaks (`\n` / `\n\n`).
 * Newline runs are attached to the following word so a stanza appears with its first word.
 */
export function tokenizeTranscriptPreservingBreaks(text: string): string[] {
  const normalized = text.trim().replace(/\r\n/g, '\n');
  if (!normalized) return [];

  const tokens: string[] = [];
  const parts = normalized.split(/(\n+)/);

  for (let i = 0; i < parts.length; i += 1) {
    const part = parts[i];
    if (!part) continue;

    if (part.startsWith('\n')) {
      const next = parts[i + 1];
      if (next && !next.startsWith('\n')) {
        const words = next.trim().split(/\s+/).filter(Boolean);
        if (words.length > 0) {
          tokens.push(`${part}${words[0]}`);
          tokens.push(...words.slice(1));
          i += 1;
          continue;
        }
      }
      tokens.push(part);
      continue;
    }

    tokens.push(...part.trim().split(/\s+/).filter(Boolean));
  }

  return tokens;
}

/** Reassemble reveal tokens into display text with spaces between words and preserved newlines. */
export function joinTranscriptTokens(tokens: string[]): string {
  let result = '';
  for (const token of tokens) {
    if (token.startsWith('\n')) {
      result += token;
      continue;
    }
    if (result.length === 0 || result.endsWith('\n')) {
      result += token;
    } else {
      result += ` ${token}`;
    }
  }
  return result;
}

export function getResumableAssistantTranscript(
  messages: VoiceTranscriptMessage[],
  now = Date.now(),
): string {
  const conversationMessages = messages.filter(
    (message) => message.role === 'user' || message.role === 'assistant',
  );
  if (conversationMessages.length === 0) {
    return '';
  }

  const lastUserMessage = [...conversationMessages]
    .reverse()
    .find((message) => message.role === 'user' && message.content.trim());
  if (!lastUserMessage?.createdAt) {
    return '';
  }

  const lastUserAt = new Date(lastUserMessage.createdAt).getTime();
  if (Number.isNaN(lastUserAt) || now - lastUserAt > VOICE_RESUME_WINDOW_MS) {
    return '';
  }

  const lastAssistantMessage = [...conversationMessages]
    .reverse()
    .find((message) => message.role === 'assistant' && message.content.trim());

  return lastAssistantMessage?.content.trim() ?? '';
}
