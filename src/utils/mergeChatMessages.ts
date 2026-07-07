import type { StreamingMessage } from '@/types/messages';

type DbMessage = {
  id: string | number;
  role: string;
  content: string;
  created_at?: string;
};

export function mergeDbAndStreamingMessages(
  dbMessages: DbMessage[],
  streamingMessages: StreamingMessage[],
  persistentClientIds: Map<string, string | number> = new Map(),
) {
  const clientIdByContent = new Map<string, string | number>(persistentClientIds);
  const revealingKeys = new Set<string>();

  streamingMessages.forEach((msg) => {
    clientIdByContent.set(`${msg.role}:${msg.content}`, msg.id);
    if (msg.isRevealing) {
      revealingKeys.add(`${msg.role}:${msg.content}`);
    }
  });

  const dbMessagesFormatted = dbMessages
    .filter((msg) => !revealingKeys.has(`${msg.role}:${msg.content}`))
    .map((msg) => ({
      id: clientIdByContent.get(`${msg.role}:${msg.content}`) ?? msg.id,
      role: msg.role as 'user' | 'assistant' | 'context',
      content: msg.content,
      createdAt: msg.created_at,
    }));

  const dbContents = new Set(dbMessages.map((m) => `${m.role}:${m.content}`));
  const filteredStreaming = streamingMessages.filter(
    (msg) =>
      !dbContents.has(`${msg.role}:${msg.content}`) ||
      msg.isStreaming ||
      msg.isRevealing,
  );

  return [
    ...dbMessagesFormatted,
    ...filteredStreaming.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt,
      isStreaming: msg.isStreaming,
      isRevealing: msg.isRevealing,
    })),
  ];
}

function buildMessageClientKey(role: string, content: string) {
  return `${role}:${content}`;
}

export function registerMessageClientId(
  registry: Map<string, string | number>,
  role: string,
  content: string,
  clientId: string | number,
) {
  registry.set(buildMessageClientKey(role, content), clientId);
}

export function clearMessageClientIds(registry: Map<string, string | number>) {
  registry.clear();
}
