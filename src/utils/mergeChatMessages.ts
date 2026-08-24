import type { StreamingMessage } from '@/types/messages';

type DbMessage = {
  id: string | number;
  role: string;
  content: string;
  created_at?: string;
};

let streamingMessageSeq = 0;

export function createStreamingMessageId(role: 'user' | 'assistant' | 'context'): string {
  streamingMessageSeq += 1;
  return `${role}-${Date.now()}-${streamingMessageSeq}`;
}

export function mergeDbAndStreamingMessages(
  dbMessages: DbMessage[],
  streamingMessages: StreamingMessage[],
  persistentClientIds: Map<string, string | number> = new Map(),
) {
  const clientIdsByContent = new Map<string, Array<string | number>>();
  const revealingKeys = new Set<string>();

  const pushClientId = (key: string, id: string | number) => {
    const existing = clientIdsByContent.get(key);
    if (existing) {
      existing.push(id);
      return;
    }
    clientIdsByContent.set(key, [id]);
  };

  persistentClientIds.forEach((id, key) => {
    pushClientId(key, id);
  });

  streamingMessages.forEach((msg) => {
    const key = `${msg.role}:${msg.content}`;
    pushClientId(key, msg.id);
    if (msg.isRevealing) {
      revealingKeys.add(key);
    }
  });

  const usedClientIds = new Set<string>();

  const takeClientId = (key: string): string | number | undefined => {
    const queue = clientIdsByContent.get(key);
    while (queue?.length) {
      const candidate = queue.shift();
      if (candidate == null) continue;
      const candidateKey = String(candidate);
      if (usedClientIds.has(candidateKey)) continue;
      usedClientIds.add(candidateKey);
      return candidate;
    }
    return undefined;
  };

  const dbMessagesFormatted = dbMessages
    .filter((msg) => !revealingKeys.has(`${msg.role}:${msg.content}`))
    .map((msg) => ({
      id: takeClientId(`${msg.role}:${msg.content}`) ?? msg.id,
      role: msg.role as 'user' | 'assistant' | 'context',
      content: msg.content,
      createdAt: msg.created_at,
    }));

  const dbContents = new Set(dbMessages.map((m) => `${m.role}:${m.content}`));
  const filteredStreaming = streamingMessages.filter((msg) => {
    if (usedClientIds.has(String(msg.id))) {
      return false;
    }
    if (msg.isStreaming || msg.isRevealing) {
      return true;
    }
    return !dbContents.has(`${msg.role}:${msg.content}`);
  });

  const merged = [
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

  const seenIds = new Set<string>();
  return merged.map((msg, index) => {
    const baseId = String(msg.id);
    if (!seenIds.has(baseId)) {
      seenIds.add(baseId);
      return msg;
    }

    const uniqueId = `${baseId}-dup-${index}`;
    seenIds.add(uniqueId);
    return { ...msg, id: uniqueId };
  });
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
